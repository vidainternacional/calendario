#!/usr/bin/env python3
"""Audita el payload determinista de Jonás sin modificar Supabase."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

HASH_RE = re.compile(r"^[0-9a-f]{64}$")
LEXICAL_RE = re.compile(r"^H[0-9]{4}[A-Z]?$")
STRONG_RE = re.compile(r"^H[0-9]{4}$")

EXPECTED_COUNTS = {
    "references": 48,
    "visible_words": 688,
    "occurrences": 1080,
    "lexical_ids": 288,
    "source_variant_rows": 0,
    "variants": 0,
    "qere_omissions": 0,
}
EXPECTED_PACKAGE_SHA = "083b869fe7d10493deaeee392babd9811e9dffb91f0db816d2f21a22b2135915"


def canonical_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def canonical_payload_hash(payload: dict[str, Any]) -> str:
    base = dict(payload)
    base.pop("payload_sha256", None)
    return hashlib.sha256(canonical_json(base).encode("utf-8")).hexdigest()


def audit(payload: dict[str, Any], file_sha256: str) -> dict[str, Any]:
    if payload.get("schema_version") != "vida-tahot-import-payload-v1":
        raise RuntimeError("Versión de payload inesperada")
    if payload.get("book") != {
        "step_code": "Jon",
        "internal_code": "JON",
        "name_es": "Jonás",
    }:
        raise RuntimeError(f"Identidad de Jonás inesperada: {payload.get('book')}")
    if payload.get("package_sha256") != EXPECTED_PACKAGE_SHA:
        raise RuntimeError("El payload no deriva del paquete fijado de Jonás")
    if payload.get("spanish_editorial_fields_complete") is not False:
        raise RuntimeError("La capa editorial española no debe marcarse completa")

    counts = payload.get("counts", {})
    mismatches = {
        key: {"expected": expected, "actual": counts.get(key)}
        for key, expected in EXPECTED_COUNTS.items()
        if counts.get(key) != expected
    }
    if mismatches:
        raise RuntimeError(f"Conteos del payload inesperados: {mismatches}")

    arrays = {
        "references": payload.get("verse_texts", []),
        "occurrences": payload.get("occurrences", []),
        "lexical_ids": payload.get("lexical_entries", []),
        "variants": payload.get("variants", []),
    }
    for count_key, rows in arrays.items():
        if len(rows) != counts[count_key]:
            raise RuntimeError(
                f"Longitud interna inválida para {count_key}: {len(rows)} != {counts[count_key]}"
            )

    if payload["variants"]:
        raise RuntimeError("Jonás no debe producir variantes estructuradas")

    expected_internal_hash = canonical_payload_hash(payload)
    if payload.get("payload_sha256") != expected_internal_hash:
        raise RuntimeError(
            f"Huella canónica interna inválida: {payload.get('payload_sha256')} != {expected_internal_hash}"
        )

    invalid_hashes = 0
    for collection in ("lexical_entries", "occurrences", "verse_texts", "variants"):
        invalid_hashes += sum(
            not HASH_RE.fullmatch(str(item.get("content_hash", "")))
            for item in payload[collection]
        )
    invalid_hashes += sum(
        not HASH_RE.fullmatch(str(item.get("source_line_sha256", "")))
        for item in payload["occurrences"]
    )
    if invalid_hashes:
        raise RuntimeError(f"Hashes inválidos: {invalid_hashes}")

    lexical_ids = [entry["lexical_id"] for entry in payload["lexical_entries"]]
    if len(set(lexical_ids)) != len(lexical_ids):
        raise RuntimeError("Entradas léxicas duplicadas")
    if any(not LEXICAL_RE.fullmatch(item) for item in lexical_ids):
        raise RuntimeError("Identificadores léxicos inválidos")
    if any(
        not STRONG_RE.fullmatch(str(entry.get("strong_number", "")))
        for entry in payload["lexical_entries"]
    ):
        raise RuntimeError("Números Strong inválidos")
    if any(not str(entry.get("lemma", "")).strip() for entry in payload["lexical_entries"]):
        raise RuntimeError("Entradas léxicas sin lema canónico")

    occurrence_keys = [
        (
            row["chapter"],
            row["verse"],
            row["word_index"],
            row["morpheme_index"],
        )
        for row in payload["occurrences"]
    ]
    if len(set(occurrence_keys)) != len(occurrence_keys):
        raise RuntimeError("Claves de ocurrencia duplicadas")
    if any(
        row["display_word_index"] <= 0
        or row["word_index"] <= 0
        or row["morpheme_index"] <= 0
        for row in payload["occurrences"]
    ):
        raise RuntimeError("Índices de ocurrencia inválidos")
    if any(row.get("textual_status") != "base" for row in payload["occurrences"]):
        raise RuntimeError("El payload de Jonás contiene ocurrencias no base")

    visible_by_verse: dict[tuple[int, int], set[int]] = defaultdict(set)
    for row in payload["occurrences"]:
        visible_by_verse[(row["chapter"], row["verse"])].add(row["display_word_index"])
    total_visible = 0
    for verse in payload["verse_texts"]:
        key = (verse["chapter"], verse["verse"])
        indexes = visible_by_verse[key]
        expected = set(range(1, int(verse["token_count"]) + 1))
        if indexes != expected:
            raise RuntimeError(
                f"Índices visibles discontinuos en Jonás {key[0]}:{key[1]}"
            )
        total_visible += len(indexes)
    if total_visible != counts["visible_words"]:
        raise RuntimeError(f"Palabras visibles reconstruidas: {total_visible}")

    prohibited_keys = {
        "display_gloss_es",
        "occurrence_gloss_es",
        "literal_translation_es",
        "significance_es",
        "definition_es",
        "generated_by_ai",
    }
    prohibited_occurrences: list[str] = []

    def walk(value: Any, path: str = "$") -> None:
        if isinstance(value, dict):
            for key, child in value.items():
                if key in prohibited_keys and child not in (None, False, ""):
                    prohibited_occurrences.append(f"{path}.{key}")
                walk(child, f"{path}.{key}")
        elif isinstance(value, list):
            for index, child in enumerate(value):
                walk(child, f"{path}[{index}]")

    walk(payload)
    if prohibited_occurrences:
        raise RuntimeError(
            f"Campos editoriales no autorizados: {prohibited_occurrences[:10]}"
        )

    roles = Counter(row["token_kind"] for row in payload["occurrences"])
    if dict(sorted(roles.items())) != counts.get("roles"):
        raise RuntimeError("El resumen de roles no coincide con las ocurrencias")

    return {
        "schema_version": "vida-jonah-import-payload-audit-v1",
        "book": payload["book"],
        "file_sha256": file_sha256,
        "payload_sha256": payload["payload_sha256"],
        "package_sha256": payload["package_sha256"],
        "counts": counts,
        "invalid_hashes": invalid_hashes,
        "duplicate_occurrences": 0,
        "duplicate_variants": 0,
        "artificial_visible_words": 0,
        "prohibited_editorial_fields": 0,
        "status": "validated_outside_production",
    }


def self_test() -> None:
    sample = {"schema_version": "x", "payload_sha256": "ignored"}
    digest = canonical_payload_hash(sample)
    if not HASH_RE.fullmatch(digest):
        raise RuntimeError("La huella canónica sintética es inválida")
    print("Auto-test de auditoría de payload de Jonás: OK")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--payload", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return 0
    if args.payload is None or args.output is None:
        parser.error("--payload y --output son obligatorios")

    raw = args.payload.read_bytes()
    file_sha256 = hashlib.sha256(raw).hexdigest()
    payload = json.loads(raw.decode("utf-8"))
    result = audit(payload, file_sha256)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
