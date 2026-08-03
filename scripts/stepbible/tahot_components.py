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


def is_structural_separator(
    source_id: str,
    expanded_tag: str,
    aligned_component: dict[str, Any],
) -> bool:
    if source_id.strip() or expanded_tag.strip():
        return False
    semantic_values = (
        aligned_component.get("hebrew"),
        aligned_component.get("transliteration"),
        aligned_component.get("translation"),
        aligned_component.get("grammar"),
    )
    if any(str(value or "").strip() for value in semantic_values):
        raise ValueError(
            "Componente sin identificador conserva contenido lingüístico: "
            f"{aligned_component}"
        )
    return True


def split_segments(
    dstrong_parts: list[str],
    expanded_parts: list[str],
    aligned: list[dict[str, Any]],
) -> list[list[tuple[str, str, dict[str, Any]]]]:
    segments: list[list[tuple[str, str, dict[str, Any]]]] = []
    current: list[tuple[str, str, dict[str, Any]]] = []

    for source_id, expanded_tag, aligned_component in zip(
        dstrong_parts, expanded_parts, aligned, strict=True
    ):
        if is_structural_separator(source_id, expanded_tag, aligned_component):
            if current:
                segments.append(current)
                current = []
            continue
        current.append((source_id, expanded_tag, aligned_component))

    if current:
        segments.append(current)
    return segments


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

    segments = split_segments(dstrong_parts, expanded_parts, aligned)
    if not segments:
        raise ValueError(
            f"Fila sin componentes léxicos en {row['reference']['english']}#"
            f"{row['source_index']['raw']}"
        )

    result: list[dict[str, Any]] = []
    morpheme_index = 0
    for segment_index, segment in enumerate(segments, 1):
        root_positions = [
            index
            for index, (value, _, _) in enumerate(segment)
            if is_root_component(value)
        ]
        if len(root_positions) != 1:
            raise ValueError(
                f"Se esperaba una raíz única por segmento en "
                f"{row['reference']['english']}#{row['source_index']['raw']} "
                f"segmento {segment_index}: {[value for value, _, _ in segment]}"
            )
        root_position = root_positions[0]

        for index, (source_id, expanded_tag, aligned_component) in enumerate(segment):
            lexical_id = normalized_lexical_id(source_id)
            expanded_id, lemma, source_gloss = parse_expanded_tag(expanded_tag)
            if expanded_id != lexical_id:
                raise ValueError(
                    f"Identificador diferente en {row['reference']['english']}#"
                    f"{row['source_index']['raw']}: {lexical_id} != {expanded_id}"
                )
            if not LEXICAL_ID_RE.fullmatch(lexical_id):
                raise ValueError(
                    f"Identificador no compatible con Supabase: {lexical_id}"
                )

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
            morpheme_index += 1
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
                    "morpheme_index": morpheme_index,
                    "segment_index": segment_index,
                    "joins_previous": index > 0,
                    "joins_next": index < len(segment) - 1,
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

    synthetic = {
        "reference": {"english": "Rut.3.5"},
        "source_index": {"raw": "05"},
        "raw_fields": {
            "dstrongs": "{H0559}/ /{H0413}/H9030",
            "expanded_strong_tags": (
                "{H0559=אָמַר=to say}/ /{H0413=אֵל=to}/H9030=Sp1c=me"
            ),
        },
        "alignment": {
            "components": [
                {
                    "hebrew": "תֹּאמְרִי",
                    "transliteration": "tom.Ri",
                    "translation": "you say",
                    "grammar": "HVqi2fs",
                },
                {
                    "hebrew": " ",
                    "transliteration": " ",
                    "translation": " ",
                    "grammar": " ",
                },
                {
                    "hebrew": "אֵלַ",
                    "transliteration": "'e.La",
                    "translation": "to",
                    "grammar": "HR",
                },
                {
                    "hebrew": "י",
                    "transliteration": "i",
                    "translation": "me",
                    "grammar": "Sp1c",
                },
            ]
        },
    }
    components = row_components(synthetic)
    if [item["token_kind"] for item in components] != ["word", "word", "suffix"]:
        raise RuntimeError(f"Segmentación multirraíz inesperada: {components}")
    if components[1]["joins_previous"] or not components[2]["joins_previous"]:
        raise RuntimeError("Las uniones entre segmentos no se preservaron")
    print("Auto-test de componentes TAHOT: OK")


if __name__ == "__main__":
    self_test()
