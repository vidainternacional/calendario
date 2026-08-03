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
    "variants": 8,
    "qere_omissions": 0,
}
EXPECTED_ROLES = {"prefix": 175, "suffix": 95, "word": 558}
EXPECTED_VARIANT_TYPES = {"orthographic": 4, "substitution": 4}
PACKAGE_SHA256 = "60e280a6d94abc8788b7cc9647e4dfa0f679e0a9708a1adf00be30abfc23b7f5"
PAYLOAD_SHA256 = "43a5ab1b8c9cf773e218c73eab3def49715ac7c0511a04ee9cae3990be4a8a99"
EXPECTED_VARIANTS = {
    "nam-1-3-04=Q(K)-orthographic": {
        "chapter": 1,
        "verse": 3,
        "anchor_word_index": 4,
        "reading_type": "orthographic",
        "base_reading": "וּגְדָל",
        "variant_reading": "וּגְדָול־",
        "witnesses": ["L"],
        "content_hash": "9efe642d1d9a24992c94a52e80dc35d259c3faf9453875f976c25b3c20055d64",
    },
    "nam-1-3-04=Q(K)-substitution": {
        "chapter": 1,
        "verse": 3,
        "anchor_word_index": 4,
        "reading_type": "substitution",
        "base_reading": "וּגְדָל",
        "variant_reading": "וּגְדוֹל",
        "witnesses": ["K"],
        "content_hash": "768331bda59484864f4825dddfe73fcd814831ca06887015954888c266218cf8",
    },
    "nam-1-15-17=Q(k)-orthographic": {
        "chapter": 1,
        "verse": 15,
        "anchor_word_index": 17,
        "reading_type": "orthographic",
        "base_reading": "לַֽעֲבָר",
        "variant_reading": "לַֽעֲבָור־",
        "witnesses": ["L"],
        "content_hash": "dcec339d7811971e87221aaf0d5f572576deeaad3a398d1b885fbf4373efb762",
    },
    "nam-1-15-17=Q(k)-substitution": {
        "chapter": 1,
        "verse": 15,
        "anchor_word_index": 17,
        "reading_type": "substitution",
        "base_reading": "לַֽעֲבָר",
        "variant_reading": "לַעֲבוֹר",
        "witnesses": ["K"],
        "content_hash": "613a3dd58eb3ef5366b9c0e37b349381f4b78bc5941096612f407c76bb8b2540",
    },
    "nam-2-5-04=Q(K)-orthographic": {
        "chapter": 2,
        "verse": 5,
        "anchor_word_index": 4,
        "reading_type": "orthographic",
        "base_reading": "בַּהֲלִֽיכָתָ֑ם",
        "variant_reading": "בַּהֲלִֽכָותָ֑ם",
        "witnesses": ["L"],
        "content_hash": "eb49717fc623dfafd078f9d67574542ae9a41af22529d2b3e769fb55e634367d",
    },
    "nam-2-5-04=Q(K)-substitution": {
        "chapter": 2,
        "verse": 5,
        "anchor_word_index": 4,
        "reading_type": "substitution",
        "base_reading": "בַּהֲלִֽיכָתָ֑ם",
        "variant_reading": "בַהֲלִכוֹתָם",
        "witnesses": ["K"],
        "content_hash": "c60f300822ead99fb756d1427105eb9c00813db850d24187a9ad0f9137e99c46",
    },
    "nam-3-3-14=Q(K)-orthographic": {
        "chapter": 3,
        "verse": 3,
        "anchor_word_index": 14,
        "reading_type": "orthographic",
        "base_reading": "וְכָשְׁל֖וּ",
        "variant_reading": "יְכָשְׁל֖וּ",
        "witnesses": ["L"],
        "content_hash": "1b9369fc3a5e1d3b392f8dc14a0fb18fed6961aaf64efa8bb2d7c2c3e523d914",
    },
    "nam-3-3-14=Q(K)-substitution": {
        "chapter": 3,
        "verse": 3,
        "anchor_word_index": 14,
        "reading_type": "substitution",
        "base_reading": "וְכָשְׁל֖וּ",
        "variant_reading": "יִכְשְׁלוּ",
        "witnesses": ["K"],
        "content_hash": "b6b4657e955cd7c0097746d5dd2b0bd207772aa3fc7d5df37dcac4c5b0ac597c",
    },
}


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
    if len(variants) != counts["variants"]:
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
    if expected_payload_sha != PAYLOAD_SHA256 or sha(payload_without_hash) != PAYLOAD_SHA256:
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
    if role_counts != EXPECTED_ROLES or role_counts != counts.get("roles"):
        raise RuntimeError(f"Distribución de roles inesperada: {role_counts}")

    type_counts = dict(sorted(Counter(item["reading_type"] for item in variants).items()))
    if type_counts != EXPECTED_VARIANT_TYPES:
        raise RuntimeError(f"Distribución de variantes inesperada: {type_counts}")
    if any(item.get("anchor_word_index") is None for item in variants):
        raise RuntimeError("Nahúm contiene una variante sin ancla visible")

    actual_variants = {
        item["variant_key"]: {
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
    }
    if actual_variants != EXPECTED_VARIANTS:
        raise RuntimeError("Las ocho variantes fijadas de Nahúm no coinciden")

    return {
        "schema_version": "vida-stepbible-nahum-import-payload-audit-v1",
        "book": payload["book"],
        "package_sha256": payload["package_sha256"],
        "payload_sha256": payload["payload_sha256"],
        "summary": {
            **EXPECTED_COUNTS,
            "roles": role_counts,
            "variant_types": type_counts,
            "duplicate_occurrences": 0,
            "duplicate_variants": 0,
            "invalid_hashes": 0,
            "unauthorized_spanish_editorial_fields": 0,
            "artificial_visible_words": 0,
        },
        "variants": actual_variants,
    }


def self_test() -> None:
    if sha({"b": 2, "a": 1}) != sha({"a": 1, "b": 2}):
        raise RuntimeError("La serialización canónica no es estable")
    if not valid_sha("a" * 64) or valid_sha("z" * 64):
        raise RuntimeError("La validación de SHA-256 no funciona")
    if sum(EXPECTED_ROLES.values()) != EXPECTED_COUNTS["occurrences"]:
        raise RuntimeError("Los roles fijados no suman las ocurrencias")
    if sum(EXPECTED_VARIANT_TYPES.values()) != EXPECTED_COUNTS["variants"]:
        raise RuntimeError("Los tipos fijados no suman las variantes")
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
