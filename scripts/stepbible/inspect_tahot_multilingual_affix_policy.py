#!/usr/bin/env python3
"""Inspecciona lemas TAHOT multilingües usando idioma + lexical_id. Solo lectura."""
from __future__ import annotations

import argparse
import gzip
import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Any

from tahot_components import row_components

SCRIPT_RE = re.compile(r"[\u0590-\u05ff]")


def inspect(package: dict[str, Any]) -> dict[str, Any]:
    catalog: dict[str, dict[str, Any]] = {}

    for verse in package["verses"]:
        for row in verse["rows"]:
            if row["is_qere_omission_placeholder"]:
                continue
            language = row["language"]
            if language not in {"hebrew", "aramaic"}:
                raise RuntimeError(f"Idioma no autorizado: {language}")
            for component in row_components(row):
                key = f"{language}:{component['lexical_id']}"
                entry = catalog.setdefault(
                    key,
                    {
                        "language": language,
                        "lexical_id": component["lexical_id"],
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
        key: sorted(entry["source_lemmas"])
        for key, entry in catalog.items()
        if len(entry["source_lemmas"]) != 1
    }
    if conflicts:
        raise RuntimeError(f"Lemas fuente conflictivos por idioma: {conflicts}")

    missing: dict[str, Any] = {}
    language_counts: dict[str, int] = defaultdict(int)
    for key, entry in sorted(catalog.items()):
        language_counts[entry["language"]] += 1
        source_lemma = next(iter(entry["source_lemmas"]))
        if SCRIPT_RE.search(source_lemma):
            continue
        missing[key] = {
            "language": entry["language"],
            "lexical_id": entry["lexical_id"],
            "strong_number": entry["strong_number"],
            "source_lemma": source_lemma,
            "token_kinds": sorted(entry["token_kinds"]),
            "surface_forms": sorted(entry["surface_forms"]),
            "morphology_codes": sorted(entry["morphology_codes"]),
            "sample_references": sorted(entry["references"])[:8],
            "occurrences": entry["occurrences"],
        }

    return {
        "schema_version": "vida-tahot-multilingual-affix-policy-inspection-v2",
        "book": package["book"],
        "source": package["source"],
        "summary": {
            "lexical_keys_total": len(catalog),
            "lexical_keys_by_language": dict(sorted(language_counts.items())),
            "lexical_keys_with_script_lemma": len(catalog) - len(missing),
            "lexical_keys_requiring_explicit_policy": len(missing),
        },
        "required_policy": missing,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--package", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    with gzip.open(args.package, "rt", encoding="utf-8") as handle:
        package = json.load(handle)
    result = inspect(package)
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "affix-policy-inspection-v2.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(result["summary"], ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
