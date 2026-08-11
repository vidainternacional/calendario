#!/usr/bin/env python3
"""Audita los límites hebreo/arameo de Daniel en TAHOT. Solo lectura."""
from __future__ import annotations

import json
from collections import Counter, defaultdict
from pathlib import Path

import inspect_ot_sources as sources
from extract_ot_book import parse_row

BOOK = "Dan"


def inspect() -> dict[str, object]:
    source = next(source for source in sources.SOURCES if BOOK in source["books"])
    source_url, raw, digest = sources.download(source)
    by_reference: dict[str, list[dict[str, object]]] = defaultdict(list)

    for line_number, line in enumerate(raw.decode("utf-8-sig").splitlines(), 1):
        parsed = parse_row(line, line_number, BOOK, str(source["key"]), source_url)
        if parsed is not None:
            by_reference[str(parsed["reference"]["english"])].append(parsed)

    languages = Counter()
    mixed: list[dict[str, object]] = []
    transitions: list[dict[str, object]] = []
    previous_language: str | None = None

    for reference in sorted(
        by_reference,
        key=lambda value: tuple(int(part) for part in value.split(".")[1:3]),
    ):
        rows = by_reference[reference]
        verse_languages = [str(row["language"]) for row in rows if row["language"] != "none"]
        unique = list(dict.fromkeys(verse_languages))
        languages.update(verse_languages)
        if len(unique) > 1:
            mixed.append({
                "reference": reference,
                "languages": unique,
                "rows": len(rows),
                "sequence": verse_languages,
            })
        current = unique[0] if len(unique) == 1 else "mixed"
        if previous_language is not None and current != previous_language:
            transitions.append({
                "reference": reference,
                "from": previous_language,
                "to": current,
            })
        previous_language = current

    result = {
        "schema_version": "vida-daniel-language-boundaries-v1",
        "source_commit": sources.COMMIT,
        "source_sha256": digest,
        "references": len(by_reference),
        "row_languages": dict(sorted(languages.items())),
        "mixed_reference_count": len(mixed),
        "mixed_references": mixed,
        "transitions": transitions,
    }
    return result


def main() -> int:
    result = inspect()
    output = Path("artifacts/daniel-language-boundaries")
    output.mkdir(parents=True, exist_ok=True)
    (output / "report.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
