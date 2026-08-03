#!/usr/bin/env python3
"""Audita el paquete TAHOT reproducible de Jonás."""
from __future__ import annotations

import argparse
import gzip
import json
from pathlib import Path
from typing import Any

VERSE_COUNTS = [17, 10, 10, 11]
EXPECTED_COUNTS = {
    "chapters": 4,
    "references": 48,
    "source_rows": 688,
    "visible_words": 688,
    "morpheme_components": 1080,
    "variant_rows": 0,
    "qere_rows": 0,
    "qere_omission_placeholders": 0,
    "restored_rows": 0,
    "lxx_addition_rows": 0,
    "hebrew_rows": 688,
    "aramaic_rows": 0,
    "unknown_language_rows": 0,
    "alignment_mismatches": 0,
    "invalid_line_hashes": 0,
}
EXPECTED_SOURCE_SHA256 = "f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5"
EXPECTED_TEXTUAL_STATUS = "leningrad"


def expected_references() -> list[str]:
    return [
        f"Jon.{chapter}.{verse}"
        for chapter, verse_count in enumerate(VERSE_COUNTS, 1)
        for verse in range(1, verse_count + 1)
    ]


def valid_sha256(value: str) -> bool:
    return len(value) == 64 and all(character in "0123456789abcdef" for character in value)


def audit(package: dict[str, Any]) -> dict[str, Any]:
    if package.get("schema_version") != "stepbible-tahot-book-v1":
        raise RuntimeError("Versión de paquete TAHOT inesperada")
    if package.get("book") != {
        "step_code": "Jon",
        "internal_code": "JON",
        "name_es": "Jonás",
    }:
        raise RuntimeError(f"Identidad de libro inesperada: {package.get('book')}")

    source = package.get("source", {})
    if source.get("key") != "tahot-isa-mal":
        raise RuntimeError(f"Fuente de Jonás inesperada: {source.get('key')}")
    if source.get("sha256") != EXPECTED_SOURCE_SHA256:
        raise RuntimeError("La huella de la fuente de Jonás no coincide con la aprobada")
    if source.get("license") != "CC BY 4.0":
        raise RuntimeError("Licencia de Jonás inesperada")

    counts = package.get("counts", {})
    mismatches = {
        key: {"expected": expected, "actual": counts.get(key)}
        for key, expected in EXPECTED_COUNTS.items()
        if counts.get(key) != expected
    }
    if mismatches:
        raise RuntimeError(f"Conteos de Jonás inesperados: {mismatches}")

    verses = package.get("verses", [])
    references = [verse.get("reference") for verse in verses]
    expected = expected_references()
    if references != expected:
        raise RuntimeError("El catálogo ordenado de 48 referencias de Jonás cambió")

    source_hashes: set[str] = set()
    component_total = 0
    artificial_visible_words = 0

    for verse in verses:
        reference = str(verse["reference"])
        rows = verse.get("rows", [])
        visible_count = int(verse.get("visible_word_count", -1))
        source_count = int(verse.get("source_row_count", -1))

        if source_count != len(rows) or visible_count != len(rows):
            raise RuntimeError(
                f"Jonás debe conservar una palabra visible por fila en {reference}: "
                f"filas={len(rows)}, fuente={source_count}, visibles={visible_count}"
            )
        if verse.get("variant_row_count") != 0:
            raise RuntimeError(f"Variante inesperada en {reference}")
        if verse.get("alignment_mismatch_count") != 0:
            raise RuntimeError(f"Desalineación inesperada en {reference}")
        if not verse.get("original_text") or not verse.get("transliteration"):
            raise RuntimeError(f"Texto o transliteración vacíos en {reference}")
        if not valid_sha256(str(verse.get("content_hash", ""))):
            raise RuntimeError(f"Hash de versículo inválido en {reference}")

        indexes = {int(row["display_word_index"]) for row in rows}
        expected_indexes = set(range(1, visible_count + 1))
        if indexes != expected_indexes:
            raise RuntimeError(
                f"Índices visibles discontinuos en {reference}: "
                f"{sorted(indexes)} != {sorted(expected_indexes)}"
            )

        for row in rows:
            if row.get("textual_status") != EXPECTED_TEXTUAL_STATUS:
                raise RuntimeError(
                    f"Estado textual inesperado en {reference}: {row.get('textual_status')}"
                )
            if row.get("is_qere_omission_placeholder"):
                raise RuntimeError(f"Omisión Qere inesperada en {reference}")
            if not row.get("is_visible_base_word") or row.get("display_word_index") is None:
                artificial_visible_words += 1
            variants = row.get("variants", {})
            if variants.get("meaning") or variants.get("spelling"):
                raise RuntimeError(f"Evidencia variante inesperada en {reference}")
            alignment = row.get("alignment", {})
            if not alignment.get("aligned"):
                raise RuntimeError(f"Fila desalineada en {reference}")
            components = alignment.get("components", [])
            if not components or len(components) > 4:
                raise RuntimeError(
                    f"Cantidad de componentes inesperada en {reference}: {len(components)}"
                )
            component_total += len(components)
            line_hash = str(row.get("source_line_sha256", ""))
            if not valid_sha256(line_hash):
                raise RuntimeError(f"Hash de línea inválido en {reference}")
            source_hashes.add(line_hash)

    if component_total != EXPECTED_COUNTS["morpheme_components"]:
        raise RuntimeError(
            f"Total de componentes inesperado: {component_total} != 1080"
        )
    if len(source_hashes) != EXPECTED_COUNTS["source_rows"]:
        raise RuntimeError(
            f"Procedencia de líneas no única: {len(source_hashes)} != 688"
        )
    if artificial_visible_words != 0:
        raise RuntimeError(f"Palabras visibles artificiales: {artificial_visible_words}")

    return {
        "schema_version": "vida-stepbible-jonah-package-audit-v1",
        "book": package["book"],
        "source": package["source"],
        "summary": {
            "references": counts["references"],
            "visible_words": counts["visible_words"],
            "morpheme_components": component_total,
            "textual_status": EXPECTED_TEXTUAL_STATUS,
            "variant_rows": 0,
            "qere_cases": 0,
            "qere_omissions": 0,
            "artificial_visible_words": artificial_visible_words,
            "alignment_mismatches": counts["alignment_mismatches"],
            "invalid_line_hashes": counts["invalid_line_hashes"],
            "unique_source_line_hashes": len(source_hashes),
        },
    }


def write_markdown(path: Path, payload: dict[str, Any]) -> None:
    summary = payload["summary"]
    lines = [
        "# Auditoría de paquete TAHOT — Jonás",
        "",
        f"- Referencias: {summary['references']}",
        f"- Palabras visibles: {summary['visible_words']}",
        f"- Componentes morfológicos: {summary['morpheme_components']}",
        f"- Estado textual base: {summary['textual_status']}",
        f"- Filas con variantes: {summary['variant_rows']}",
        f"- Casos Qere: {summary['qere_cases']}",
        f"- Omisiones Qere: {summary['qere_omissions']}",
        f"- Palabras visibles artificiales: {summary['artificial_visible_words']}",
        f"- Desalineaciones: {summary['alignment_mismatches']}",
        f"- Hashes de línea inválidos: {summary['invalid_line_hashes']}",
        f"- Hashes de línea únicos: {summary['unique_source_line_hashes']}",
        "",
        "Jonás no contiene filas Qere ni variantes en el paquete fijado.",
    ]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def self_test() -> None:
    if len(expected_references()) != 48:
        raise RuntimeError("El catálogo de Jonás no contiene 48 referencias")
    if expected_references()[0] != "Jon.1.1" or expected_references()[-1] != "Jon.4.11":
        raise RuntimeError("Los límites del catálogo de Jonás son incorrectos")
    if not valid_sha256("a" * 64) or valid_sha256("z" * 64):
        raise RuntimeError("La validación SHA-256 sintética falló")
    if EXPECTED_TEXTUAL_STATUS != "leningrad":
        raise RuntimeError("El estado textual base de Jonás cambió")
    print("Auto-test de auditoría de Jonás: OK")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--package", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return 0
    if args.package is None or args.output is None:
        parser.error("--package y --output son obligatorios")

    with gzip.open(args.package, "rt", encoding="utf-8") as handle:
        package = json.load(handle)
    payload = audit(package)

    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "jonah-package-audit.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    write_markdown(args.output / "jonah-package-audit.md", payload)
    print(json.dumps(payload["summary"], ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
