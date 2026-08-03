#!/usr/bin/env python3
"""Detecta identificadores TAHOT que necesitan un lema canónico explícito."""
from __future__ import annotations

import argparse
import gzip
import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Any

from audit_obadiah_model import row_components

HEBREW_RE = re.compile(r"[\u0590-\u05ff]")


def inspect(package: dict[str, Any]) -> dict[str, Any]:
    catalog: dict[str, dict[str, Any]] = {}

    for verse in package["verses"]:
        for row in verse["rows"]:
            if row["is_qere_omission_placeholder"]:
                continue
            for component in row_components(row):
                entry = catalog.setdefault(
                    component["lexical_id"],
                    {
                        "strong_number": component["strong_number"],
                        "source_lemmas": set(),
                        "token_kinds": set(),
                        "surface_forms": set(),
                        "morphology_codes": set(),
                        "references": set(),
                        "occurrences": 0,
                    },
                )
                entry["source_lemmas"].add(component["source_lemma"])
                entry["token_kinds"].add(component["token_kind"])
                if component["surface_form"]:
                    entry["surface_forms"].add(component["surface_form"])
                if component["morphology_code"]:
                    entry["morphology_codes"].add(component["morphology_code"])
                entry["references"].add(row["reference"]["english"])
                entry["occurrences"] += 1

    conflicts = {
        lexical_id: sorted(entry["source_lemmas"])
        for lexical_id, entry in catalog.items()
        if len(entry["source_lemmas"]) != 1
    }
    if conflicts:
        raise RuntimeError(f"Lemas fuente conflictivos: {conflicts}")

    missing: dict[str, Any] = {}
    for lexical_id, entry in sorted(catalog.items()):
        source_lemma = next(iter(entry["source_lemmas"]))
        if HEBREW_RE.search(source_lemma):
            continue
        missing[lexical_id] = {
            "strong_number": entry["strong_number"],
            "source_lemma": source_lemma,
            "token_kinds": sorted(entry["token_kinds"]),
            "surface_forms": sorted(entry["surface_forms"]),
            "morphology_codes": sorted(entry["morphology_codes"]),
            "sample_references": sorted(entry["references"])[:8],
            "occurrences": entry["occurrences"],
        }

    role_counts: dict[str, int] = defaultdict(int)
    for entry in missing.values():
        for role in entry["token_kinds"]:
            role_counts[role] += 1

    return {
        "schema_version": "vida-tahot-affix-policy-inspection-v1",
        "book": package["book"],
        "source": package["source"],
        "summary": {
            "lexical_ids_total": len(catalog),
            "lexical_ids_with_hebrew_source_lemma": len(catalog) - len(missing),
            "lexical_ids_requiring_explicit_policy": len(missing),
            "required_policy_roles": dict(sorted(role_counts.items())),
        },
        "required_policy": missing,
    }


def write_markdown(path: Path, result: dict[str, Any]) -> None:
    summary = result["summary"]
    lines = [
        f"# Inspección de lemas canónicos — {result['book']['name_es']}",
        "",
        f"- Identificadores léxicos totales: {summary['lexical_ids_total']}",
        f"- Con lema hebreo de fuente: {summary['lexical_ids_with_hebrew_source_lemma']}",
        f"- Requieren política explícita: {summary['lexical_ids_requiring_explicit_policy']}",
        "",
        "| ID | Strong | Lema fuente | Rol | Ocurrencias | Formas observadas |",
        "|---|---|---|---|---:|---|",
    ]
    for lexical_id, entry in result["required_policy"].items():
        lines.append(
            f"| `{lexical_id}` | `{entry['strong_number']}` | "
            f"`{entry['source_lemma']}` | {', '.join(entry['token_kinds'])} | "
            f"{entry['occurrences']} | {' · '.join(entry['surface_forms'])} |"
        )
    lines.extend(
        [
            "",
            "Este informe no asigna lemas automáticamente. Cada identificador debe resolverse mediante evidencia estructural y revisión explícita antes de construir el payload.",
        ]
    )
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def self_test() -> None:
    if not HEBREW_RE.search("־וֹ") or HEBREW_RE.search("Sp3ms"):
        raise RuntimeError("La detección de lema hebreo no funciona")
    print("Auto-test de inspección de afijos TAHOT: OK")


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
    result = inspect(package)

    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "affix-policy-inspection.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    write_markdown(args.output / "affix-policy-inspection.md", result)
    print(json.dumps(result["summary"], ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
