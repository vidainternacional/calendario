#!/usr/bin/env python3
"""Transformaciones reutilizables de componentes morfológicos TAHOT."""
from __future__ import annotations

import re
from typing import Any

LEXICAL_ID_RE = re.compile(r"^H\d{4}[A-Z]?$", re.ASCII)
STRONG_RE = re.compile(r"^H\d{4}$", re.ASCII)


def split_punctuation_tag(value: str) -> tuple[str, str | None]:
    lexical, separator, punctuation = value.partition("\\")
    return lexical, punctuation if separator else None


def split_components(value: str) -> list[str]:
    return value.split("/") if value else []


def strip_join_marker(value: str) -> tuple[str, bool]:
    stripped = value.strip()
    joins_next = stripped.endswith("+")
    return stripped.removesuffix("+"), joins_next


def normalized_lexical_id(value: str) -> str:
    core, _ = strip_join_marker(value)
    return core.removeprefix("{").removesuffix("}")


def is_root_component(value: str) -> bool:
    core, _ = strip_join_marker(value)
    return core.startswith("{") and core.endswith("}")


def parse_expanded_tag(value: str) -> tuple[str, str, str]:
    core, _ = strip_join_marker(value)
    core = core.removeprefix("{").removesuffix("}")
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
    expanded, expanded_punctuation = split_punctuation_tag(
        raw["expanded_strong_tags"]
    )
    dstrong_parts = split_components(dstrongs)
    expanded_parts = split_components(expanded)
    aligned = row["alignment"]["components"]

    if len(dstrong_parts) != len(expanded_parts) or len(dstrong_parts) != len(aligned):
        raise ValueError(
            f"Componentes desalineados en {row['reference']['english']}#"
            f"{row['source_index']['raw']}"
        )

    root_positions = [
        index for index, value in enumerate(dstrong_parts) if is_root_component(value)
    ]
    if len(root_positions) != 1:
        raise ValueError(
            f"Se esperaba una raíz única en {row['reference']['english']}#"
            f"{row['source_index']['raw']}: {dstrong_parts}"
        )
    root_position = root_positions[0]

    result: list[dict[str, Any]] = []
    for index, (source_id, expanded_tag, aligned_component) in enumerate(
        zip(dstrong_parts, expanded_parts, aligned, strict=True)
    ):
        lexical_id = normalized_lexical_id(source_id)
        expanded_id, lemma, source_gloss = parse_expanded_tag(expanded_tag)
        if expanded_id != lexical_id:
            raise ValueError(
                f"Identificador diferente en {row['reference']['english']}#"
                f"{row['source_index']['raw']}: {lexical_id} != {expanded_id}"
            )
        if not LEXICAL_ID_RE.fullmatch(lexical_id):
            raise ValueError(f"Identificador no compatible con Supabase: {lexical_id}")

        _, source_joins_next = strip_join_marker(source_id)
        _, expanded_joins_next = strip_join_marker(expanded_tag)
        if source_joins_next != expanded_joins_next:
            raise ValueError(
                f"Marca de unión diferente en {row['reference']['english']}#"
                f"{row['source_index']['raw']}"
            )

        token_kind = (
            "prefix"
            if index < root_position
            else "word"
            if index == root_position
            else "suffix"
        )
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
                "source_joins_next_word": source_joins_next,
            }
        )

    if (punctuation_tag is None) != (expanded_punctuation is None):
        raise ValueError(
            f"Puntuación no alineada en {row['reference']['english']}#"
            f"{row['source_index']['raw']}"
        )
    return result


def self_test() -> None:
    if normalized_lexical_id("{H1035G}+") != "H1035G":
        raise RuntimeError("No se normalizó una raíz con marca de unión")
    if not is_root_component("{H1035G}+"):
        raise RuntimeError("No se reconoció una raíz con marca de unión")
    if parse_expanded_tag("{H1035G=בֵּית לֶחֶם=Bethlehem}+")[0] != "H1035G":
        raise RuntimeError("No se interpretó la etiqueta expandida con unión")
    print("Auto-test de componentes TAHOT: OK")


if __name__ == "__main__":
    self_test()
