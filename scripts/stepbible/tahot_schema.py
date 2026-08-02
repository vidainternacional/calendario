#!/usr/bin/env python3
"""Contrato estructural verificado para las fuentes TAHOT de STEPBible."""
from __future__ import annotations

import argparse
import re
from dataclasses import dataclass
from typing import Literal

TAHOT_COLUMNS = (
    "reference_and_type",
    "hebrew",
    "transliteration",
    "translation",
    "dstrongs",
    "grammar",
    "meaning_variants",
    "spelling_variants",
    "root_dstrong_instance",
    "alternative_strongs_instance",
    "conjoin_word",
    "expanded_strong_tags",
)
RESERVED_COLUMN_COUNT = 5
TOTAL_COLUMN_COUNT = len(TAHOT_COLUMNS) + RESERVED_COLUMN_COUNT

TEXT_TYPE_LABELS = {
    "L": "Leningrad",
    "Q": "Qere",
    "K": "Ketiv",
    "R": "Restored",
    "X": "LXX reconstruction",
}
VARIANT_SOURCE_LABELS = {
    "A": "Aleppo manuscript",
    "B": "Biblia Hebraica Stuttgartensia",
    "C": "Cairensis manuscript",
    "D": "Dead Sea or Judean Desert manuscript",
    "E": "scholarly emendation from ancient sources",
    "F": "alternate formatting or word division",
    "H": "Ben Chaim edition",
    "P": "alternate punctuation",
    "S": "scribal tradition",
    "V": "other Hebrew manuscript variant",
}

REFERENCE_RE = re.compile(
    r"^(?P<book>[123]?[A-Za-z]{2,3})\."
    r"(?P<english_chapter>\d+)\."
    r"(?P<english_verse>\d+)(?P<english_suffix>[a-z]?)"
    r"(?:\((?P<hebrew_chapter>\d+)\.(?P<hebrew_verse>\d+)(?P<hebrew_suffix>[a-z]?)\))?"
    r"#(?P<source_index>\d+)"
    r"(?P<text_suffix>=.+)$"
)

TextualStatus = Literal[
    "leningrad",
    "qere",
    "restored",
    "lxx_addition",
    "other",
]
Language = Literal["hebrew", "aramaic", "none", "unknown"]


@dataclass(frozen=True)
class TahotReference:
    book: str
    english_chapter: int
    english_verse: int
    english_suffix: str
    hebrew_chapter: int | None
    hebrew_verse: int | None
    hebrew_suffix: str
    source_index: str
    text_suffix: str
    textual_status: TextualStatus

    @property
    def english_reference(self) -> str:
        return f"{self.book}.{self.english_chapter}.{self.english_verse}{self.english_suffix}"

    @property
    def hebrew_reference(self) -> str | None:
        if self.hebrew_chapter is None or self.hebrew_verse is None:
            return None
        return f"{self.book}.{self.hebrew_chapter}.{self.hebrew_verse}{self.hebrew_suffix}"


def classify_text_suffix(text_suffix: str) -> TextualStatus:
    if text_suffix == "=R":
        return "restored"
    if text_suffix == "=X":
        return "lxx_addition"
    if text_suffix.startswith("=Q"):
        return "qere"
    if text_suffix.startswith("=L"):
        return "leningrad"
    return "other"


def parse_reference_field(value: str) -> TahotReference:
    match = REFERENCE_RE.fullmatch(value)
    if not match:
        raise ValueError(f"Referencia TAHOT inválida: {value}")
    text_suffix = match.group("text_suffix")
    return TahotReference(
        book=match.group("book"),
        english_chapter=int(match.group("english_chapter")),
        english_verse=int(match.group("english_verse")),
        english_suffix=match.group("english_suffix") or "",
        hebrew_chapter=(
            int(match.group("hebrew_chapter"))
            if match.group("hebrew_chapter") is not None
            else None
        ),
        hebrew_verse=(
            int(match.group("hebrew_verse"))
            if match.group("hebrew_verse") is not None
            else None
        ),
        hebrew_suffix=match.group("hebrew_suffix") or "",
        source_index=match.group("source_index"),
        text_suffix=text_suffix,
        textual_status=classify_text_suffix(text_suffix),
    )


def language_from_grammar(grammar: str) -> Language:
    value = grammar.strip()
    if not value:
        return "none"
    if value.startswith("H"):
        return "hebrew"
    if value.startswith("A"):
        return "aramaic"
    return "unknown"


def is_qere_omission_placeholder(fields: list[str]) -> bool:
    if len(fields) != TOTAL_COLUMN_COUNT:
        return False
    try:
        reference = parse_reference_field(fields[0])
    except ValueError:
        return False
    return (
        reference.textual_status == "qere"
        and fields[1] == ""
        and fields[2] == "[ ]"
        and fields[3] == "[ ]"
        and fields[4] == ""
        and fields[5] == ""
        and fields[6].startswith("K=")
    )


def self_test() -> None:
    direct = parse_reference_field("Gen.1.1#01=L")
    if direct.english_reference != "Gen.1.1" or direct.textual_status != "leningrad":
        raise RuntimeError(f"Referencia directa inesperada: {direct}")

    mapped = parse_reference_field("Isa.9.3(9.2)#03=Q(K)")
    if mapped.hebrew_reference != "Isa.9.2" or mapped.textual_status != "qere":
        raise RuntimeError(f"Referencia doble inesperada: {mapped}")

    supplemental = parse_reference_field("Gen.4.8#0501=X")
    if supplemental.source_index != "0501" or supplemental.textual_status != "lxx_addition":
        raise RuntimeError(f"Referencia suplementaria inesperada: {supplemental}")

    if language_from_grammar("HVqp3ms") != "hebrew":
        raise RuntimeError("No se reconoció la morfología hebrea")
    if language_from_grammar("AVqv2ms") != "aramaic":
        raise RuntimeError("No se reconoció la morfología aramea")

    placeholder = [
        "Jdg.16.25#02=Q(K)",
        "",
        "[ ]",
        "[ ]",
        "",
        "",
        'K= ki (כִּי) "for" (H3588A=HR)',
        "L= כְּי ¦ ;",
        "",
        "H3588A",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
    ]
    if not is_qere_omission_placeholder(placeholder):
        raise RuntimeError("No se reconoció la omisión Qere")

    print("Auto-test del contrato TAHOT: OK")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return 0
    parser.print_help()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
