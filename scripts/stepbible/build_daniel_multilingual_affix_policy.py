#!/usr/bin/env python3
"""Construye la política de afijos multilingüe de Daniel desde evidencia fijada."""
from __future__ import annotations

import argparse
import gzip
import json
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

from tahot_components import row_components

CANTILLATION = set(range(0x0591, 0x05B0))


def normalize_surface(value: str) -> str:
    normalized = unicodedata.normalize("NFC", value.strip())
    return "".join(ch for ch in normalized if ord(ch) not in CANTILLATION).strip()


def visible_letters(value: str) -> int:
    return sum(1 for ch in unicodedata.normalize("NFD", value) if unicodedata.category(ch).startswith("L"))


def load_legacy_policies(root: Path) -> dict[str, str]:
    merged: dict[str, str] = {}
    for path in sorted(root.glob("*_affix_lemma_policy.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        for lexical_id, lemma in data.items():
            previous = merged.get(lexical_id)
            if previous is not None and previous != lemma:
                raise RuntimeError(f"Política histórica conflictiva para {lexical_id}: {previous} / {lemma}")
            merged[lexical_id] = lemma
    return merged


def build(package: dict[str, Any], inspection: dict[str, Any], policy_root: Path) -> dict[str, Any]:
    legacy = load_legacy_policies(policy_root)
    observed: dict[str, Counter[str]] = defaultdict(Counter)
    token_kinds: dict[str, set[str]] = defaultdict(set)

    for verse in package["verses"]:
        for row in verse["rows"]:
            if row["is_qere_omission_placeholder"]:
                continue
            language = row["language"]
            for component in row_components(row):
                key = f"{language}:{component['lexical_id']}"
                surface = normalize_surface(component["surface_form"] or "")
                if surface:
                    observed[key][surface] += 1
                token_kinds[key].add(component["token_kind"])

    required_keys = set(inspection["required_policy"]) | set(inspection["conflicts"])
    entries: dict[str, Any] = {}
    for key in sorted(required_keys):
        language, lexical_id = key.split(":", 1)
        if language == "hebrew" and lexical_id in legacy:
            entries[key] = {
                "lemma": legacy[lexical_id],
                "basis": "approved_hebrew_affix_policy",
            }
            continue

        candidates = observed.get(key)
        if not candidates:
            raise RuntimeError(f"Sin forma observada para {key}")
        ranked = sorted(
            candidates.items(),
            key=lambda item: (-visible_letters(item[0]), -item[1], item[0]),
        )
        representative = ranked[0][0]
        roles = token_kinds[key]
        if roles <= {"suffix"} or "suffix" in roles:
            representative = f"־{representative.lstrip('־')}"
        elif roles <= {"prefix"}:
            representative = f"{representative.rstrip('־')}־"

        entries[key] = {
            "lemma": representative,
            "basis": "observed_representative_surface",
            "observed_count": candidates[ranked[0][0]],
            "candidate_count": len(candidates),
        }

    return {
        "schema_version": "vida-tahot-multilingual-affix-policy-v2",
        "book": package["book"],
        "source_commit": package["source"]["commit"],
        "source_sha256": package["source"]["sha256"],
        "entries": entries,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--package", type=Path, required=True)
    parser.add_argument("--inspection", type=Path, required=True)
    parser.add_argument("--policy-root", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    with gzip.open(args.package, "rt", encoding="utf-8") as handle:
        package = json.load(handle)
    inspection = json.loads(args.inspection.read_text(encoding="utf-8"))
    policy = build(package, inspection, args.policy_root)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(policy, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({"entries": len(policy["entries"])}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
