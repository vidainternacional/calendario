#!/usr/bin/env python3
"""Construye payload TAHOT v2 para libros con hebreo y arameo. No escribe Supabase."""
from __future__ import annotations

import argparse
import gzip
import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

from build_tahot_import_payload import (
    HEBREW_RE,
    build_variant,
    canonical_json,
    meaning_reading,
    part_of_speech,
    sha,
    spelling_reading,
    witness_fragments,
    witness_summary_for,
)
from tahot_components import row_components

SCRIPT_RE = re.compile(r"[\u0590-\u05ff]")


def build(package: dict[str, Any], policy: dict[str, Any], package_sha: str) -> dict[str, Any]:
    if package.get("schema_version") != "stepbible-tahot-book-v1":
        raise ValueError("Versión de paquete TAHOT inesperada")
    if policy.get("schema_version") != "vida-tahot-multilingual-affix-policy-v2":
        raise ValueError("Política multilingüe inesperada")
    if policy.get("source_commit") != package["source"]["commit"] or policy.get("source_sha256") != package["source"]["sha256"]:
        raise ValueError("La política no corresponde a la fuente fijada")

    book_code = package["book"]["internal_code"]
    policy_entries = policy["entries"]
    lexical_usage: dict[str, list[dict[str, Any]]] = defaultdict(list)
    occurrences: list[dict[str, Any]] = []
    variants: list[dict[str, Any]] = []

    for verse in package["verses"]:
        for row in verse["rows"]:
            if row["is_qere_omission_placeholder"]:
                raise ValueError("El contrato v2 inicial no admite omisiones Qere sin idioma explícito")
            language = row["language"]
            if language not in {"hebrew", "aramaic"}:
                raise ValueError(f"Idioma no permitido en {row['reference']['english']}: {language}")

            components = row_components(row)
            for component in components:
                lexical_key = f"{language}:{component['lexical_id']}"
                lexical_usage[lexical_key].append(component)
                occurrence = {
                    "language": language,
                    "chapter": row["reference"]["chapter"],
                    "verse": row["reference"]["verse"],
                    "word_index": row["display_word_index"],
                    "source_index_raw": row["source_index"]["raw"],
                    "source_index_base": row["source_index"]["base"],
                    "source_index_subindex": row["source_index"]["subindex"],
                    "display_word_index": row["display_word_index"],
                    "morpheme_index": component["morpheme_index"],
                    "morpheme_count": len(components),
                    "segment_index": component["segment_index"],
                    "lexical_id": component["lexical_id"],
                    "surface_form": component["surface_form"],
                    "transliteration": component["transliteration"],
                    "source_gloss_en": component["occurrence_gloss_en"],
                    "morphology_code": component["morphology_code"],
                    "token_kind": component["token_kind"],
                    "joins_previous": component["joins_previous"],
                    "joins_next": component["joins_next"],
                    "source_joins_next_word": component["source_joins_next_word"],
                    "punctuation_after": row["punctuation_after"] if component["morpheme_index"] == len(components) else None,
                    "source_line": row["source_line"],
                    "source_line_sha256": row["source_line_sha256"],
                    "source_locator": row["source_url"] + "#L" + str(row["source_line"]),
                    "text_suffix": row["text_suffix"],
                    "textual_status": row["textual_status"],
                    "source_lemma": component["source_lemma"],
                }
                occurrence["content_hash"] = sha({"kind": "occurrence-v2", **occurrence, "package": package_sha})
                occurrences.append(occurrence)

            spelling_evidence = row["variants"]["spelling"]
            meaning_evidence = row["variants"]["meaning"]
            spelling_has_k = bool(spelling_evidence and any(witness == "K" for witness, _ in witness_fragments(spelling_evidence)))
            meaning_has_k = bool(meaning_evidence and any(witness == "K" for witness, _ in witness_fragments(meaning_evidence)))
            split_spelling_ketiv = row["textual_status"] == "qere" and spelling_has_k

            if spelling_evidence:
                evidence = witness_summary_for(spelling_evidence, exclude={"K"}) if split_spelling_ketiv else spelling_evidence
                if evidence:
                    variant = build_variant(
                        package_sha=package_sha,
                        book_code=book_code,
                        row=row,
                        reading_type="orthographic",
                        base_reading=row["surface_form"],
                        variant_reading=spelling_reading(evidence),
                        witness_summary=evidence,
                        anchor_word_index=row["display_word_index"],
                    )
                    variant["language"] = language
                    variant["content_hash"] = sha({"kind": "variant-v2", **{k: v for k, v in variant.items() if k != "content_hash"}, "package": package_sha})
                    variants.append(variant)

            if meaning_evidence:
                variant = build_variant(
                    package_sha=package_sha,
                    book_code=book_code,
                    row=row,
                    reading_type="substitution",
                    base_reading=row["surface_form"],
                    variant_reading=meaning_reading(meaning_evidence),
                    witness_summary=meaning_evidence,
                    anchor_word_index=row["display_word_index"],
                )
                variant["language"] = language
                variant["content_hash"] = sha({"kind": "variant-v2", **{k: v for k, v in variant.items() if k != "content_hash"}, "package": package_sha})
                variants.append(variant)

            if split_spelling_ketiv and not meaning_has_k:
                ketiv_evidence = witness_summary_for(spelling_evidence, include={"K"})
                variant = build_variant(
                    package_sha=package_sha,
                    book_code=book_code,
                    row=row,
                    reading_type="substitution",
                    base_reading=row["surface_form"],
                    variant_reading=spelling_reading(ketiv_evidence, "K"),
                    witness_summary=ketiv_evidence,
                    anchor_word_index=row["display_word_index"],
                )
                variant["language"] = language
                variant["content_hash"] = sha({"kind": "variant-v2", **{k: v for k, v in variant.items() if k != "content_hash"}, "package": package_sha})
                variants.append(variant)

    duplicate_occurrences = [key for key, count in Counter(
        (item["chapter"], item["verse"], item["word_index"], item["morpheme_index"])
        for item in occurrences
    ).items() if count > 1]
    if duplicate_occurrences:
        raise ValueError(f"Claves de ocurrencia duplicadas: {duplicate_occurrences[:10]}")

    lexical_entries: list[dict[str, Any]] = []
    for lexical_key, components in sorted(lexical_usage.items()):
        language, lexical_id = lexical_key.split(":", 1)
        source_lemmas = {component["source_lemma"] for component in components}
        policy_entry = policy_entries.get(lexical_key)
        if len(source_lemmas) == 1 and SCRIPT_RE.search(next(iter(source_lemmas))):
            canonical_lemma = next(iter(source_lemmas))
            lemma_policy = "source_script_lemma"
        elif policy_entry:
            canonical_lemma = policy_entry["lemma"]
            lemma_policy = policy_entry["basis"]
        else:
            raise ValueError(f"Falta política para {lexical_key}: {sorted(source_lemmas)}")

        source_glosses = [component["source_gloss"] for component in components if component["source_gloss"]]
        first_occurrence = next(item for item in occurrences if item["language"] == language and item["lexical_id"] == lexical_id)
        entry = {
            "language": language,
            "lexical_id": lexical_id,
            "strong_number": components[0]["strong_number"],
            "lemma": canonical_lemma,
            "part_of_speech": part_of_speech(components),
            "source_gloss": source_glosses[0] if source_glosses else None,
            "source_locator": first_occurrence["source_locator"],
            "lemma_policy": lemma_policy,
            "source_lemmas": sorted(source_lemmas),
        }
        entry["content_hash"] = sha({"kind": "lexical-v2", **entry, "package": package_sha})
        lexical_entries.append(entry)

    verse_texts: list[dict[str, Any]] = []
    for verse in package["verses"]:
        rows_by_language: dict[str, list[dict[str, Any]]] = defaultdict(list)
        order: list[str] = []
        for row in verse["rows"]:
            if not row["is_visible_base_word"]:
                continue
            language = row["language"]
            if language not in rows_by_language:
                order.append(language)
            rows_by_language[language].append(row)

        for segment_order, language in enumerate(order, 1):
            rows = rows_by_language[language]
            first = rows[0]
            original_text = " ".join(f"{row['surface_form']}{row['punctuation_after']}".strip() for row in rows if row["surface_form"] or row["punctuation_after"])
            transliteration = " ".join(row["transliteration"] for row in rows if row["transliteration"])
            source_gloss_sequence_en = " ".join(row["source_gloss_en"] for row in rows if row["source_gloss_en"])
            text = {
                "chapter": first["reference"]["chapter"],
                "verse": first["reference"]["verse"],
                "language": language,
                "segment_order": segment_order,
                "original_text": original_text,
                "transliteration": transliteration or None,
                "token_count": len(rows),
                "source_gloss_sequence_en": source_gloss_sequence_en or None,
                "source_locator": first["source_url"] + "#L" + str(first["source_line"]),
                "source_line_start": first["source_line"],
                "source_line_end": rows[-1]["source_line"],
            }
            text["content_hash"] = sha({"kind": "verse-v2", **text, "package": package_sha})
            verse_texts.append(text)

    canonical_references = len({(item["chapter"], item["verse"]) for item in verse_texts})
    counts = {
        "references": canonical_references,
        "verse_text_segments": len(verse_texts),
        "mixed_references": sum(count > 1 for count in Counter((item["chapter"], item["verse"]) for item in verse_texts).values()),
        "visible_words": package["counts"]["visible_words"],
        "occurrences": len(occurrences),
        "lexical_keys": len(lexical_entries),
        "source_variant_rows": package["counts"]["variant_rows"],
        "variants": len(variants),
        "languages": dict(sorted(Counter(item["language"] for item in occurrences).items())),
        "roles": dict(sorted(Counter(item["token_kind"] for item in occurrences).items())),
    }
    if counts["references"] != package["counts"]["references"] or counts["visible_words"] != package["counts"]["visible_words"]:
        raise ValueError(f"El payload alteró conteos canónicos: {counts}")
    if counts["mixed_references"] != package["counts"]["mixed_references"]:
        raise ValueError(f"El payload alteró referencias mixtas: {counts}")

    payload = {
        "schema_version": "vida-tahot-import-payload-v2",
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
    args.output.write_text(canonical_json(payload) + "\n", encoding="utf-8")
    print(json.dumps({"payload_sha256": payload["payload_sha256"], "counts": payload["counts"]}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
