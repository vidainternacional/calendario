#!/usr/bin/env python3
"""Audita los casos Qere/Ketiv del paquete TAHOT reproducible de Rut."""
from __future__ import annotations

import argparse
import gzip
import json
from pathlib import Path
from typing import Any

EXPECTED_COUNTS = {
    "chapters": 4,
    "references": 85,
    "source_rows": 1294,
    "visible_words": 1293,
    "qere_rows": 13,
    "qere_omission_placeholders": 1,
    "hebrew_rows": 1293,
    "aramaic_rows": 0,
    "unknown_language_rows": 0,
}


def ketiv_fragments(value: str | None) -> list[str]:
    if not value:
        return []
    fragments: list[str] = []
    for part in value.split(";"):
        item = part.strip()
        if item.startswith("K="):
            fragments.append(item[2:].strip())
    return fragments


def row_reference(row: dict[str, Any]) -> str:
    suffix = row.get("text_suffix") or ""
    return (
        f"{row['reference']['english']}#"
        f"{row['source_index']['raw']}{suffix}"
    )


def audit(package: dict[str, Any]) -> dict[str, Any]:
    if package.get("schema_version") != "stepbible-tahot-book-v1":
        raise RuntimeError("Versión de paquete TAHOT inesperada")
    if package.get("book", {}).get("internal_code") != "RUT":
        raise RuntimeError("El paquete no corresponde a Rut")

    counts = package.get("counts", {})
    mismatches = {
        key: {"expected": expected, "actual": counts.get(key)}
        for key, expected in EXPECTED_COUNTS.items()
        if counts.get(key) != expected
    }
    if mismatches:
        raise RuntimeError(f"Conteos de Rut inesperados: {mismatches}")

    cases: list[dict[str, Any]] = []
    for verse in package["verses"]:
        for row in verse["rows"]:
            if row["textual_status"] != "qere":
                continue

            meaning = ketiv_fragments(row["variants"]["meaning"])
            spelling = ketiv_fragments(row["variants"]["spelling"])
            if not meaning and not spelling:
                raise RuntimeError(
                    f"Qere sin evidencia Ketiv: {row_reference(row)}"
                )

            omission = bool(row["is_qere_omission_placeholder"])
            if omission:
                if row["is_visible_base_word"]:
                    raise RuntimeError("La omisión Qere fue marcada como palabra visible")
                if row["display_word_index"] is not None:
                    raise RuntimeError("La omisión Qere recibió índice visible artificial")
                if row["surface_form"]:
                    raise RuntimeError("La omisión Qere contiene una superficie artificial")
            elif not row["is_visible_base_word"] or row["display_word_index"] is None:
                raise RuntimeError(
                    f"Qere visible sin índice de lectura: {row_reference(row)}"
                )

            cases.append(
                {
                    "reference": row["reference"]["english"],
                    "source_reference": row_reference(row),
                    "source_index": row["source_index"]["raw"],
                    "source_line": row["source_line"],
                    "source_line_sha256": row["source_line_sha256"],
                    "qere": {
                        "surface_form": row["surface_form"],
                        "transliteration": row["transliteration"],
                        "source_gloss_en": row["source_gloss_en"],
                        "omission": omission,
                        "display_word_index": row["display_word_index"],
                    },
                    "ketiv": {
                        "meaning_evidence": meaning,
                        "spelling_evidence": spelling,
                    },
                }
            )

    if len(cases) != 13:
        raise RuntimeError(f"Casos Qere inesperados: {len(cases)} != 13")

    omissions = [case for case in cases if case["qere"]["omission"]]
    if len(omissions) != 1:
        raise RuntimeError(f"Omisiones Qere inesperadas: {omissions}")
    omission = omissions[0]
    if omission["reference"] != "Rut.3.12" or omission["source_index"] != "05":
        raise RuntimeError(f"Omisión Qere inesperada: {omission}")

    meaning_cases = sum(
        bool(case["ketiv"]["meaning_evidence"]) for case in cases
    )
    spelling_cases = sum(
        bool(case["ketiv"]["spelling_evidence"]) for case in cases
    )
    if meaning_cases != 11 or spelling_cases != 2:
        raise RuntimeError(
            "Distribución Ketiv inesperada: "
            f"meaning={meaning_cases}, spelling={spelling_cases}"
        )

    return {
        "schema_version": "vida-stepbible-ruth-qere-audit-v2",
        "book": package["book"],
        "source": package["source"],
        "summary": {
            "qere_cases": len(cases),
            "qere_omissions": len(omissions),
            "cases_with_meaning_evidence": meaning_cases,
            "cases_with_spelling_evidence": spelling_cases,
            "artificial_visible_words": 0,
        },
        "cases": cases,
    }


def write_markdown(path: Path, payload: dict[str, Any]) -> None:
    summary = payload["summary"]
    lines = [
        "# Auditoría Qere/Ketiv — Rut",
        "",
        f"- Casos Qere: {summary['qere_cases']}",
        f"- Omisiones Qere: {summary['qere_omissions']}",
        f"- Evidencia Ketiv de significado: {summary['cases_with_meaning_evidence']}",
        f"- Evidencia Ketiv ortográfica: {summary['cases_with_spelling_evidence']}",
        f"- Palabras visibles artificiales: {summary['artificial_visible_words']}",
        "",
        "| Referencia | Índice | Qere | Omisión | Evidencia Ketiv |",
        "|---|---:|---|---|---|",
    ]
    for case in payload["cases"]:
        evidence = (
            case["ketiv"]["meaning_evidence"]
            + case["ketiv"]["spelling_evidence"]
        )
        lines.append(
            f"| {case['reference']} | {case['source_index']} | "
            f"{case['qere']['surface_form'] or '[sin forma visible]'} | "
            f"{'sí' if case['qere']['omission'] else 'no'} | "
            f"{' · '.join(evidence)} |"
        )
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def self_test() -> None:
    value = "L= forma;K= palabra (כָּתַב);V= otra"
    if ketiv_fragments(value) != ["palabra (כָּתַב)"]:
        raise RuntimeError("No se extrajo la evidencia Ketiv")
    if ketiv_fragments(None) != []:
        raise RuntimeError("Un campo vacío produjo evidencia Ketiv")
    print("Auto-test de auditoría Qere/Ketiv de Rut: OK")


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
    (args.output / "ruth-qere-audit.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    write_markdown(args.output / "ruth-qere-audit.md", payload)
    print(json.dumps(payload["summary"], ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
