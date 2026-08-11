#!/usr/bin/env python3
"""Genera el paquete TAHOT reproducible de Daniel sin modificar Supabase."""
from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

import inspect_ot_sources as sources
from extract_ot_book import (
    parse_row,
    verse_payload,
    write_audit,
    write_gzip_json,
)

STEP_CODE = "Dan"
INTERNAL_CODE = "DAN"
NAME_ES = "Daniel"
VERSE_COUNTS = [21, 49, 30, 37, 31, 28, 28, 27, 27, 21, 45, 13]


def expected_references() -> list[str]:
    return [
        f"{STEP_CODE}.{chapter}.{verse}"
        for chapter, count in enumerate(VERSE_COUNTS, 1)
        for verse in range(1, count + 1)
    ]


def extract(output: Path) -> dict[str, Any]:
    source = next(source for source in sources.SOURCES if STEP_CODE in source["books"])
    source_url, raw, digest = sources.download(source)

    rows = [
        parsed
        for line_number, line in enumerate(raw.decode("utf-8-sig").splitlines(), 1)
        if (
            parsed := parse_row(
                line,
                line_number,
                STEP_CODE,
                str(source["key"]),
                source_url,
            )
        ) is not None
    ]
    if not rows:
        raise RuntimeError("No se encontraron filas para Daniel")

    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        grouped[row["reference"]["english"]].append(row)

    expected = expected_references()
    if set(grouped) != set(expected):
        missing = sorted(set(expected) - set(grouped))
        unexpected = sorted(set(grouped) - set(expected))
        raise RuntimeError(f"Referencias incompletas. Faltan={missing}; extras={unexpected}")

    verses = [verse_payload(reference, grouped[reference]) for reference in expected]
    statuses = Counter(row["textual_status"] for row in rows)
    languages = Counter(row["language"] for row in rows)
    mixed_references = [
        reference
        for reference, reference_rows in grouped.items()
        if len({row["language"] for row in reference_rows if row["language"] != "none"}) > 1
    ]

    counts = {
        "chapters": len(VERSE_COUNTS),
        "references": len(verses),
        "source_rows": len(rows),
        "visible_words": sum(verse["visible_word_count"] for verse in verses),
        "morpheme_components": sum(len(row["alignment"]["components"]) for row in rows),
        "variant_rows": sum(
            bool(row["variants"]["meaning"] or row["variants"]["spelling"])
            for row in rows
        ),
        "qere_rows": statuses["qere"],
        "qere_omission_placeholders": sum(row["is_qere_omission_placeholder"] for row in rows),
        "restored_rows": statuses["restored"],
        "lxx_addition_rows": statuses["lxx_addition"],
        "hebrew_rows": languages["hebrew"],
        "aramaic_rows": languages["aramaic"],
        "unknown_language_rows": languages["unknown"],
        "alignment_mismatches": sum(not row["alignment"]["aligned"] for row in rows),
        "invalid_line_hashes": sum(
            len(row["source_line_sha256"]) != 64
            or any(character not in "0123456789abcdef" for character in row["source_line_sha256"])
            for row in rows
        ),
        "mixed_references": len(mixed_references),
    }

    if counts["unknown_language_rows"] or counts["invalid_line_hashes"] or counts["alignment_mismatches"]:
        raise RuntimeError(f"Integridad inválida: {counts}")
    if mixed_references != ["Dan.2.4"]:
        raise RuntimeError(f"Límites lingüísticos inesperados: {mixed_references}")
    if counts["hebrew_rows"] != 2320 or counts["aramaic_rows"] != 3600:
        raise RuntimeError(f"Conteos lingüísticos inesperados: {counts}")
    if counts["references"] != 357 or counts["source_rows"] != 5920:
        raise RuntimeError(f"Conteos fuente inesperados: {counts}")

    package = {
        "schema_version": "stepbible-tahot-book-v1",
        "book": {
            "step_code": STEP_CODE,
            "internal_code": INTERNAL_CODE,
            "name_es": NAME_ES,
        },
        "source": {
            "repository": "STEPBible/STEPBible-Data",
            "commit": sources.COMMIT,
            "key": source["key"],
            "filename": source["file"],
            "url": source_url,
            "sha256": digest,
            "license": "CC BY 4.0",
            "attribution": "STEP Bible",
        },
        "counts": counts,
        "verses": verses,
    }

    artifact_path = output / "dan.json.gz"
    artifact_size, artifact_hash = write_gzip_json(artifact_path, package)
    artifact = {
        "path": artifact_path.name,
        "bytes": artifact_size,
        "sha256": artifact_hash,
    }
    manifest = {
        "schema_version": "stepbible-tahot-book-manifest-v1",
        "book": package["book"],
        "source": package["source"],
        "counts": counts,
        "artifact": artifact,
        "mixed_references": mixed_references,
    }
    output.mkdir(parents=True, exist_ok=True)
    (output / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    write_audit(output / "audit.md", package, artifact)
    return manifest


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("artifacts/stepbible-daniel"))
    args = parser.parse_args()
    result = extract(args.output)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
