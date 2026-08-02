#!/usr/bin/env python3
"""Genera paquetes TAHOT reproducibles por libro sin modificar Supabase."""
from __future__ import annotations

import argparse
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

import inspect_ot_sources as sources
from tahot_schema import (
    TAHOT_COLUMNS,
    TOTAL_COLUMN_COUNT,
    is_qere_omission_placeholder,
    language_from_grammar,
    parse_reference_field,
)

PACKAGE_SCHEMA_VERSION = "vida-tahot-book-package-v1"
BOOK_NAMES = {
    "Oba": {
        "es": "Abdías",
        "en": "Obadiah",
        "expected_chapters": 1,
        "expected_references": 21,
    },
}


def canonical_json(value: Any) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")


def sha256_value(value: Any) -> str:
    return hashlib.sha256(canonical_json(value)).hexdigest()


def source_index_key(value: str) -> tuple[int, int, str]:
    if len(value) <= 2:
        return (int(value), 0, value)
    return (int(value[:2]), int(value[2:]), value)


def display_form(value: str) -> str:
    return value.replace("/", "").replace("\\", "").strip()


def split_core_and_punctuation(value: str) -> tuple[str, list[str]]:
    if not value:
        return "", []
    parts = value.split("\\")
    return parts[0], [part for part in parts[1:] if part]


def morpheme_count(value: str) -> int:
    core, _ = split_core_and_punctuation(value)
    if not core:
        return 0
    return len(core.split("/"))


def selected_source(book: str) -> dict[str, object]:
    matches = [source for source in sources.SOURCES if book in source["books"]]
    if len(matches) != 1:
        raise RuntimeError(f"No existe una fuente única para {book}: {len(matches)}")
    return matches[0]


def normalize_fields(fields: list[str], line_number: int) -> list[str]:
    if len(fields) != TOTAL_COLUMN_COUNT:
        raise RuntimeError(
            f"Línea {line_number}: ancho {len(fields)}; se esperaban "
            f"{TOTAL_COLUMN_COUNT} columnas"
        )
    if any(fields[len(TAHOT_COLUMNS):]):
        raise RuntimeError(f"Línea {line_number}: una columna reservada contiene datos")
    return fields


def build_record(
    fields: list[str], line_number: int, source_key: str
) -> dict[str, Any]:
    reference = parse_reference_field(fields[0])
    language = language_from_grammar(fields[5])
    qere_omission = is_qere_omission_placeholder(fields)
    if language == "unknown":
        raise RuntimeError(
            f"Línea {line_number}: código lingüístico desconocido {fields[5]!r}"
        )
    if language == "none" and not qere_omission:
        raise RuntimeError(
            f"Línea {line_number}: fila sin idioma que no es una omisión Qere reconocida"
        )

    named = dict(zip(TAHOT_COLUMNS, fields[: len(TAHOT_COLUMNS)], strict=True))
    component_counts = {
        "hebrew": morpheme_count(named["hebrew"]),
        "transliteration": morpheme_count(named["transliteration"]),
        "translation": morpheme_count(named["translation"]),
        "dstrongs": morpheme_count(named["dstrongs"]),
        "grammar": morpheme_count(named["grammar"]),
    }
    nonzero_counts = [value for value in component_counts.values() if value > 0]
    component_alignment = len(set(nonzero_counts)) <= 1
    _, punctuation = split_core_and_punctuation(named["hebrew"])

    record: dict[str, Any] = {
        "source_key": source_key,
        "source_line": line_number,
        "source_reference": fields[0],
        "book_code": reference.book,
        "english_reference": reference.english_reference,
        "hebrew_reference": reference.hebrew_reference,
        "english_chapter": reference.english_chapter,
        "english_verse": reference.english_verse,
        "english_suffix": reference.english_suffix,
        "source_index": reference.source_index,
        "text_suffix": reference.text_suffix,
        "textual_status": reference.textual_status,
        "language": language,
        "qere_omission": qere_omission,
        "hebrew": named["hebrew"],
        "hebrew_display": display_form(named["hebrew"]),
        "hebrew_punctuation": punctuation,
        "transliteration": named["transliteration"],
        "transliteration_display": display_form(named["transliteration"]),
        "translation_gloss_en": named["translation"],
        "dstrongs": named["dstrongs"],
        "grammar": named["grammar"],
        "meaning_variants": named["meaning_variants"],
        "spelling_variants": named["spelling_variants"],
        "root_dstrong_instance": named["root_dstrong_instance"],
        "alternative_strongs_instance": named["alternative_strongs_instance"],
        "conjoin_word": named["conjoin_word"],
        "expanded_strong_tags": named["expanded_strong_tags"],
        "component_counts": component_counts,
        "component_alignment": component_alignment,
    }
    record["row_sha256"] = sha256_value(record)
    return record


def build_verse(reference: str, rows: list[dict[str, Any]]) -> dict[str, Any]:
    indices = [source_index_key(row["source_index"]) for row in rows]
    if indices != sorted(indices):
        raise RuntimeError(f"Orden fuente no monotónico en {reference}")
    source_references = [row["source_reference"] for row in rows]
    if len(source_references) != len(set(source_references)):
        raise RuntimeError(f"Referencias fuente duplicadas en {reference}")

    visible_rows = [row for row in rows if not row["qere_omission"]]
    hebrew_references = sorted(
        {row["hebrew_reference"] for row in rows if row["hebrew_reference"]}
    )
    verse = {
        "reference": reference,
        "chapter": rows[0]["english_chapter"],
        "verse": rows[0]["english_verse"],
        "suffix": rows[0]["english_suffix"],
        "hebrew_references": hebrew_references,
        "row_count": len(rows),
        "visible_row_count": len(visible_rows),
        "source_indices": [row["source_index"] for row in rows],
        "textual_status_counts": dict(
            Counter(row["textual_status"] for row in rows)
        ),
        "language_counts": dict(Counter(row["language"] for row in rows)),
        "qere_omission_count": sum(1 for row in rows if row["qere_omission"]),
        "rows_with_meaning_variants": sum(
            bool(row["meaning_variants"]) for row in rows
        ),
        "rows_with_spelling_variants": sum(
            bool(row["spelling_variants"]) for row in rows
        ),
        "hebrew_source_sequence": " ".join(
            row["hebrew"] for row in visible_rows if row["hebrew"]
        ),
        "hebrew_display_sequence": " ".join(
            row["hebrew_display"] for row in visible_rows if row["hebrew_display"]
        ),
        "transliteration_source_sequence": " ".join(
            row["transliteration"]
            for row in visible_rows
            if row["transliteration"]
        ),
        "transliteration_display_sequence": " ".join(
            row["transliteration_display"]
            for row in visible_rows
            if row["transliteration_display"]
        ),
        "source_gloss_sequence_en": " ".join(
            row["translation_gloss_en"]
            for row in visible_rows
            if row["translation_gloss_en"]
        ),
        "row_hashes": [row["row_sha256"] for row in rows],
    }
    verse["verse_sha256"] = sha256_value(verse)
    return verse


def write_audit(path: Path, manifest: dict[str, Any]) -> None:
    counts = manifest["counts"]
    lines = [
        f"# Auditoría del paquete TAHOT — {manifest['book']['name_es']}",
        "",
        f"- Libro: `{manifest['book']['code']}`",
        f"- Capítulos: {counts['chapters']}",
        f"- Referencias: {counts['references']}",
        f"- Filas: {counts['rows']}",
        f"- Filas hebreas: {counts['languages'].get('hebrew', 0)}",
        f"- Filas arameas: {counts['languages'].get('aramaic', 0)}",
        f"- Omisiones Qere: {counts['qere_omissions']}",
        "- Filas con variantes de significado: "
        f"{counts['rows_with_meaning_variants']}",
        "- Filas con variantes ortográficas: "
        f"{counts['rows_with_spelling_variants']}",
        "- Filas con desalineación de componentes: "
        f"{counts['component_alignment_mismatches']}",
        f"- SHA-256 de registros: `{manifest['integrity']['records_sha256']}`",
        f"- SHA-256 de versículos: `{manifest['integrity']['verses_sha256']}`",
        f"- SHA-256 del paquete: `{manifest['integrity']['package_sha256']}`",
        "",
        "La columna `translation_gloss_en` conserva la glosa inglesa de "
        "STEPBible. No se presenta como traducción bíblica ni como traducción "
        "española.",
        "",
        "Este artefacto es de validación. No modifica Supabase, la interfaz ni "
        "producción.",
    ]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def build_package(book: str, output: Path) -> dict[str, Any]:
    metadata = BOOK_NAMES.get(book)
    if not metadata:
        raise RuntimeError(f"El libro {book} todavía no está aprobado para este generador")
    source = selected_source(book)
    url, raw, digest = sources.download(source)
    text = raw.decode("utf-8-sig")

    rows: list[dict[str, Any]] = []
    for line_number, line in enumerate(text.splitlines(), 1):
        if not line or line.startswith("#") or "\t" not in line:
            continue
        fields = line.split("\t")
        if not fields[0].startswith(f"{book}."):
            continue
        fields = normalize_fields(fields, line_number)
        record = build_record(fields, line_number, str(source["key"]))
        if record["book_code"] != book:
            raise RuntimeError(
                f"Línea {line_number}: libro inesperado {record['book_code']}"
            )
        rows.append(record)

    if not rows:
        raise RuntimeError(f"No se encontraron filas para {book}")

    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        grouped[row["english_reference"]].append(row)
    verses = [build_verse(reference, grouped[reference]) for reference in grouped]

    chapters = sorted({verse["chapter"] for verse in verses})
    if len(chapters) != metadata["expected_chapters"]:
        raise RuntimeError(f"Capítulos inesperados en {book}: {chapters}")
    if len(verses) != metadata["expected_references"]:
        raise RuntimeError(
            f"Referencias inesperadas en {book}: {len(verses)} != "
            f"{metadata['expected_references']}"
        )

    language_counts = Counter(row["language"] for row in rows)
    status_counts = Counter(row["textual_status"] for row in rows)
    records_bytes = b"\n".join(canonical_json(row) for row in rows) + b"\n"
    verses_bytes = canonical_json(verses)

    manifest: dict[str, Any] = {
        "schema_version": PACKAGE_SCHEMA_VERSION,
        "book": {
            "code": book,
            "name_es": metadata["es"],
            "name_en": metadata["en"],
        },
        "source": {
            "repository": "STEPBible/STEPBible-Data",
            "commit": sources.COMMIT,
            "file": source["file"],
            "source_key": source["key"],
            "url": url,
            "sha256": digest,
            "license": "CC BY 4.0",
            "attribution": "STEP Bible",
        },
        "counts": {
            "chapters": len(chapters),
            "references": len(verses),
            "rows": len(rows),
            "languages": dict(language_counts),
            "textual_statuses": dict(status_counts),
            "qere_omissions": sum(1 for row in rows if row["qere_omission"]),
            "rows_with_meaning_variants": sum(
                bool(row["meaning_variants"]) for row in rows
            ),
            "rows_with_spelling_variants": sum(
                bool(row["spelling_variants"]) for row in rows
            ),
            "component_alignment_mismatches": sum(
                not row["component_alignment"] for row in rows
            ),
        },
        "first_reference": verses[0]["reference"],
        "last_reference": verses[-1]["reference"],
        "integrity": {
            "record_hashes_valid": all(
                len(row["row_sha256"]) == 64 for row in rows
            ),
            "verse_hashes_valid": all(
                len(verse["verse_sha256"]) == 64 for verse in verses
            ),
            "records_sha256": hashlib.sha256(records_bytes).hexdigest(),
            "verses_sha256": hashlib.sha256(verses_bytes).hexdigest(),
        },
        "notes": {
            "translation_gloss_en": (
                "Source gloss from STEPBible; not a Bible translation."
            ),
            "database_imported": False,
        },
    }
    package_basis = {
        "manifest_without_package_hash": manifest,
        "record_hashes": [row["row_sha256"] for row in rows],
        "verse_hashes": [verse["verse_sha256"] for verse in verses],
    }
    manifest["integrity"]["package_sha256"] = sha256_value(package_basis)

    output.mkdir(parents=True, exist_ok=True)
    (output / "records.jsonl").write_bytes(records_bytes)
    (output / "verses.json").write_text(
        json.dumps(verses, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (output / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    write_audit(output / "audit.md", manifest)
    return manifest


def self_test() -> None:
    if source_index_key("05") >= source_index_key("0501"):
        raise RuntimeError("El subíndice 0501 debe seguir a 05")
    if source_index_key("0501") >= source_index_key("06"):
        raise RuntimeError("El subíndice 0501 debe preceder a 06")
    if display_form("וַ/יֹּאמֶר\\׃") != "וַיֹּאמֶר׃":
        raise RuntimeError("La forma visible no conserva correctamente la puntuación")
    if morpheme_count("H9001/H1961") != 2:
        raise RuntimeError("El conteo de morfemas no es estable")
    print("Auto-test del generador TAHOT por libro: OK")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--book", default="Oba")
    parser.add_argument(
        "--output", type=Path, default=Path("artifacts/tahot-book")
    )
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return 0
    manifest = build_package(args.book, args.output)
    print(json.dumps(manifest["counts"], ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
