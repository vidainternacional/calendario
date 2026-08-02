#!/usr/bin/env python3
"""Audita y estructura los casos Qere/Ketiv del paquete TAHOT de Rut."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def ketiv_fragments(value: str) -> list[str]:
    fragments = []
    for part in value.split(";"):
        item = part.strip()
        if item.startswith("K="):
            fragments.append(item[2:].strip())
    return fragments


def audit(package: dict[str, Any]) -> dict[str, Any]:
    cases = []
    for verse in package["verses"]:
        for row in verse["rows"]:
            if row["textual_status"] != "qere":
                continue
            meaning = ketiv_fragments(row["meaning_variants"])
            spelling = ketiv_fragments(row["spelling_variants"])
            if not meaning and not spelling:
                raise RuntimeError(
                    f"Qere sin evidencia Ketiv: {row['source_reference']}"
                )
            cases.append(
                {
                    "english_reference": row["english_reference"],
                    "source_reference": row["source_reference"],
                    "source_index": row["source_index"],
                    "qere": {
                        "hebrew": row["hebrew"],
                        "transliteration": row["transliteration"],
                        "translation": row["translation"],
                        "dstrongs": row["dstrongs"],
                        "grammar": row["grammar"],
                        "omission": row["qere_omission"],
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
    if len(omissions) != 1 or omissions[0]["source_reference"] != "Rut.3.12#05=Q(K)":
        raise RuntimeError(f"Omisión Qere inesperada: {omissions}")

    return {
        "schema_version": "vida-stepbible-tahot-qere-audit-v1",
        "book": "Rut",
        "package_sha256": package["package_sha256"],
        "summary": {
            "qere_cases": len(cases),
            "qere_omissions": len(omissions),
            "cases_with_meaning_evidence": sum(
                1 for case in cases if case["ketiv"]["meaning_evidence"]
            ),
            "cases_with_spelling_evidence": sum(
                1 for case in cases if case["ketiv"]["spelling_evidence"]
            ),
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
        f"- Casos con evidencia de significado Ketiv: {summary['cases_with_meaning_evidence']}",
        f"- Casos con evidencia ortográfica Ketiv: {summary['cases_with_spelling_evidence']}",
        "",
        "| Referencia | Índice | Qere | Omisión | Evidencia Ketiv |",
        "|---|---:|---|---|---|",
    ]
    for case in payload["cases"]:
        evidence = case["ketiv"]["meaning_evidence"] + case["ketiv"]["spelling_evidence"]
        lines.append(
            f"| {case['english_reference']} | {case['source_index']} | "
            f"{case['qere']['hebrew'] or '[sin forma visible]'} | "
            f"{'sí' if case['qere']['omission'] else 'no'} | "
            f"{' · '.join(evidence)} |"
        )
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def self_test() -> None:
    value = 'L= forma;K= palabra (כָּתַב);V= otra'
    if ketiv_fragments(value) != ["palabra (כָּתַב)"]:
        raise RuntimeError("No se extrajo la evidencia Ketiv")
    print("Auto-test de auditoría Qere/Ketiv: OK")


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

    package = json.loads(args.package.read_text(encoding="utf-8"))
    payload = audit(package)
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "rut-qere-audit.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    write_markdown(args.output / "rut-qere-audit.md", payload)
    print(json.dumps(payload["summary"], ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
