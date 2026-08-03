#!/usr/bin/env python3
"""Fija la huella y los cuatro casos Qere/Ketiv del paquete de Nahúm."""
from __future__ import annotations

import argparse
import gzip
import hashlib
import json
from pathlib import Path
from typing import Any

from audit_nahum_package import audit

EXPECTED_PACKAGE_BYTES = 110_590
EXPECTED_PACKAGE_SHA256 = "60e280a6d94abc8788b7cc9647e4dfa0f679e0a9708a1adf00be30abfc23b7f5"

EXPECTED_CASES: dict[str, dict[str, Any]] = {
    "Nam.1.3#04=Q(K)": {
        "reference": "Nam.1.3",
        "display_word_index": 4,
        "qere_surface": "וּגְדָל",
        "ketiv_evidence": [
            'u./ge.dol- (וּ/גְדוֹל) "and/ great of" (H9002/H1419A=HC/Aabsc)'
        ],
        "meaning_evidence": [
            'K= u./ge.dol- (וּ/גְדוֹל) "and/ great of" (H9002/H1419A=HC/Aabsc)'
        ],
        "spelling_evidence": ["L= וּ/גְדָול\\־ ¦"],
        "source_line_sha256": "a89d8026a33cf6ee0026547388a3da4e02f0abe123b1dc2d69691341c345ffb7",
    },
    "Nam.1.15#17=Q(k)": {
        "reference": "Nam.1.15",
        "display_word_index": 17,
        "qere_surface": "לַֽעֲבָר",
        "ketiv_evidence": ["לַ/עֲבוֹר"],
        "meaning_evidence": [],
        "spelling_evidence": ["L= לַֽ/עֲבָור\\־ ¦", "K= לַ/עֲבוֹר"],
        "source_line_sha256": "ecb2bf4c628b4def3ccf97803c570dcdc1bde4f8aa64effc8204c36f027b61f7",
    },
    "Nam.2.5#04=Q(K)": {
        "reference": "Nam.2.5",
        "display_word_index": 4,
        "qere_surface": "בַּהֲלִֽיכָתָ֑ם",
        "ketiv_evidence": [
            'va./ha.li.kho.ta/m (בַ/הֲלִכוֹתָ/ם) "on/ journeys/ their" (H9003/H1979/H9028=HR/Ncfpc/Sp3mp)'
        ],
        "meaning_evidence": [
            'K= va./ha.li.kho.ta/m (בַ/הֲלִכוֹתָ/ם) "on/ journeys/ their" (H9003/H1979/H9028=HR/Ncfpc/Sp3mp)'
        ],
        "spelling_evidence": ["L= בַּ/הֲלִֽכָותָ֑/ם ¦"],
        "source_line_sha256": "b3d2baafdd8efb5c795f16f6fdc95ea66dafeac812bfd70da587c4709ddefa16",
    },
    "Nam.3.3#14=Q(K)": {
        "reference": "Nam.3.3",
        "display_word_index": 14,
        "qere_surface": "וְכָשְׁל֖וּ",
        "ketiv_evidence": [
            'yikh.she.lu (יִכְשְׁלוּ) "people will stumble" (H3782=HVqi3mp)'
        ],
        "meaning_evidence": [
            'K= yikh.she.lu (יִכְשְׁלוּ) "people will stumble" (H3782=HVqi3mp)'
        ],
        "spelling_evidence": ["L= יְכָשְׁל֖וּ ¦"],
        "source_line_sha256": "edaeb818785689d6e1f732c4205c5175dd730cc15250b740e3a0a9b74c5f3ab6",
    },
}


def verify(path: Path) -> dict[str, Any]:
    raw = path.read_bytes()
    actual_sha = hashlib.sha256(raw).hexdigest()
    if len(raw) != EXPECTED_PACKAGE_BYTES:
        raise RuntimeError(f"Tamaño inesperado: {len(raw)} != {EXPECTED_PACKAGE_BYTES}")
    if actual_sha != EXPECTED_PACKAGE_SHA256:
        raise RuntimeError(f"SHA-256 inesperado: {actual_sha}")

    with gzip.open(path, "rt", encoding="utf-8") as handle:
        package = json.load(handle)
    audited = audit(package)
    variants = {case["source_reference"]: case for case in audited["variant_cases"]}
    qere = {case["source_reference"]: case for case in audited["qere_cases"]}
    if set(variants) != set(EXPECTED_CASES) or set(qere) != set(EXPECTED_CASES):
        raise RuntimeError("El conjunto de casos Qere/variantes cambió")

    verified: list[dict[str, Any]] = []
    for source_ref, expected in EXPECTED_CASES.items():
        variant = variants[source_ref]
        qere_case = qere[source_ref]
        actual = {
            "reference": variant["reference"],
            "display_word_index": variant["display_word_index"],
            "qere_surface": qere_case["qere_surface"],
            "ketiv_evidence": qere_case["ketiv_evidence"],
            "meaning_evidence": variant["meaning_evidence"],
            "spelling_evidence": variant["spelling_evidence"],
            "source_line_sha256": variant["source_line_sha256"],
        }
        if actual != expected:
            raise RuntimeError(
                f"Caso {source_ref} cambió: "
                + json.dumps({"expected": expected, "actual": actual}, ensure_ascii=False)
            )
        verified.append({"source_reference": source_ref, **actual})

    return {
        "schema_version": "vida-stepbible-nahum-exact-qere-v1",
        "package_bytes": len(raw),
        "package_sha256": actual_sha,
        "verified_cases": verified,
    }


def self_test() -> None:
    if len(EXPECTED_CASES) != 4:
        raise RuntimeError("La política no fija cuatro casos")
    if len({item["source_line_sha256"] for item in EXPECTED_CASES.values()}) != 4:
        raise RuntimeError("Los casos no tienen cuatro hashes únicos")
    print("Auto-test de Qere exacto de Nahúm: OK")


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
    result = verify(args.package)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
