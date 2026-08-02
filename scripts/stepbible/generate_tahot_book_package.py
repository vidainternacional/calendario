#!/usr/bin/env python3
"""Genera un paquete reproducible por libro desde TAHOT, sin importar datos."""
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


def canonical_json(value: Any) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")


def source_for_book(book: str) -> dict[str, object]:
    matches = [source for source in sources.SOURCES if book in source["books"]]
    if len(matches) != 1:
        raise RuntimeError(f"Se esperaba una fuente para {book}, encontradas: {len(matches)}")
    return matches[0]


def row_payload(fields: list[str], line_number: int) -> dict[str, Any]:
    if len(fields) != TOTAL_COLUMN_COUNT:
        raise RuntimeError(
            f"L{line_number}: ancho inesperado {len(fields)} != {TOTAL_COLUMN_COUNT}"
        )
    reference = parse_reference_field(fields[0])
    active = dict(zip(TAHOT_COLUMNS, fields[: len(TAHOT_COLUMNS)]))
    reserved = fields[len(TAHOT_COLUMNS) :]
    if any(reserved):
        raise RuntimeError(f"L{line_number}: columnas reservadas con contenido")

    return {
        "line": line_number,
        "source_reference": fields[0],
        "book": reference.book,
        "english_reference": reference.english_reference,
        "hebrew_reference": reference.hebrew_reference,
        "english_chapter": reference.english_chapter,
        "english_verse": reference.english_verse,
        "english_suffix": reference.english_suffix,
        "source_index": reference.source_index,
        "text_suffix": reference.text_suffix,
        "textual_status": reference.textual_status,
        "language": language_from_grammar(active["grammar"]),
        "qere_omission": is_qere_omission_placeholder(fields),
        "hebrew": active["hebrew"],
        "transliteration": active["transliteration"],
        "translation": active["translation"],
        "dstrongs": active["dstrongs"],
        "grammar": active["grammar"],
        "meaning_variants": active["meaning_variants"],
        "spelling_variants": active["spelling_variants"],
        "root_dstrong_instance": active["root_dstrong_instance"],
        "alternative_strongs_instance": active["alternative_strongs_instance"],
        "conjoin_word": active["conjoin_word"],
        "expanded_strong_tags": active["expanded_strong_tags"],
    }


def index_key(value: str) -> tuple[int, str]:
    try:
        return int(value), value
    except ValueError:
        return 10**9, value


def select_reading(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Selecciona tokens de lectura sin borrar las filas alternativas del paquete."""
    by_index: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        by_index[row["source_index"]].append(row)

    selected: list[dict[str, Any]] = []
    priorities = {"qere": 0, "leningrad": 1, "restored": 2, "other": 3}
    for source_index in sorted(by_index, key=index_key):
        candidates = [row for row in by_index[source_index] if row["textual_status"] != "lxx_addition"]
        if not candidates:
            continue
        candidates.sort(key=lambda row: (priorities.get(row["textual_status"], 9), row["source_reference"]))
        chosen = candidates[0]
        if chosen["qere_omission"] or not chosen["hebrew"]:
            continue
        selected.append(
            {
                "source_index": chosen["source_index"],
                "source_reference": chosen["source_reference"],
                "textual_status": chosen["textual_status"],
                "language": chosen["language"],
                "hebrew": chosen["hebrew"],
                "transliteration": chosen["transliteration"],
                "translation": chosen["translation"],
                "dstrongs": chosen["dstrongs"],
                "grammar": chosen["grammar"],
                "conjoin_word": chosen["conjoin_word"],
            }
        )
    return selected


def build_package(book: str) -> dict[str, Any]:
    source = source_for_book(book)
    url, raw, digest = sources.download(source)
    rows: list[dict[str, Any]] = []

    for line_number, line in enumerate(raw.decode("utf-8-sig").splitlines(), 1):
        if not line or line.startswith("#") or "\t" not in line:
            continue
        fields = line.split("\t")
        first = fields[0]
        if first == "Eng (Heb) Ref & Type" or not first.startswith(f"{book}."):
            continue
        rows.append(row_payload(fields, line_number))

    if not rows:
        raise RuntimeError(f"No se encontraron filas para {book}")
    if any(row["book"] != book for row in rows):
        raise RuntimeError("El paquete contiene otro libro")

    verse_rows: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        verse_rows[row["english_reference"]].append(row)

    verses = []
    for reference in sorted(
        verse_rows,
        key=lambda ref: (
            verse_rows[ref][0]["english_chapter"],
            verse_rows[ref][0]["english_verse"],
            verse_rows[ref][0]["english_suffix"],
        ),
    ):
        items = sorted(
            verse_rows[reference],
            key=lambda row: (index_key(row["source_index"]), row["source_reference"]),
        )
        reading = select_reading(items)
        verses.append(
            {
                "english_reference": reference,
                "hebrew_references": sorted(
                    {row["hebrew_reference"] for row in items if row["hebrew_reference"]}
                ),
                "rows": items,
                "reading_tokens": reading,
                "reading_token_count": len(reading),
            }
        )

    statuses = Counter(row["textual_status"] for row in rows)
    languages = Counter(row["language"] for row in rows)
    chapters = sorted({row["english_chapter"] for row in rows})
    package: dict[str, Any] = {
        "schema_version": "vida-stepbible-tahot-book-package-v1",
        "book": book,
        "source": {
            "repository": "STEPBible/STEPBible-Data",
            "commit": sources.COMMIT,
            "source_key": source["key"],
            "filename": source["file"],
            "url": url,
            "sha256": digest,
            "license": "CC BY 4.0",
            "attribution": "STEP Bible",
        },
        "summary": {
            "chapters": len(chapters),
            "chapter_numbers": chapters,
            "references": len(verses),
            "rows": len(rows),
            "reading_tokens": sum(verse["reading_token_count"] for verse in verses),
            "statuses": dict(sorted(statuses.items())),
            "languages": dict(sorted(languages.items())),
            "qere_omissions": sum(1 for row in rows if row["qere_omission"]),
            "rows_without_hebrew": sum(1 for row in rows if not row["hebrew"]),
        },
        "verses": verses,
    }
    package["package_sha256"] = hashlib.sha256(canonical_json(package)).hexdigest()
    return package


def validate_ruth(package: dict[str, Any]) -> None:
    summary = package["summary"]
    if package["book"] != "Rut":
        raise RuntimeError("El paquete piloto no es Rut")
    if summary["chapters"] != 4 or summary["chapter_numbers"] != [1, 2, 3, 4]:
        raise RuntimeError(f"Capítulos inesperados: {summary['chapter_numbers']}")
    if summary["references"] != 85:
        raise RuntimeError(f"Referencias inesperadas de Rut: {summary['references']} != 85")
    if summary["languages"].get("aramaic", 0):
        raise RuntimeError("Rut contiene filas arameas inesperadas")
    if summary["languages"].get("unknown", 0):
        raise RuntimeError("Rut contiene códigos de idioma desconocidos")
    if len(package["package_sha256"]) != 64:
        raise RuntimeError("Hash de paquete inválido")
    for verse in package["verses"]:
        if not verse["rows"]:
            raise RuntimeError(f"Versículo vacío: {verse['english_reference']}")
        if not verse["reading_tokens"]:
            raise RuntimeError(f"Lectura visible vacía: {verse['english_reference']}")


def write_summary(path: Path, package: dict[str, Any]) -> None:
    summary = package["summary"]
    lines = [
        "# Paquete TAHOT — Rut",
        "",
        f"- Capítulos: {summary['chapters']}",
        f"- Referencias: {summary['references']}",
        f"- Filas fuente: {summary['rows']}",
        f"- Tokens de lectura: {summary['reading_tokens']}",
        f"- Idiomas: `{json.dumps(summary['languages'], ensure_ascii=False, sort_keys=True)}`",
        f"- Estados: `{json.dumps(summary['statuses'], ensure_ascii=False, sort_keys=True)}`",
        f"- Omisiones Qere: {summary['qere_omissions']}",
        f"- Filas sin forma hebrea: {summary['rows_without_hebrew']}",
        f"- SHA-256 del paquete: `{package['package_sha256']}`",
        "",
        "El paquete conserva todas las filas y selecciona una lectura reproducible por posición sin eliminar Qere/Ketiv, restauraciones ni adiciones LXX del artefacto.",
        "Esta ejecución no importa datos ni modifica Supabase o producción.",
    ]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def self_test() -> None:
    if index_key("0101")[0] != 101:
        raise RuntimeError("Índice fuente no ordenable")
    rows = [
        {"source_index": "01", "textual_status": "leningrad", "source_reference": "Rut.1.1#01=L", "qere_omission": False, "hebrew": "א", "transliteration": "a", "translation": "a", "dstrongs": "H1", "grammar": "HN", "language": "hebrew", "conjoin_word": ""},
        {"source_index": "01", "textual_status": "qere", "source_reference": "Rut.1.1#01=Q(K)", "qere_omission": False, "hebrew": "ב", "transliteration": "b", "translation": "b", "dstrongs": "H2", "grammar": "HN", "language": "hebrew", "conjoin_word": ""},
    ]
    selected = select_reading(rows)
    if len(selected) != 1 or selected[0]["hebrew"] != "ב":
        raise RuntimeError("La prioridad Qere no es estable")
    print("Auto-test del generador TAHOT: OK")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--book", default="Rut")
    parser.add_argument("--output", type=Path, default=Path("artifacts/tahot-book"))
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return 0

    package = build_package(args.book)
    if args.book == "Rut":
        validate_ruth(package)
    args.output.mkdir(parents=True, exist_ok=True)
    package_path = args.output / f"{args.book.lower()}-package.json"
    package_path.write_text(
        json.dumps(package, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    write_summary(args.output / f"{args.book.lower()}-validation.md", package)
    print(json.dumps(package["summary"], ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
