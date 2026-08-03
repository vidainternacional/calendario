#!/usr/bin/env python3
"""Audita integridad, variantes y Qere del paquete TAHOT de Nahúm."""
from __future__ import annotations

import argparse
import gzip
import json
from pathlib import Path
from typing import Any

EXPECTED_COUNTS = {
    "chapters": 3,
    "references": 47,
    "source_rows": 558,
    "visible_words": 558,
    "morpheme_components": 828,
    "variant_rows": 4,
    "qere_rows": 4,
    "qere_omission_placeholders": 0,
    "restored_rows": 0,
    "lxx_addition_rows": 0,
    "hebrew_rows": 558,
    "aramaic_rows": 0,
    "unknown_language_rows": 0,
    "alignment_mismatches": 0,
    "invalid_line_hashes": 0,
}


def evidence_fragments(value: str | None) -> list[str]:
    if not value:
        return []
    return [part.strip() for part in value.split(";") if part.strip()]


def ketiv_fragments(value: str | None) -> list[str]:
    return [item[2:].strip() for item in evidence_fragments(value) if item.startswith("K=")]


def source_reference(row: dict[str, Any]) -> str:
    return (
        f"{row['reference']['english']}#"
        f"{row['source_index']['raw']}{row.get('text_suffix') or ''}"
    )


def audit(package: dict[str, Any]) -> dict[str, Any]:
    if package.get("schema_version") != "stepbible-tahot-book-v1":
        raise RuntimeError("Versión de paquete TAHOT inesperada")
    if package.get("book") != {
        "step_code": "Nam",
        "internal_code": "NAM",
        "name_es": "Nahúm",
    }:
        raise RuntimeError(f"Identidad de libro inesperada: {package.get('book')}")

    counts = package.get("counts", {})
    mismatches = {
        key: {"expected": expected, "actual": counts.get(key)}
        for key, expected in EXPECTED_COUNTS.items()
        if counts.get(key) != expected
    }
    if mismatches:
        raise RuntimeError(f"Conteos de Nahúm inesperados: {mismatches}")

    variant_cases: list[dict[str, Any]] = []
    qere_cases: list[dict[str, Any]] = []

    for verse in package["verses"]:
        reference = verse["reference"]
        indexes = {
            int(row["display_word_index"])
            for row in verse["rows"]
            if row["display_word_index"] is not None
        }
        expected_indexes = set(range(1, verse["visible_word_count"] + 1))
        if indexes != expected_indexes:
            raise RuntimeError(
                f"Índices visibles discontinuos en {reference}: "
                f"{sorted(indexes)} != {sorted(expected_indexes)}"
            )

        for row in verse["rows"]:
            meaning = evidence_fragments(row["variants"]["meaning"])
            spelling = evidence_fragments(row["variants"]["spelling"])
            if meaning or spelling:
                variant_cases.append(
                    {
                        "reference": reference,
                        "source_reference": source_reference(row),
                        "source_index": row["source_index"]["raw"],
                        "source_line": row["source_line"],
                        "source_line_sha256": row["source_line_sha256"],
                        "textual_status": row["textual_status"],
                        "surface_form": row["surface_form"],
                        "transliteration": row["transliteration"],
                        "display_word_index": row["display_word_index"],
                        "meaning_evidence": meaning,
                        "spelling_evidence": spelling,
                    }
                )

            if row["textual_status"] == "qere":
                ketiv = ketiv_fragments(row["variants"]["meaning"]) + ketiv_fragments(
                    row["variants"]["spelling"]
                )
                if not ketiv:
                    raise RuntimeError(f"Qere sin evidencia Ketiv: {source_reference(row)}")
                if row["is_qere_omission_placeholder"]:
                    raise RuntimeError("Nahúm contiene una omisión Qere inesperada")
                if not row["is_visible_base_word"] or row["display_word_index"] is None:
                    raise RuntimeError("Un Qere de Nahúm no conserva palabra visible")
                qere_cases.append(
                    {
                        "reference": reference,
                        "source_reference": source_reference(row),
                        "source_index": row["source_index"]["raw"],
                        "source_line": row["source_line"],
                        "source_line_sha256": row["source_line_sha256"],
                        "display_word_index": row["display_word_index"],
                        "qere_surface": row["surface_form"],
                        "qere_transliteration": row["transliteration"],
                        "ketiv_evidence": ketiv,
                    }
                )

    if len(variant_cases) != 4:
        raise RuntimeError(f"Filas con variantes inesperadas: {len(variant_cases)} != 4")
    if len(qere_cases) != 4:
        raise RuntimeError(f"Casos Qere inesperados: {len(qere_cases)} != 4")
    if len({case["source_line_sha256"] for case in variant_cases}) != 4:
        raise RuntimeError("Las cuatro variantes no tienen procedencia única")
    if {case["source_reference"] for case in variant_cases} != {
        case["source_reference"] for case in qere_cases
    }:
        raise RuntimeError("Las filas Qere y las filas con variantes no coinciden")

    return {
        "schema_version": "vida-stepbible-nahum-package-audit-v1",
        "book": package["book"],
        "source": package["source"],
        "summary": {
            "references": counts["references"],
            "visible_words": counts["visible_words"],
            "morpheme_components": counts["morpheme_components"],
            "variant_rows": len(variant_cases),
            "qere_cases": len(qere_cases),
            "qere_omissions": 0,
            "artificial_visible_words": 0,
            "alignment_mismatches": counts["alignment_mismatches"],
            "invalid_line_hashes": counts["invalid_line_hashes"],
        },
        "variant_cases": variant_cases,
        "qere_cases": qere_cases,
    }


def write_markdown(path: Path, payload: dict[str, Any]) -> None:
    summary = payload["summary"]
    lines = [
        "# Auditoría de paquete TAHOT — Nahúm",
        "",
        f"- Referencias: {summary['references']}",
        f"- Palabras visibles: {summary['visible_words']}",
        f"- Componentes morfológicos: {summary['morpheme_components']}",
        f"- Filas con variantes: {summary['variant_rows']}",
        f"- Casos Qere: {summary['qere_cases']}",
        f"- Omisiones Qere: {summary['qere_omissions']}",
        f"- Palabras visibles artificiales: {summary['artificial_visible_words']}",
        f"- Desalineaciones: {summary['alignment_mismatches']}",
        f"- Hashes de línea inválidos: {summary['invalid_line_hashes']}",
        "",
        "## Variantes observadas",
        "",
        "| Referencia | Índice | Estado | Forma | Palabra visible | Evidencia de significado | Evidencia ortográfica |",
        "|---|---:|---|---|---:|---|---|",
    ]
    for case in payload["variant_cases"]:
        lines.append(
            f"| {case['reference']} | {case['source_index']} | "
            f"{case['textual_status']} | {case['surface_form']} | "
            f"{case['display_word_index']} | "
            f"{' · '.join(case['meaning_evidence']) or '—'} | "
            f"{' · '.join(case['spelling_evidence']) or '—'} |"
        )
    lines += ["", "## Qere/Ketiv", ""]
    for case in payload["qere_cases"]:
        lines.append(
            f"- {case['source_reference']}: Qere `{case['qere_surface']}`; "
            f"Ketiv `{' · '.join(case['ketiv_evidence'])}`; "
            f"índice visible {case['display_word_index']}."
        )
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def self_test() -> None:
    if ketiv_fragments("L=uno;K=dos;V=tres") != ["dos"]:
        raise RuntimeError("No se aisló la evidencia Ketiv")
    if evidence_fragments(None) != []:
        raise RuntimeError("Un campo vacío produjo evidencia")
    print("Auto-test de auditoría de Nahúm: OK")


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
    (args.output / "nahum-package-audit.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    write_markdown(args.output / "nahum-package-audit.md", payload)
    print(json.dumps(payload["summary"], ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
