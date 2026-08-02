#!/usr/bin/env python3
"""Audita el paquete TAHOT de Obadías contra el modelo textual de Supabase."""
from __future__ import annotations

import argparse
import gzip
import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

LEXICAL_ID_RE = re.compile(r"^H\d{4}[A-Z]?$", re.ASCII)
STRONG_RE = re.compile(r"^H\d{4}$", re.ASCII)
SMALLINT_MAX = 32767


def split_punctuation_tag(value: str) -> tuple[str, str | None]:
    lexical, separator, punctuation = value.partition("\\")
    return lexical, punctuation if separator else None


def split_components(value: str) -> list[str]:
    return value.split("/") if value else []


def normalized_lexical_id(value: str) -> str:
    return value.strip().removeprefix("{").removesuffix("}")


def parse_expanded_tag(value: str) -> tuple[str, str, str]:
    core = value.strip().removeprefix("{").removesuffix("}")
    parts = core.split("=", 2)
    if len(parts) != 3 or not all(parts[:2]):
        raise ValueError(f"Etiqueta expandida inválida: {value}")
    return parts[0], parts[1], parts[2]


def derive_strong_number(lexical_id: str) -> str:
    strong = lexical_id[:5]
    if not STRONG_RE.fullmatch(strong):
        raise ValueError(f"Strong derivado inválido: {lexical_id} -> {strong}")
    return strong


def row_components(row: dict[str, Any]) -> list[dict[str, Any]]:
    raw = row["raw_fields"]
    dstrongs, punctuation_tag = split_punctuation_tag(raw["dstrongs"])
    expanded, expanded_punctuation = split_punctuation_tag(raw["expanded_strong_tags"])
    dstrong_parts = split_components(dstrongs)
    expanded_parts = split_components(expanded)
    aligned = row["alignment"]["components"]

    if len(dstrong_parts) != len(expanded_parts) or len(dstrong_parts) != len(aligned):
        raise ValueError(
            f"Componentes desalineados en {row['reference']['english']}#{row['source_index']['raw']}"
        )

    root_positions = [
        index
        for index, value in enumerate(dstrong_parts)
        if value.startswith("{") and value.endswith("}")
    ]
    if len(root_positions) != 1:
        raise ValueError(
            f"Se esperaba una raíz única en {row['reference']['english']}#{row['source_index']['raw']}: "
            f"{dstrong_parts}"
        )
    root_position = root_positions[0]

    result = []
    for index, (source_id, expanded_tag, aligned_component) in enumerate(
        zip(dstrong_parts, expanded_parts, aligned, strict=True)
    ):
        lexical_id = normalized_lexical_id(source_id)
        expanded_id, lemma, source_gloss = parse_expanded_tag(expanded_tag)
        if expanded_id != lexical_id:
            raise ValueError(
                f"Identificador diferente en {row['reference']['english']}#{row['source_index']['raw']}: "
                f"{lexical_id} != {expanded_id}"
            )
        if not LEXICAL_ID_RE.fullmatch(lexical_id):
            raise ValueError(f"Identificador no compatible con Supabase: {lexical_id}")

        token_kind = "prefix" if index < root_position else "word" if index == root_position else "suffix"
        result.append(
            {
                "lexical_id": lexical_id,
                "strong_number": derive_strong_number(lexical_id),
                "source_lemma": lemma,
                "source_gloss": source_gloss,
                "token_kind": token_kind,
                "surface_form": aligned_component["hebrew"],
                "transliteration": aligned_component["transliteration"],
                "occurrence_gloss_en": aligned_component["translation"],
                "morphology_code": aligned_component["grammar"],
                "morpheme_index": index + 1,
                "joins_previous": index > 0,
                "joins_next": index < len(dstrong_parts) - 1,
            }
        )

    if (punctuation_tag is None) != (expanded_punctuation is None):
        raise ValueError(
            f"Puntuación no alineada en {row['reference']['english']}#{row['source_index']['raw']}"
        )
    return result


def audit(package_path: Path) -> dict[str, Any]:
    with gzip.open(package_path, "rt", encoding="utf-8") as handle:
        package = json.load(handle)

    lexical_catalog: dict[str, dict[str, set[str] | int]] = {}
    occurrence_keys: set[tuple[int, int, int, int]] = set()
    role_counts: Counter[str] = Counter()
    variant_types: Counter[str] = Counter()
    rows = 0
    components = 0
    max_word_index = 0
    max_morpheme_index = 0

    for verse in package["verses"]:
        chapter = int(verse["rows"][0]["reference"]["chapter"])
        verse_number = int(verse["rows"][0]["reference"]["verse"])
        for row in verse["rows"]:
            rows += 1
            word_index = int(row["source_index"]["base"])
            display_word_index = int(row["display_word_index"])
            if not 0 < word_index <= SMALLINT_MAX or not 0 < display_word_index <= SMALLINT_MAX:
                raise ValueError(f"Índice fuera de smallint en {verse['reference']}")
            max_word_index = max(max_word_index, word_index)

            parsed_components = row_components(row)
            for component in parsed_components:
                components += 1
                morpheme_index = int(component["morpheme_index"])
                max_morpheme_index = max(max_morpheme_index, morpheme_index)
                key = (chapter, verse_number, word_index, morpheme_index)
                if key in occurrence_keys:
                    raise ValueError(f"Clave de ocurrencia duplicada: {key}")
                occurrence_keys.add(key)
                role_counts[component["token_kind"]] += 1

                entry = lexical_catalog.setdefault(
                    component["lexical_id"],
                    {
                        "strong_numbers": set(),
                        "source_lemmas": set(),
                        "source_glosses": set(),
                        "token_kinds": set(),
                        "occurrences": 0,
                    },
                )
                entry["strong_numbers"].add(component["strong_number"])
                entry["source_lemmas"].add(component["source_lemma"])
                entry["source_glosses"].add(component["source_gloss"])
                entry["token_kinds"].add(component["token_kind"])
                entry["occurrences"] += 1

            if row["variants"]["meaning"]:
                variant_types["substitution"] += 1
            if row["variants"]["spelling"]:
                variant_types["orthographic"] += 1

    conflicting_lemmas = {
        lexical_id: sorted(entry["source_lemmas"])
        for lexical_id, entry in lexical_catalog.items()
        if len(entry["source_lemmas"]) != 1
    }
    conflicting_strongs = {
        lexical_id: sorted(entry["strong_numbers"])
        for lexical_id, entry in lexical_catalog.items()
        if len(entry["strong_numbers"]) != 1
    }
    if conflicting_lemmas or conflicting_strongs:
        raise ValueError(
            f"Catálogo léxico inconsistente: lemas={conflicting_lemmas}, Strong={conflicting_strongs}"
        )

    mixed_token_kinds = {
        lexical_id: sorted(entry["token_kinds"])
        for lexical_id, entry in lexical_catalog.items()
        if len(entry["token_kinds"]) > 1
    }

    return {
        "schema_version": "vida-obadiah-supabase-compatibility-v1",
        "package": {
            "book_code": package["book"]["internal_code"],
            "source_commit": package["source"]["commit"],
            "source_sha256": package["source"]["sha256"],
            "references": package["counts"]["references"],
            "source_rows": rows,
            "morpheme_components": components,
        },
        "lexical_entries": {
            "unique": len(lexical_catalog),
            "all_ids_valid": True,
            "all_strongs_valid": True,
            "conflicting_source_lemmas": conflicting_lemmas,
            "conflicting_strong_numbers": conflicting_strongs,
            "mixed_token_kinds": mixed_token_kinds,
        },
        "occurrences": {
            "unique_keys": len(occurrence_keys),
            "roles": dict(role_counts),
            "max_word_index": max_word_index,
            "max_morpheme_index": max_morpheme_index,
            "smallint_compatible": True,
        },
        "verse_texts": {
            "rows": len(package["verses"]),
            "language": "hebrew",
            "text_direction": "rtl",
            "literal_translation_es_available": False,
        },
        "variants": {
            "rows": sum(variant_types.values()),
            "types": dict(variant_types),
        },
        "required_transformations": [
            "strip_root_braces_from_lexical_id",
            "remove_punctuation_tags_from_lexical_components",
            "derive_base_strong_number",
            "classify_prefix_root_suffix_by_root_braces",
            "reuse_existing_lexical_entries_without_overwrite",
            "apply_canonical_affix_lemma_policy",
            "create_spanish_editorial_glosses_separately",
            "store_qere_ketiv_as_structured_variants",
        ],
    }


def write_markdown(path: Path, result: dict[str, Any]) -> None:
    lexical = result["lexical_entries"]
    occurrences = result["occurrences"]
    variants = result["variants"]
    lines = [
        "# Auditoría automática de compatibilidad — Obadías",
        "",
        f"- Entradas léxicas únicas: {lexical['unique']}",
        f"- Ocurrencias morfológicas: {occurrences['unique_keys']}",
        f"- Raíces: {occurrences['roles'].get('word', 0)}",
        f"- Prefijos: {occurrences['roles'].get('prefix', 0)}",
        f"- Sufijos: {occurrences['roles'].get('suffix', 0)}",
        f"- Índice fuente máximo: {occurrences['max_word_index']}",
        f"- Morfemas máximos por palabra: {occurrences['max_morpheme_index']}",
        f"- Variantes estructurables: {variants['rows']}",
        f"- Tipos de variante: {json.dumps(variants['types'], ensure_ascii=False, sort_keys=True)}",
        f"- Identificadores compatibles: {lexical['all_ids_valid']}",
        f"- Strong derivados compatibles: {lexical['all_strongs_valid']}",
        f"- Lemas fuente conflictivos: {len(lexical['conflicting_source_lemmas'])}",
        "",
        "## Identificadores usados en más de un tipo de ocurrencia",
        "",
    ]
    if lexical["mixed_token_kinds"]:
        for lexical_id, roles in lexical["mixed_token_kinds"].items():
            lines.append(f"- `{lexical_id}`: {', '.join(roles)}")
    else:
        lines.append("Ninguno.")
    lines.extend(["", "## Transformaciones requeridas", ""])
    for transformation in result["required_transformations"]:
        lines.append(f"- `{transformation}`")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("package", type=Path)
    parser.add_argument("--output", type=Path, default=Path("artifacts/obadiah-compatibility"))
    args = parser.parse_args()

    result = audit(args.package)
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "compatibility.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    write_markdown(args.output / "compatibility.md", result)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
