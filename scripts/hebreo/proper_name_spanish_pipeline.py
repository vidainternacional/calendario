#!/usr/bin/env python3
"""Resuelve nombres propios bíblicos al español desde un mapping bilingüe aprobado.

Este pipeline NO escribe en Supabase. Solo prepara candidatos auditables para
FASE H / Bloque 3.

Contrato:
- `biblical_lexical_entries.source_gloss` sigue siendo la autoridad fuente.
- Solo procesa glosas TAHOT con entidad exacta `Nombre»Nombre@Referencia`.
- La equivalencia española debe venir de un dataset externo explícitamente
  licenciado (CC0 o dominio público) y enlazado por Strong + etiqueta inglesa.
- No usa RV1909 ni co-ocurrencia contextual como significado.
- Si hay ambigüedad, licencia insuficiente o falta de correspondencia, deja la
  fila como `candidate`/`pending`; nunca inventa castellanizaciones.
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path
from typing import Iterable

ALLOWED_LICENSES = {
    "cc0",
    "cc0-1.0",
    "creative commons cc0",
    "public-domain",
    "public domain",
    "pd",
}


def normalize_text(value: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", value or "").strip().split())


def normalize_key(value: str) -> str:
    value = normalize_text(value).lower()
    value = unicodedata.normalize("NFD", value)
    value = "".join(ch for ch in value if unicodedata.category(ch) != "Mn")
    value = re.sub(r"[^a-z0-9' -]+", " ", value)
    return " ".join(value.split())


def normalize_strong(value: str) -> str:
    raw = normalize_text(value).upper().replace(" ", "")
    match = re.fullmatch(r"([HG])(\d+)([A-Z]?)", raw)
    if not match:
        return raw
    prefix, digits, suffix = match.groups()
    return f"{prefix}{int(digits)}{suffix}"


def exact_named_entity(source_gloss: str) -> tuple[str, str] | None:
    value = normalize_text(source_gloss)
    if "»" not in value or "@" not in value:
        return None
    left, right = value.split("»", 1)
    entity, anchor = right.split("@", 1)
    left = normalize_text(left)
    entity = normalize_text(entity)
    anchor = normalize_text(anchor)
    if not left or not entity or not anchor:
        return None
    if normalize_key(left) != normalize_key(entity):
        return None
    return left, anchor


def read_jsonl(path: Path) -> Iterable[dict[str, object]]:
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        row = json.loads(line)
        if not row.get("id") or not row.get("strong_number") or not row.get("source_gloss"):
            raise ValueError(f"Entrada léxica incompleta en línea {line_number}")
        yield row


def load_mapping(path: Path) -> dict[tuple[str, str], list[dict[str, str]]]:
    """Carga TSV: strong_number, english_label, spanish_label, source_uri, license, source_revision."""
    mapping: dict[tuple[str, str], list[dict[str, str]]] = defaultdict(list)
    with path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle, delimiter="\t")
        required = {
            "strong_number",
            "english_label",
            "spanish_label",
            "source_uri",
            "license",
            "source_revision",
        }
        missing = required - set(reader.fieldnames or [])
        if missing:
            raise ValueError(f"Faltan columnas en mapping: {sorted(missing)}")
        for line_number, row in enumerate(reader, 2):
            strong = normalize_strong(row.get("strong_number") or "")
            english = normalize_text(row.get("english_label") or "")
            spanish = normalize_text(row.get("spanish_label") or "")
            source_uri = normalize_text(row.get("source_uri") or "")
            license_name = normalize_text(row.get("license") or "")
            source_revision = normalize_text(row.get("source_revision") or "")
            if not all([strong, english, spanish, source_uri, license_name, source_revision]):
                raise ValueError(f"Mapping incompleto en línea {line_number}")
            mapping[(strong, normalize_key(english))].append(
                {
                    "spanish_label": spanish,
                    "source_uri": source_uri,
                    "license": license_name,
                    "source_revision": source_revision,
                    "english_label": english,
                }
            )
    return mapping


def resolve_row(row: dict[str, object], mapping: dict[tuple[str, str], list[dict[str, str]]]) -> dict[str, object]:
    source_gloss = normalize_text(str(row.get("source_gloss") or ""))
    named = exact_named_entity(source_gloss)
    base = {
        "lexical_entry_id": row.get("id"),
        "lexical_id": row.get("lexical_id"),
        "strong_number": row.get("strong_number"),
        "source_gloss_snapshot": source_gloss,
    }
    if named is None:
        return {
            **base,
            "display_gloss_es": None,
            "alternative_glosses_es": [],
            "confidence": 0,
            "status": "pending",
            "derivation_method": "not_exact_named_entity_v1",
            "provenance": {"phase": "FASE_H_BLOQUE_3", "context_used_as_meaning": False},
        }

    english_name, anchor_ref = named
    key = (normalize_strong(str(row.get("strong_number") or "")), normalize_key(english_name))
    candidates = mapping.get(key) or []
    allowed_license_keys = {normalize_key(value) for value in ALLOWED_LICENSES}
    licensed = [item for item in candidates if normalize_key(item["license"]) in allowed_license_keys]
    distinct_spanish = sorted({item["spanish_label"] for item in licensed}, key=normalize_key)

    if len(distinct_spanish) == 1:
        chosen = distinct_spanish[0]
        evidence = next(item for item in licensed if item["spanish_label"] == chosen)
        return {
            **base,
            "display_gloss_es": chosen,
            "alternative_glosses_es": [],
            "confidence": 96,
            "status": "verified_derived",
            "derivation_method": "licensed_strong_named_entity_mapping_v1",
            "provenance": {
                "phase": "FASE_H_BLOQUE_3",
                "english_entity_label": english_name,
                "anchor_reference": anchor_ref,
                "mapping_source": evidence["source_uri"],
                "mapping_license": evidence["license"],
                "mapping_revision": evidence["source_revision"],
                "strong_match": key[0],
                "context_used_as_meaning": False,
                "rv1909_used_as_meaning": False,
            },
        }

    if len(distinct_spanish) > 1:
        return {
            **base,
            "display_gloss_es": distinct_spanish[0],
            "alternative_glosses_es": distinct_spanish[1:9],
            "confidence": 70,
            "status": "candidate",
            "derivation_method": "licensed_named_entity_mapping_ambiguous_v1",
            "provenance": {
                "phase": "FASE_H_BLOQUE_3",
                "english_entity_label": english_name,
                "anchor_reference": anchor_ref,
                "candidate_count": len(distinct_spanish),
                "context_used_as_meaning": False,
                "rv1909_used_as_meaning": False,
            },
        }

    return {
        **base,
        "display_gloss_es": None,
        "alternative_glosses_es": [],
        "confidence": 0,
        "status": "pending",
        "derivation_method": "named_entity_mapping_unresolved_v1",
        "provenance": {
            "phase": "FASE_H_BLOQUE_3",
            "english_entity_label": english_name,
            "anchor_reference": anchor_ref,
            "mapping_rows_seen": len(candidates),
            "licensed_rows_seen": len(licensed),
            "context_used_as_meaning": False,
            "rv1909_used_as_meaning": False,
        },
    }


def self_test() -> None:
    assert normalize_strong("H0175") == "H175"
    assert exact_named_entity("Zechariah»Zechariah@1Ch.24.25") == ("Zechariah", "1Ch.24.25")
    assert exact_named_entity(": chariot»chariot:1_chariot") is None

    mapping = {
        ("H2148", "zechariah"): [{
            "spanish_label": "Zacarías",
            "source_uri": "https://www.wikidata.org/",
            "license": "CC0-1.0",
            "source_revision": "test",
            "english_label": "Zechariah",
        }]
    }
    result = resolve_row({
        "id": "00000000-0000-0000-0000-000000000001",
        "lexical_id": "H2148",
        "strong_number": "H2148",
        "source_gloss": "Zechariah»Zechariah@1Ch.24.25",
    }, mapping)
    assert result["status"] == "verified_derived"
    assert result["display_gloss_es"] == "Zacarías"
    assert result["provenance"]["context_used_as_meaning"] is False

    unlicensed = {
        ("H2148", "zechariah"): [{
            "spanish_label": "Zacarías",
            "source_uri": "https://example.invalid/",
            "license": "unknown",
            "source_revision": "test",
            "english_label": "Zechariah",
        }]
    }
    rejected = resolve_row({
        "id": "00000000-0000-0000-0000-000000000001",
        "lexical_id": "H2148",
        "strong_number": "H2148",
        "source_gloss": "Zechariah»Zechariah@1Ch.24.25",
    }, unlicensed)
    assert rejected["status"] == "pending"
    print("proper-name self-test OK")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lexicon-jsonl", type=Path)
    parser.add_argument("--mapping-tsv", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--audit", type=Path)
    parser.add_argument("--require-complete", action="store_true")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return 0
    if not all([args.lexicon_jsonl, args.mapping_tsv, args.output, args.audit]):
        parser.error("Se requieren --lexicon-jsonl, --mapping-tsv, --output y --audit")

    mapping = load_mapping(args.mapping_tsv)
    rows = [resolve_row(row, mapping) for row in read_jsonl(args.lexicon_jsonl)]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        "".join(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n" for row in rows),
        encoding="utf-8",
    )

    statuses = Counter(str(row["status"]) for row in rows)
    audit = {
        "phase": "FASE_H_BLOQUE_3",
        "scope": "exact_named_entities",
        "total": len(rows),
        "statuses": dict(statuses),
        "closure_gate": {
            "expected_pending": 0,
            "expected_candidate": 0,
            "passes": statuses["pending"] == 0 and statuses["candidate"] == 0,
        },
    }
    args.audit.parent.mkdir(parents=True, exist_ok=True)
    args.audit.write_text(json.dumps(audit, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(audit, ensure_ascii=False, indent=2, sort_keys=True))
    if args.require_complete and not audit["closure_gate"]["passes"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
