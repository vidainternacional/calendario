#!/usr/bin/env python3
"""Construye payloads TAHOT deterministas sin modificar Supabase."""
from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import re
from collections import Counter
from pathlib import Path
from typing import Any

from tahot_components import row_components

HEBREW_RE = re.compile(r"[\u0590-\u05ff]")
WITNESS_RE = re.compile(r"(?:^|;)\s*([A-Za-z0-9]+)\s*=")

# Rut ya fue importado y aprobado con el tratamiento histórico que conserva
# K junto a los demás testigos ortográficos. La excepción se fija por la
# huella exacta del paquete; cualquier paquete nuevo usa la separación correcta.
LEGACY_COMBINED_QERE_SPELLING_PACKAGE_SHAS = {
    "80a79abd038de9159a90e7aa572f1d4ff6a0c7f1ca8bfb4195875ffd5a7ca20c",
}


def canonical_json(value: Any) -> str:
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )


def sha(value: Any) -> str:
    return hashlib.sha256(canonical_json(value).encode("utf-8")).hexdigest()


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


def witness_fragments(value: str) -> list[tuple[str, str]]:
    fragments: list[tuple[str, str]] = []
    for raw in value.split(";"):
        witness, separator, body = raw.partition("=")
        if separator and witness.strip():
            fragments.append((witness.strip(), body.strip()))
    return fragments


def witness_summary_for(
    value: str,
    *,
    include: set[str] | None = None,
    exclude: set[str] | None = None,
) -> str:
    selected: list[str] = []
    for witness, body in witness_fragments(value):
        if include is not None and witness not in include:
            continue
        if exclude is not None and witness in exclude:
            continue
        selected.append(f"{witness}={body}")
    return ";".join(selected)


def witnesses(value: str) -> list[str]:
    found = WITNESS_RE.findall(value)
    return list(dict.fromkeys(found))


def clean_reading(value: str) -> str:
    return value.replace("/", "").replace("\\", "").strip()


def spelling_reading(value: str, preferred_witness: str | None = None) -> str:
    fragments = witness_fragments(value)
    if preferred_witness:
        fragments = sorted(
            fragments,
            key=lambda item: 0 if item[0] == preferred_witness else 1,
        )
    if not fragments:
        raise ValueError(f"Variante ortográfica sin testigo: {value}")
    body = fragments[0][1].split("¦", 1)[0].strip()
    reading = clean_reading(body)
    if not reading:
        raise ValueError(f"Variante ortográfica sin lectura: {value}")
    return reading


def meaning_reading(value: str, preferred_witness: str | None = None) -> str:
    fragments = witness_fragments(value)
    if preferred_witness:
        fragments = sorted(
            fragments,
            key=lambda item: 0 if item[0] == preferred_witness else 1,
        )
    for _, fragment in fragments:
        matches = re.findall(r"\(([^()]*)\)", fragment)
        for candidate in matches:
            reading = clean_reading(candidate)
            if HEBREW_RE.search(reading):
                return reading
    raise ValueError(f"Variante de significado sin lectura hebrea: {value}")


def ketiv_reading(row: dict[str, Any]) -> tuple[str, str]:
    meaning = row["variants"]["meaning"]
    spelling = row["variants"]["spelling"]
    if meaning and any(witness == "K" for witness, _ in witness_fragments(meaning)):
        return meaning_reading(meaning, "K"), meaning
    if spelling and any(witness == "K" for witness, _ in witness_fragments(spelling)):
        return spelling_reading(spelling, "K"), spelling
    raise ValueError(
        "Omisión Qere sin evidencia Ketiv: "
        f"{row['reference']['english']}#{row['source_index']['raw']}"
    )


def variant_key(
    book_code: str,
    row: dict[str, Any],
    reading_type: str,
) -> str:
    suffix = row.get("text_suffix") or ""
    return (
        f"{book_code.lower()}-{row['reference']['chapter']}-"
        f"{row['reference']['verse']}-{row['source_index']['raw']}"
        f"{suffix}-{reading_type}"
    )


def build_variant(
    *,
    package_sha: str,
    book_code: str,
    row: dict[str, Any],
    reading_type: str,
    base_reading: str | None,
    variant_reading: str | None,
    witness_summary: str,
    anchor_word_index: int | None,
) -> dict[str, Any]:
    variant = {
        "chapter": row["reference"]["chapter"],
        "verse": row["reference"]["verse"],
        "anchor_word_index": anchor_word_index,
        "variant_key": variant_key(book_code, row, reading_type),
        "reading_type": reading_type,
        "base_reading": base_reading,
        "variant_reading": variant_reading,
        "witness_summary": witness_summary,
        "witnesses": witnesses(witness_summary),
        "source_locator": row["source_url"] + "#L" + str(row["source_line"]),
        "source_line_sha256": row["source_line_sha256"],
    }
    variant["content_hash"] = sha(
        {"kind": "variant", **variant, "package": package_sha}
    )
    return variant


def build(
    package: dict[str, Any],
    policy: dict[str, str],
    package_sha: str,
) -> dict[str, Any]:
    if package.get("schema_version") != "stepbible-tahot-book-v1":
        raise ValueError("Versión de paquete TAHOT inesperada")
    book_code = package["book"]["internal_code"]

    lexical_usage: dict[str, list[dict[str, Any]]] = {}
    occurrences: list[dict[str, Any]] = []
    variants: list[dict[str, Any]] = []
    omitted_source_lines: list[int] = []

    for verse in package["verses"]:
        for row in verse["rows"]:
            if row["is_qere_omission_placeholder"]:
                reading, evidence = ketiv_reading(row)
                variants.append(
                    build_variant(
                        package_sha=package_sha,
                        book_code=book_code,
                        row=row,
                        reading_type="addition",
                        base_reading=None,
                        variant_reading=reading,
                        witness_summary=evidence,
                        anchor_word_index=None,
                    )
                )
                omitted_source_lines.append(row["source_line"])
                continue

            components = row_components(row)
            for component in components:
                lexical_usage.setdefault(component["lexical_id"], []).append(component)
                occurrence = {
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
                    "punctuation_after": (
                        row["punctuation_after"]
                        if component["morpheme_index"] == len(components)
                        else None
                    ),
                    "source_line": row["source_line"],
                    "source_line_sha256": row["source_line_sha256"],
                    "source_locator": row["source_url"] + "#L" + str(row["source_line"]),
                    "text_suffix": row["text_suffix"],
                    "textual_status": row["textual_status"],
                    "source_lemma": component["source_lemma"],
                }
                occurrence["content_hash"] = sha(
                    {"kind": "occurrence", **occurrence, "package": package_sha}
                )
                occurrences.append(occurrence)

            spelling_evidence = row["variants"]["spelling"]
            meaning_evidence = row["variants"]["meaning"]
            spelling_has_k = bool(
                spelling_evidence
                and any(
                    witness == "K"
                    for witness, _body in witness_fragments(spelling_evidence)
                )
            )
            meaning_has_k = bool(
                meaning_evidence
                and any(
                    witness == "K"
                    for witness, _body in witness_fragments(meaning_evidence)
                )
            )
            split_spelling_ketiv = (
                row["textual_status"] == "qere"
                and spelling_has_k
                and package_sha
                not in LEGACY_COMBINED_QERE_SPELLING_PACKAGE_SHAS
            )

            if spelling_evidence:
                orthographic_evidence = (
                    witness_summary_for(spelling_evidence, exclude={"K"})
                    if split_spelling_ketiv
                    else spelling_evidence
                )
                if orthographic_evidence:
                    variants.append(
                        build_variant(
                            package_sha=package_sha,
                            book_code=book_code,
                            row=row,
                            reading_type="orthographic",
                            base_reading=row["surface_form"],
                            variant_reading=spelling_reading(orthographic_evidence),
                            witness_summary=orthographic_evidence,
                            anchor_word_index=row["display_word_index"],
                        )
                    )

            if meaning_evidence:
                variants.append(
                    build_variant(
                        package_sha=package_sha,
                        book_code=book_code,
                        row=row,
                        reading_type="substitution",
                        base_reading=row["surface_form"],
                        variant_reading=meaning_reading(meaning_evidence),
                        witness_summary=meaning_evidence,
                        anchor_word_index=row["display_word_index"],
                    )
                )

            if split_spelling_ketiv and not meaning_has_k:
                if meaning_evidence:
                    raise ValueError(
                        "Fila Qere con variante de significado no-K y Ketiv "
                        "ortográfico no representable sin ampliar variant_key: "
                        f"{row['reference']['english']}#{row['source_index']['raw']}"
                    )
                ketiv_evidence = witness_summary_for(spelling_evidence, include={"K"})
                variants.append(
                    build_variant(
                        package_sha=package_sha,
                        book_code=book_code,
                        row=row,
                        reading_type="substitution",
                        base_reading=row["surface_form"],
                        variant_reading=spelling_reading(ketiv_evidence, "K"),
                        witness_summary=ketiv_evidence,
                        anchor_word_index=row["display_word_index"],
                    )
                )

    duplicate_occurrences = [
        key
        for key, count in Counter(
            (
                item["chapter"],
                item["verse"],
                item["word_index"],
                item["morpheme_index"],
            )
            for item in occurrences
        ).items()
        if count > 1
    ]
    if duplicate_occurrences:
        raise ValueError(f"Claves de ocurrencia duplicadas: {duplicate_occurrences[:10]}")

    duplicate_variants = [
        key
        for key, count in Counter(item["variant_key"] for item in variants).items()
        if count > 1
    ]
    if duplicate_variants:
        raise ValueError(f"Claves de variante duplicadas: {duplicate_variants}")

    lexical_entries: list[dict[str, Any]] = []
    for lexical_id, components in sorted(lexical_usage.items()):
        source_lemmas = {component["source_lemma"] for component in components}
        if len(source_lemmas) != 1:
            raise ValueError(
                f"Lemas fuente conflictivos para {lexical_id}: {source_lemmas}"
            )
        source_lemma = next(iter(source_lemmas))
        canonical_lemma = policy.get(lexical_id)
        lemma_policy = "explicit_affix_map" if canonical_lemma else "source_hebrew_lemma"
        if canonical_lemma is None and HEBREW_RE.search(source_lemma):
            canonical_lemma = source_lemma
        if not canonical_lemma:
            raise ValueError(f"Falta lema canónico para {lexical_id}: {source_lemma}")

        source_glosses = [
            component["source_gloss"]
            for component in components
            if component["source_gloss"]
        ]
        first_occurrence = next(
            item for item in occurrences if item["lexical_id"] == lexical_id
        )
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
        entry["content_hash"] = sha(
            {"kind": "lexical", **entry, "package": package_sha}
        )
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
        text["content_hash"] = sha(
            {"kind": "verse", **text, "package": package_sha}
        )
        verse_texts.append(text)

    counts = {
        "references": len(verse_texts),
        "visible_words": package["counts"]["visible_words"],
        "occurrences": len(occurrences),
        "lexical_ids": len(lexical_entries),
        "source_variant_rows": package["counts"]["variant_rows"],
        "variants": len(variants),
        "qere_omissions": len(omitted_source_lines),
        "roles": dict(sorted(Counter(item["token_kind"] for item in occurrences).items())),
    }

    if counts["references"] != package["counts"]["references"]:
        raise ValueError("El payload perdió referencias")
    if counts["visible_words"] != package["counts"]["visible_words"]:
        raise ValueError("El payload alteró las palabras visibles")
    if counts["qere_omissions"] != package["counts"]["qere_omission_placeholders"]:
        raise ValueError("El payload alteró las omisiones Qere")
    if any(item["source_line"] in omitted_source_lines for item in occurrences):
        raise ValueError("Una omisión Qere fue convertida en ocurrencia")

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


def self_test() -> None:
    if spelling_reading("L= שְׁעָרָ֗/ו ¦ ;") != "שְׁעָרָ֗ו":
        raise RuntimeError("No se extrajo la lectura ortográfica")
    if (
        "80a79abd038de9159a90e7aa572f1d4ff6a0c7f1ca8bfb4195875ffd5a7ca20c"
        not in LEGACY_COMBINED_QERE_SPELLING_PACKAGE_SHAS
    ):
        raise RuntimeError("No se preservó la compatibilidad del paquete de Rut")
    mixed_spelling = "L= לַֽעֲבָור;K= לַעֲבוֹר"
    if witness_summary_for(mixed_spelling, exclude={"K"}) != "L=לַֽעֲבָור":
        raise RuntimeError("No se aisló la evidencia ortográfica no-K")
    ketiv_only = witness_summary_for(mixed_spelling, include={"K"})
    if ketiv_only != "K=לַעֲבוֹר" or spelling_reading(ketiv_only, "K") != "לַעֲבוֹר":
        raise RuntimeError("No se aisló el Ketiv dentro de la evidencia ortográfica")
    if meaning_reading(
        'K= sha.ar/v (שַׁעֲר/וֹ) "gate/ his"'
    ) != "שַׁעֲרוֹ":
        raise RuntimeError("No se extrajo la lectura de significado")
    omission = {
        "reference": {"english": "Rut.3.12"},
        "source_index": {"raw": "05"},
        "variants": {
            "meaning": 'K= im (אִם) "if"',
            "spelling": None,
        },
    }
    reading, _ = ketiv_reading(omission)
    if reading != "אִם":
        raise RuntimeError("No se extrajo el Ketiv de la omisión")
    sample = {"a": 1, "b": [2, 3]}
    if sha(sample) != sha(json.loads(canonical_json(sample))):
        raise RuntimeError("El hash canónico no es determinista")
    print("Auto-test de payload TAHOT: OK")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("package", nargs="?", type=Path)
    parser.add_argument("--policy", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return 0
    if args.package is None or args.policy is None or args.output is None:
        parser.error("package, --policy y --output son obligatorios")

    with gzip.open(args.package, "rt", encoding="utf-8") as handle:
        package = json.load(handle)
    manifest = json.loads(
        (args.package.parent / "manifest.json").read_text(encoding="utf-8")
    )
    package_sha = manifest["artifact"]["sha256"]
    policy = json.loads(args.policy.read_text(encoding="utf-8"))
    payload = build(package, policy, package_sha)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(canonical_json(payload) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "payload_sha256": payload["payload_sha256"],
                "counts": payload["counts"],
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
