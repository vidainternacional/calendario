#!/usr/bin/env python3
"""Valida una política canónica contra un informe de inspección TAHOT."""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

HEBREW_RE = re.compile(r"[\u0590-\u05ff]")


def validate(inspection: dict, policy: dict[str, str]) -> dict:
    required = set(inspection["required_policy"])
    provided = set(policy)
    missing = sorted(required - provided)
    extra = sorted(provided - required)
    invalid_values = sorted(
        lexical_id
        for lexical_id, lemma in policy.items()
        if not isinstance(lemma, str)
        or not lemma.strip()
        or not HEBREW_RE.search(lemma)
    )
    if missing or extra or invalid_values:
        raise RuntimeError(
            "Política canónica inválida: "
            f"missing={missing}, extra={extra}, invalid_values={invalid_values}"
        )

    return {
        "schema_version": "vida-tahot-affix-policy-validation-v1",
        "book": inspection["book"],
        "required_ids": len(required),
        "provided_ids": len(provided),
        "missing_ids": missing,
        "extra_ids": extra,
        "invalid_values": invalid_values,
        "status": "approved_for_payload_build",
    }


def self_test() -> None:
    inspection = {
        "book": {"internal_code": "TST"},
        "required_policy": {"H9001": {}},
    }
    result = validate(inspection, {"H9001": "־וֹ"})
    if result["status"] != "approved_for_payload_build":
        raise RuntimeError("La política sintética válida fue rechazada")
    try:
        validate(inspection, {"H9002": "Sp3m"})
    except RuntimeError:
        pass
    else:
        raise RuntimeError("La política sintética inválida fue aceptada")
    print("Auto-test de política canónica TAHOT: OK")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--inspection", type=Path)
    parser.add_argument("--policy", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return 0
    if args.inspection is None or args.policy is None or args.output is None:
        parser.error("--inspection, --policy y --output son obligatorios")

    inspection = json.loads(args.inspection.read_text(encoding="utf-8"))
    policy = json.loads(args.policy.read_text(encoding="utf-8"))
    result = validate(inspection, policy)
    args.output.write_text(
        json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
