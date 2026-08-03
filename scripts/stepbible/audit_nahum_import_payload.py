#!/usr/bin/env python3
"""Audita el payload determinista de Nahúm sin escribir en Supabase."""
from __future__ import annotations

import argparse
import hashlib
import json
from collections import Counter
from pathlib import Path
from typing import Any

EXPECTED_COUNTS = {
    "references": 47,
    "visible_words": 558,
    "occurrences": 828,
    "lexical_ids": 387,
    "source_variant_rows": 4,
    "qere_omissions": 0,
}
PACKAGE_SHA256 = "60e280a6d94abc8788b7cc9647e4dfa0f679e0a9708a1adf00be30abfc23b7f5"


def canonical_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def sha(value: Any) -> str:
    return hashlib.sha256(canonical_json(value).encode("utf-8")).hexdigest()


def valid_sha(value: Any) -> bool:
    return isinstance(value, str) and len(value) == 64 and all(c in "0123456789abcdef" for c in value)


def audit(payload: dict[str, Any]) -> dict[str, Any]:
    if payload.get("schema_version") != "vida-tahot-import-payload-v1":
        raise RuntimeError("Versión de payload inesperada")
    if payload.get("book") != {
        "step_code": "Nam",
        "internal_code": "NAM",
        "name_es": "Nahúm",
    }:
        raise RuntimeError(f"Identidad de libro inesperada: {payload.get('book')}")
    if payload.get("package_sha256") != PACKAGE_SHA256:
        raise RuntimeError("El payload no procede del paquete fijado de Nahúm")

    counts = payload.get("counts", {})
    mismatches = {
        key: {"expected": expected, "actual": counts.get(key)}
        for key, expected in EXPECTED_COUNTS.items()
        if counts.get(key) != expected
    }
    if mismatches:
        raise RuntimeError(f"Conteos estructurales inesperados: {mismatches}")

    lexical_entries = payload.get("lexical_entries", [])
    occurrences = payload.get("occurrences", [])
    verse_texts = payload.get("verse_texts", [])
    variants = payload.get("variants", [])
    if len(lexical_entries) != counts["lexical_ids"]:
        raise RuntimeError("El arreglo léxico no coincide con su conteo")
    if len(occurrences) != counts["occurrences"]:
        raise RuntimeError("El arreglo de ocurrencias no coincide con su conteo")
    if len(verse_texts) != counts["references"]:
        raise RuntimeError("El arreglo de textos no coincide con su conteo")
    if len(variants) != counts.get("variants"):
        raise RuntimeError("El arreglo de variantes no coincide con su conteo")

    occurrence_keys = [
        (item["chapter"], item["verse"], item["word_index"], item["morpheme_index"])
        for item in occurrences
    ]
    if len(occurrence_keys) != len(set(occurrence_keys)):
        raise RuntimeError("Existen claves de ocurrencia duplicadas")
    variant_keys = [item["variant_key"] for item in variants]
    if len(variant_keys) != len(set(variant_keys)):
        raise RuntimeError("Existen claves de variante duplicadas")

    invalid_hashes = 0
    for collection in (lexical_entries, occurrences, verse_texts, variants):
        invalid_hashes += sum(not valid_sha(item.get("content_hash")) for item in collection)
    if invalid_hashes:
        raise RuntimeError(f"Hashes de contenido inválidos: {invalid_hashes}")

    payload_without_hash = dict(payload)
    expected_payload_sha = payload_without_hash.pop("payload_sha256", None)
    if not valid_sha(expected_payload_sha) or sha(payload_without_hash) != expected_payload_sha:
        raise RuntimeError("La huella canónica interna del payload no coincide")

    if payload.get("spanish_editorial_fields_complete") is not False:
        raise RuntimeError("El payload marcó como completa una capa española no revisada")
    forbidden_keys = {
        "display_gloss_es",
        "literal_translation_es",
        "variant_explanation_es",
        "explanation_es",
        "generated_by_ai",
    }
    forbidden_values: list[str] = []
    for name, collection in (
        ("lexical", lexical_entries),
        ("occurrence", occurrences),
        ("verse", verse_texts),
        ("variant", variants),
    ):
        for index, item in enumerate(collection):
            for key in forbidden_keys:
                if key in item and item[key] not in (None, False, ""):
                    forbidden_values.append(f"{name}[{index}].{key}")
    if forbidden_values:
        raise RuntimeError(f"Campos editoriales no autorizados: {forbidden_values[:10]}")

    role_counts = dict(sorted(Counter(item["token_kind"] for item in occurrences).items()))
    if sum(role_counts.values()) != counts["occurrences"]:
        raise RuntimeError("La distribución de roles no suma las ocurrencias")
    if role_counts != counts.get("roles"):
        raise RuntimeError("La distribución de roles no coincide con metadata")

    type_counts = dict(sorted(Counter(item["reading_type"] for item in variants).items()))
    if set(type_counts) - {"orthographic", "substitution"}:
        raise RuntimeError(f"Tipos de variante inesperados: {type_counts}")
    if any(item.get("anchor_word_index") is None for item in variants):
        raise RuntimeError("Nahúm contiene una variante sin ancla visible")

    return {
        "schema_version": "vida-stepbible-nahum-import-payload-audit-v1",
        "book": payload["book"],
        "package_sha256": payload["package_sha256"],
        "payload_sha256": payload["payload_sha256"],
        "summary": {
            **{key: counts[key] for key in EXPECTED_COUNTS},
            "variants": counts["variants"],
            "roles": role_counts,
            "variant_types": type_counts,
            "duplicate_occurrences": 0,
            "duplicate_variants": 0,
            "invalid_hashes": 0,
            "unauthorized_spanish_editorial_fields": 0,
            "artificial_visible_words": 0,
        },
        "variants": [
            {
                "variant_key": item["variant_key"],
                "chapter": item["chapter"],
                "verse": item["verse"],
                "anchor_word_index": item["anchor_word_index"],
                "reading_type": item["reading_type"],
                "base_reading": item["base_reading"],
                "variant_reading": item["variant_reading"],
                "witnesses": item["witnesses"],
                "content_hash": item["content_hash"],
            }
            for item in variants
        ],
    }


def self_test() -> None:
    if sha({"b": 2, "a": 1}) != sha({"a": 1, "b": 2}):
        raise RuntimeError("La serialización canónica no es estable")
    if not valid_sha("a" * 64) or valid_sha("z" * 64):
        raise RuntimeError("La validación de SHA-256 no funciona")
    print("Auto-test de auditoría de payload de Nahúm: OK")


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
    payload = json.loads(args.payload.read_text(encoding="utf-8"))
    result = audit(payload)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(result["summary"], ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
