#!/usr/bin/env python3
"""Empaqueta glosas españolas verificadas en un lote reproducible y reversible.

Este archivo NO conecta a Supabase y NO aplica cambios. Recibe el JSONL producido
por `spanish_gloss_pipeline.py`, conserva únicamente filas aprobables y genera:

- un JSONL canónico con `batch_id` y semilla SHA-256 dentro de provenance;
- un manifiesto de auditoría con SHA-256 final del payload;
- una sentencia SQL de reversión para filas insertadas por ese lote.

La aplicación posterior debe ser INSERT-ONLY (`ON CONFLICT DO NOTHING`) para que
la reversión por `batch_id` nunca elimine ni sobrescriba filas preexistentes.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import uuid
from collections import Counter
from pathlib import Path
from typing import Iterable

APPROVABLE_STATUSES = {"verified_derived", "manual_approved"}
BATCH_PREFIX = "fase_h_b3_es"


def normalized_text(value: object) -> str:
    return " ".join(str(value or "").strip().split())


def read_jsonl(path: Path) -> Iterable[dict[str, object]]:
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        row = json.loads(line)
        status = normalized_text(row.get("status"))
        if not status:
            raise ValueError(f"Fila sin status en línea {line_number}")
        yield row


def validate_approvable(row: dict[str, object], line_label: str) -> None:
    lexical_entry_id = normalized_text(row.get("lexical_entry_id"))
    lexical_id = normalized_text(row.get("lexical_id"))
    spanish = normalized_text(row.get("display_gloss_es"))
    source_snapshot = normalized_text(row.get("source_gloss_snapshot"))
    status = normalized_text(row.get("status"))
    method = normalized_text(row.get("derivation_method"))

    try:
        uuid.UUID(lexical_entry_id)
    except (ValueError, AttributeError) as exc:
        raise ValueError(f"UUID inválido en {line_label}: {lexical_entry_id!r}") from exc

    if not lexical_id or not re.fullmatch(r"H\d{4}[A-Z]?", lexical_id):
        raise ValueError(f"lexical_id inválido en {line_label}: {lexical_id!r}")
    if not spanish:
        raise ValueError(f"Glosa española vacía en {line_label}")
    if not source_snapshot:
        raise ValueError(f"Snapshot inglés vacío en {line_label}")
    if status not in APPROVABLE_STATUSES:
        raise ValueError(f"Status no aprobable en {line_label}: {status!r}")
    if not method:
        raise ValueError(f"Método de derivación vacío en {line_label}")


def canonical_row(row: dict[str, object]) -> dict[str, object]:
    return {
        "lexical_entry_id": normalized_text(row.get("lexical_entry_id")),
        "lexical_id": normalized_text(row.get("lexical_id")),
        "display_gloss_es": normalized_text(row.get("display_gloss_es")),
        "alternative_glosses_es": [
            normalized_text(value)
            for value in (row.get("alternative_glosses_es") or [])
            if normalized_text(value)
        ],
        "confidence": int(row.get("confidence") or 0),
        "derivation_method": normalized_text(row.get("derivation_method")),
        "source_gloss_snapshot": normalized_text(row.get("source_gloss_snapshot")),
        "status": normalized_text(row.get("status")),
        "provenance": dict(row.get("provenance") or {}),
    }


def payload_bytes(rows: list[dict[str, object]]) -> bytes:
    return "".join(
        json.dumps(row, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n"
        for row in rows
    ).encode("utf-8")


def build_batch(
    rows: list[dict[str, object]],
    require_complete: bool,
) -> tuple[list[dict[str, object]], dict[str, object]]:
    statuses = Counter(normalized_text(row.get("status")) for row in rows)
    unresolved = statuses["candidate"] + statuses["pending"]
    if require_complete and unresolved:
        raise ValueError(
            f"Cobertura incompleta: candidate={statuses['candidate']} pending={statuses['pending']}"
        )

    accepted_raw = [row for row in rows if normalized_text(row.get("status")) in APPROVABLE_STATUSES]
    accepted: list[dict[str, object]] = []
    seen_ids: set[str] = set()
    for index, row in enumerate(accepted_raw, 1):
        validate_approvable(row, f"fila aprobable {index}")
        canonical = canonical_row(row)
        lexical_entry_id = str(canonical["lexical_entry_id"])
        if lexical_entry_id in seen_ids:
            raise ValueError(f"lexical_entry_id duplicado: {lexical_entry_id}")
        seen_ids.add(lexical_entry_id)
        accepted.append(canonical)

    accepted.sort(key=lambda row: str(row["lexical_entry_id"]))
    seed_sha = hashlib.sha256(payload_bytes(accepted)).hexdigest()
    batch_id = f"{BATCH_PREFIX}_{seed_sha[:16]}"

    stamped: list[dict[str, object]] = []
    for row in accepted:
        provenance = dict(row.get("provenance") or {})
        provenance.update({
            "batch_id": batch_id,
            "batch_seed_sha256": seed_sha,
            "application_policy": "insert_only_on_conflict_do_nothing",
        })
        stamped.append({**row, "provenance": provenance})

    final_sha = hashlib.sha256(payload_bytes(stamped)).hexdigest()
    manifest = {
        "phase": "FASE_H_BLOQUE_3",
        "batch_id": batch_id,
        "batch_seed_sha256": seed_sha,
        "batch_sha256": final_sha,
        "input_total": len(rows),
        "accepted_rows": len(stamped),
        "statuses": dict(statuses),
        "non_final_rows": unresolved,
        "application_policy": "insert_only_on_conflict_do_nothing",
        "touches_authoritative_lexicon": False,
        "rollback_scope": "rows_inserted_by_batch_id_only",
    }
    return stamped, manifest


def rollback_sql(batch_id: str) -> str:
    safe = batch_id.replace("'", "''")
    return (
        "-- Reversión exacta del lote FASE H / Bloque 3.\n"
        "-- Solo elimina filas creadas por este lote; no toca el léxico autoritativo.\n"
        "delete from public.biblical_hebrew_spanish_glosses\n"
        f"where provenance->>'batch_id' = '{safe}'\n"
        "  and provenance->>'application_policy' = 'insert_only_on_conflict_do_nothing';\n"
    )


def self_test() -> None:
    sample = [
        {
            "lexical_entry_id": "00000000-0000-4000-8000-000000000001",
            "lexical_id": "H0001",
            "display_gloss_es": "padre",
            "alternative_glosses_es": [],
            "confidence": 97,
            "derivation_method": "test_v1",
            "source_gloss_snapshot": "father",
            "status": "verified_derived",
            "provenance": {"context_used_as_meaning": False},
        },
        {
            "lexical_entry_id": "00000000-0000-4000-8000-000000000002",
            "lexical_id": "H0002",
            "display_gloss_es": None,
            "alternative_glosses_es": [],
            "confidence": 0,
            "derivation_method": "unresolved_v1",
            "source_gloss_snapshot": "unknown",
            "status": "pending",
            "provenance": {},
        },
    ]
    batch, manifest = build_batch(sample, require_complete=False)
    assert len(batch) == 1
    assert manifest["accepted_rows"] == 1
    assert manifest["non_final_rows"] == 1
    assert batch[0]["provenance"]["application_policy"] == "insert_only_on_conflict_do_nothing"
    assert manifest["batch_sha256"] == hashlib.sha256(payload_bytes(batch)).hexdigest()
    assert "biblical_hebrew_spanish_glosses" in rollback_sql(str(manifest["batch_id"]))
    try:
        build_batch(sample, require_complete=True)
    except ValueError:
        pass
    else:
        raise AssertionError("require_complete debía rechazar filas pendientes")
    print("self-test OK")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--candidates-jsonl", type=Path)
    parser.add_argument("--batch-jsonl", type=Path)
    parser.add_argument("--manifest", type=Path)
    parser.add_argument("--rollback-sql", type=Path)
    parser.add_argument("--require-complete", action="store_true")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return 0

    required = [args.candidates_jsonl, args.batch_jsonl, args.manifest, args.rollback_sql]
    if any(value is None for value in required):
        parser.error("Se requieren candidates, batch, manifest y rollback-sql")

    rows = list(read_jsonl(args.candidates_jsonl))
    batch, manifest = build_batch(rows, require_complete=args.require_complete)

    args.batch_jsonl.parent.mkdir(parents=True, exist_ok=True)
    args.batch_jsonl.write_bytes(payload_bytes(batch))
    args.manifest.parent.mkdir(parents=True, exist_ok=True)
    args.manifest.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    args.rollback_sql.parent.mkdir(parents=True, exist_ok=True)
    args.rollback_sql.write_text(rollback_sql(str(manifest["batch_id"])), encoding="utf-8")

    print(json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
