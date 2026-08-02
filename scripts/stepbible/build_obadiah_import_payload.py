#!/usr/bin/env python3
"""Convierte el paquete auditado de Obadías en un payload listo para migración."""
from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import re
from collections import Counter
from pathlib import Path
from typing import Any

from audit_obadiah_model import row_components

HEBREW_RE = re.compile(r"[\u0590-\u05ff]")


def sha(value: Any) -> str:
    raw = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def part_of_speech(components: list[dict[str, Any]]) -> str | None:
    roles = {component["token_kind"] for component in components}
    if roles == {"prefix"}:
        return "prefix"
    if roles == {"suffix"}:
        return "suffix"
    codes = [component.get("morphology_code") or "" for component in components]
    if any(code.startswith(("HN", "AN")) for code in codes):
        return "noun"
    if any(code.startswith(("HV", "AV")) for code in codes):
        return "verb"
    if any(code.startswith(("HA", "AA")) for code in codes):
        return "adjective"
    if any(code.startswith(("HS", "AS")) for code in codes):
        return "pronoun"
    return None


def spelling_reading(value: str) -> tuple[str, str]:
    witness, _, body = value.partition("=")
    reading = body.split("¦", 1)[0].strip().replace("/", "").replace("\\", "")
    return witness.strip(), reading


def meaning_reading(value: str) -> tuple[str, str]:
    witness, _, _ = value.partition("=")
    match = re.search(r"\(([^()]*)\)", value)
    if not match:
        raise ValueError(f"Variante de significado sin lectura hebrea: {value}")
    return witness.strip(), match.group(1).replace("/", "")


def build(package: dict[str, Any], policy: dict[str, str], package_sha: str) -> dict[str, Any]:
    lexical_usage: dict[str, list[dict[str, Any]]] = {}
    occurrences: list[dict[str, Any]] = []
    variants: list[dict[str, Any]] = []

    for verse in package["verses"]:
        for row in verse["rows"]:
            components = row_components(row)
            for component in components:
                lexical_usage.setdefault(component["lexical_id"], []).append(component)
                occurrence = {
                    "chapter": row["reference"]["chapter"],
                    "verse": row["reference"]["verse"],
                    "word_index": row["source_index"]["base"],
                    "source_index_raw": row["source_index"]["raw"],
                    "display_word_index": row["display_word_index"],
                    "morpheme_index": component["morpheme_index"],
                    "morpheme_count": len(components),
                    "lexical_id": component["lexical_id"],
                    "surface_form": component["surface_form"],
                    "transliteration": component["transliteration"],
                    "source_gloss_en": component["occurrence_gloss_en"],
                    "morphology_code": component["morphology_code"],
                    "token_kind": component["token_kind"],
                    "joins_previous": component["joins_previous"],
                    "joins_next": component["joins_next"],
                    "punctuation_after": row["punctuation_after"] if component["morpheme_index"] == len(components) else None,
                    "source_line": row["source_line"],
                    "source_line_sha256": row["source_line_sha256"],
                    "source_locator": row["source_url"] + "#L" + str(row["source_line"]),
                    "text_suffix": row["text_suffix"],
                    "textual_status": row["textual_status"],
                    "source_lemma": component["source_lemma"],
                }
                occurrence["content_hash"] = sha({"kind": "occurrence", **occurrence, "package": package_sha})
                occurrences.append(occurrence)

            if row["variants"]["spelling"]:
                witness, reading = spelling_reading(row["variants"]["spelling"])
                variant = {
                    "chapter": row["reference"]["chapter"],
                    "verse": row["reference"]["verse"],
                    "anchor_word_index": row["display_word_index"],
                    "variant_key": f"oba-{row['reference']['chapter']}-{row['reference']['verse']}-{row['source_index']['raw']}-orthographic",
                    "reading_type": "orthographic",
                    "base_reading": row["surface_form"],
                    "variant_reading": reading,
                    "witness_summary": row["variants"]["spelling"],
                    "witnesses": [witness],
                    "source_locator": row["source_url"] + "#L" + str(row["source_line"]),
                    "source_line_sha256": row["source_line_sha256"],
                }
                variant["content_hash"] = sha({"kind": "variant", **variant, "package": package_sha})
                variants.append(variant)

            if row["variants"]["meaning"]:
                witness, reading = meaning_reading(row["variants"]["meaning"])
                variant = {
                    "chapter": row["reference"]["chapter"],
                    "verse": row["reference"]["verse"],
                    "anchor_word_index": row["display_word_index"],
                    "variant_key": f"oba-{row['reference']['chapter']}-{row['reference']['verse']}-{row['source_index']['raw']}-substitution",
                    "reading_type": "substitution",
                    "base_reading": row["surface_form"],
                    "variant_reading": reading,
                    "witness_summary": row["variants"]["meaning"],
                    "witnesses": [witness],
                    "source_locator": row["source_url"] + "#L" + str(row["source_line"]),
                    "source_line_sha256": row["source_line_sha256"],
                }
                variant["content_hash"] = sha({"kind": "variant", **variant, "package": package_sha})
                variants.append(variant)

    lexical_entries: list[dict[str, Any]] = []
    for lexical_id, components in sorted(lexical_usage.items()):
        source_lemmas = {component["source_lemma"] for component in components}
        if len(source_lemmas) != 1:
            raise ValueError(f"Lemas fuente conflictivos para {lexical_id}: {source_lemmas}")
        source_lemma = next(iter(source_lemmas))
        canonical_lemma = policy.get(lexical_id)
        lemma_policy = "explicit_affix_map" if canonical_lemma else "source_hebrew_lemma"
        if canonical_lemma is None and HEBREW_RE.search(source_lemma):
            canonical_lemma = source_lemma
        if not canonical_lemma:
            raise ValueError(f"Falta lema canónico para {lexical_id}: {source_lemma}")
        source_glosses = [component["source_gloss"] for component in components if component["source_gloss"]]
        first_occurrence = next(item for item in occurrences if item["lexical_id"] == lexical_id)
        entry = {
            "language": "hebrew",
            "lexical_id": lexical_id,
            "strong_number": components[0]["strong_number"],
            "lemma": canonical_lemma,
            "part_of_speech": part_of_speech(components),
            "source_gloss": source_glosses[0] if source_glosses else None,
            "source_locator": first_occurrence["source_locator"],
            "lemma_policy": lemma_policy,
            "source_lemma": source_lemma,
        }
        entry["content_hash"] = sha({"kind": "lexical", **entry, "package": package_sha})
        lexical_entries.append(entry)

    verse_texts: list[dict[str, Any]] = []
    for verse in package["verses"]:
        first = verse["rows"][0]
        text = {
            "chapter": first["reference"]["chapter"],
            "verse": first["reference"]["verse"],
            "language": "hebrew",
            "original_text": verse["original_text"],
            "transliteration": verse["transliteration"] or None,
            "token_count": verse["visible_word_count"],
            "source_gloss_sequence_en": verse["source_gloss_sequence_en"],
            "source_locator": first["source_url"] + "#L" + str(first["source_line"]),
            "source_content_hash": verse["content_hash"],
        }
        text["content_hash"] = sha({"kind": "verse", **text, "package": package_sha})
        verse_texts.append(text)

    counts = {
        "references": len(verse_texts),
        "visible_words": package["counts"]["visible_words"],
        "occurrences": len(occurrences),
        "lexical_ids": len(lexical_entries),
        "source_variant_rows": package["counts"]["variant_rows"],
        "variants": len(variants),
        "roles": dict(Counter(item["token_kind"] for item in occurrences)),
    }
    expected = {
        "references": 21,
        "visible_words": 291,
        "occurrences": 434,
        "lexical_ids": 184,
        "source_variant_rows": 2,
        "variants": 3,
        "roles": {"word": 291, "prefix": 103, "suffix": 40},
    }
    if counts != expected:
        raise ValueError(f"Conteos de payload inesperados: {counts} != {expected}")

    payload = {
        "schema_version": "vida-tahot-import-payload-v1",
        "book": package["book"],
        "source": package["source"],
        "package_sha256": package_sha,
        "counts": counts,
        "lexical_entries": lexical_entries,
        "occurrences": occurrences,
        "verse_texts": verse_texts,
        "variants": variants,
        "spanish_editorial_fields_complete": False,
    }
    payload["payload_sha256"] = sha(payload)
    return payload


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("package", type=Path)
    parser.add_argument("--policy", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    with gzip.open(args.package, "rt", encoding="utf-8") as handle:
        package = json.load(handle)
    manifest = json.loads((args.package.parent / "manifest.json").read_text(encoding="utf-8"))
    policy = json.loads(args.policy.read_text(encoding="utf-8"))
    payload = build(package, policy, manifest["artifact"]["sha256"])
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n", encoding="utf-8")
    print(json.dumps({"payload_sha256": payload["payload_sha256"], "counts": payload["counts"]}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
