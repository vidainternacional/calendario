#!/usr/bin/env python3
"""Genera paquetes reproducibles por libro desde TAHOT. No modifica Supabase."""
from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import unicodedata
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

BOOKS = {
    "Oba": {
        "internal_code": "OBA",
        "name_es": "Obadías",
        "verse_counts": [21],
    },
    "Rut": {
        "internal_code": "RUT",
        "name_es": "Rut",
        "verse_counts": [22, 23, 18, 22],
    },
    "Hag": {
        "internal_code": "HAG",
        "name_es": "Hageo",
        "verse_counts": [15, 23],
    },
}


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_text(value: str) -> str:
    return sha256_bytes(value.encode("utf-8"))


def nfc(value: str) -> str:
    return unicodedata.normalize("NFC", value)


def source_for_book(book: str) -> dict[str, object]:
    matches = [source for source in sources.SOURCES if book in source["books"]]
    if len(matches) != 1:
        raise RuntimeError(f"Se esperaba una fuente única para {book}: {len(matches)}")
    return matches[0]


def split_punctuation(value: str) -> tuple[str, str]:
    if "\\" not in value:
        return value, ""
    lexical, punctuation = value.split("\\", 1)
    return lexical, punctuation


def split_components(value: str) -> list[str]:
    if not value:
        return []
    return [nfc(part.strip()) for part in value.split("/")]


def display_surface(value: str) -> tuple[str, str]:
    lexical, punctuation = split_punctuation(value)
    return nfc(lexical.replace("/", "")), nfc(punctuation.replace("/", ""))


def display_transliteration(value: str) -> str:
    lexical, punctuation = split_punctuation(value)
    return ("".join(part.strip() for part in lexical.split("/")) + punctuation).strip()


def source_gloss_sequence(value: str) -> str:
    lexical, _ = split_punctuation(value)
    return " ".join(part.strip() for part in lexical.split("/") if part.strip())


def source_index_parts(value: str) -> dict[str, int | str]:
    if not value.isdigit():
        raise ValueError(f"Índice fuente no numérico: {value}")
    if len(value) <= 2:
        return {"raw": value, "base": int(value), "subindex": 0}
    return {"raw": value, "base": int(value[:2]), "subindex": int(value[2:])}


def component_alignment(fields: dict[str, str]) -> dict[str, Any]:
    values = {
        "hebrew": split_components(split_punctuation(fields["hebrew"])[0]),
        "transliteration": split_components(split_punctuation(fields["transliteration"])[0]),
        "translation": split_components(split_punctuation(fields["translation"])[0]),
        "dstrongs": split_components(fields["dstrongs"]),
        "grammar": split_components(fields["grammar"]),
    }
    counts = {name: len(parts) for name, parts in values.items()}
    nonzero = [count for count in counts.values() if count]
    width = max(nonzero, default=0)
    return {
        "aligned": len(set(nonzero)) <= 1,
        "counts": counts,
        "components": [
            {
                "index": index + 1,
                **{
                    name: parts[index] if index < len(parts) else None
                    for name, parts in values.items()
                },
            }
            for index in range(width)
        ],
    }


def parse_row(
    line: str,
    line_number: int,
    book: str,
    source_key: str,
    source_url: str,
) -> dict[str, Any] | None:
    if not line or line.startswith("#") or "\t" not in line:
        return None
    raw = line.split("\t")
    if not raw[0].startswith(f"{book}."):
        return None
    if len(raw) != TOTAL_COLUMN_COUNT:
        raise RuntimeError(
            f"L{line_number}: {len(raw)} columnas; se esperaban {TOTAL_COLUMN_COUNT}"
        )
    if any(raw[len(TAHOT_COLUMNS) :]):
        raise RuntimeError(f"L{line_number}: columnas reservadas con contenido")

    reference = parse_reference_field(raw[0])
    fields = dict(zip(TAHOT_COLUMNS, raw[: len(TAHOT_COLUMNS)], strict=True))
    language = language_from_grammar(fields["grammar"])
    placeholder = is_qere_omission_placeholder(raw)
    if language == "unknown":
        raise RuntimeError(f"L{line_number}: idioma desconocido: {fields['grammar']}")
    if language == "none" and not placeholder:
        raise RuntimeError(f"L{line_number}: fila sin gramática que no es omisión Qere")

    surface, punctuation = display_surface(fields["hebrew"])
    return {
        "source_line": line_number,
        "source_key": source_key,
        "source_url": source_url,
        "source_line_sha256": sha256_text(line),
        "reference": {
            "english": reference.english_reference,
            "hebrew": reference.hebrew_reference,
            "book": reference.book,
            "chapter": reference.english_chapter,
            "verse": reference.english_verse,
            "verse_suffix": reference.english_suffix,
        },
        "source_index": source_index_parts(reference.source_index),
        "text_suffix": reference.text_suffix,
        "textual_status": reference.textual_status,
        "language": language,
        "is_qere_omission_placeholder": placeholder,
        "is_visible_base_word": not placeholder,
        "surface_form": surface,
        "punctuation_after": punctuation,
        "transliteration": display_transliteration(fields["transliteration"]),
        "source_gloss_en": source_gloss_sequence(fields["translation"]),
        "alignment": component_alignment(fields),
        "variants": {
            "meaning": fields["meaning_variants"] or None,
            "spelling": fields["spelling_variants"] or None,
            "alternative_strongs": fields["alternative_strongs_instance"] or None,
        },
        "lexical": {
            "dstrongs": fields["dstrongs"] or None,
            "root_instance": fields["root_dstrong_instance"] or None,
            "expanded_tags": fields["expanded_strong_tags"] or None,
        },
        "raw_fields": fields,
    }


def verse_payload(reference: str, rows: list[dict[str, Any]]) -> dict[str, Any]:
    visible = [row for row in rows if row["is_visible_base_word"]]
    next_display = 1
    for row in rows:
        if row["is_visible_base_word"]:
            row["display_word_index"] = next_display
            next_display += 1
        else:
            row["display_word_index"] = None

    canonical = {
        "reference": reference,
        "original_text": " ".join(
            f"{row['surface_form']}{row['punctuation_after']}".strip()
            for row in visible
            if row["surface_form"] or row["punctuation_after"]
        ),
        "transliteration": " ".join(
            row["transliteration"] for row in visible if row["transliteration"]
        ),
        "source_gloss_sequence_en": " ".join(
            row["source_gloss_en"] for row in visible if row["source_gloss_en"]
        ),
        "rows": rows,
    }
    return {
        **canonical,
        "visible_word_count": len(visible),
        "source_row_count": len(rows),
        "alignment_mismatch_count": sum(
            not row["alignment"]["aligned"] for row in rows
        ),
        "variant_row_count": sum(
            bool(row["variants"]["meaning"] or row["variants"]["spelling"])
            for row in rows
        ),
        "content_hash": sha256_text(
            json.dumps(canonical, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
        ),
    }


def write_gzip_json(path: Path, payload: dict[str, Any]) -> tuple[int, str]:
    data = (
        json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
        + "\n"
    ).encode("utf-8")
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("wb") as raw_handle:
        with gzip.GzipFile(
            fileobj=raw_handle,
            mode="wb",
            compresslevel=9,
            mtime=0,
            filename="",
        ) as handle:
            handle.write(data)
    compressed = path.read_bytes()
    return len(compressed), sha256_bytes(compressed)


def write_audit(path: Path, package: dict[str, Any], artifact: dict[str, Any]) -> None:
    counts = package["counts"]
    lines = [
        f"# Auditoría del paquete TAHOT — {package['book']['name_es']}",
        "",
        f"- Fuente: `{package['source']['key']}`",
        f"- Commit STEPBible: `{package['source']['commit']}`",
        f"- SHA-256 fuente: `{package['source']['sha256']}`",
        f"- Referencias: {counts['references']}",
        f"- Filas fuente: {counts['source_rows']}",
        f"- Palabras visibles: {counts['visible_words']}",
        f"- Componentes morfológicos: {counts['morpheme_components']}",
        f"- Filas con variantes: {counts['variant_rows']}",
        f"- Qere: {counts['qere_rows']}",
        f"- Omisiones Qere: {counts['qere_omission_placeholders']}",
        f"- Texto restaurado: {counts['restored_rows']}",
        f"- Adiciones reconstruidas desde LXX: {counts['lxx_addition_rows']}",
        f"- Filas arameas: {counts['aramaic_rows']}",
        f"- Alineaciones diferentes entre columnas: {counts['alignment_mismatches']}",
        f"- Hashes de línea inválidos: {counts['invalid_line_hashes']}",
        f"- Artefacto: `{artifact['path']}`",
        f"- SHA-256 artefacto: `{artifact['sha256']}`",
        "",
        "| Versículo | Filas | Palabras | Variantes | Desalineaciones | Hash |",
        "|---|---:|---:|---:|---:|---|",
    ]
    for verse in package["verses"]:
        lines.append(
            f"| {verse['reference']} | {verse['source_row_count']} | "
            f"{verse['visible_word_count']} | {verse['variant_row_count']} | "
            f"{verse['alignment_mismatch_count']} | `{verse['content_hash']}` |"
        )
    lines.extend(
        [
            "",
            "El paquete conserva las doce columnas activas originales; las cinco reservadas permanecen vacías.",
            "Las glosas son inglesas y proceden de la fuente; todavía no son una traducción literal española.",
            "Este proceso no modifica Supabase, la interfaz ni producción.",
        ]
    )
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def expected_references(book: str, verse_counts: list[int]) -> list[str]:
    return [
        f"{book}.{chapter}.{verse}"
        for chapter, verse_count in enumerate(verse_counts, 1)
        for verse in range(1, verse_count + 1)
    ]


def extract(book: str, output: Path) -> dict[str, Any]:
    if book not in BOOKS:
        raise ValueError(f"Libro no habilitado todavía: {book}")
    definition = BOOKS[book]
    source = source_for_book(book)
    source_url, raw, digest = sources.download(source)

    rows = [
        parsed
        for line_number, line in enumerate(raw.decode("utf-8-sig").splitlines(), 1)
        if (
            parsed := parse_row(
                line,
                line_number,
                book,
                str(source["key"]),
                source_url,
            )
        )
        is not None
    ]
    if not rows:
        raise RuntimeError(f"No se encontraron filas para {book}")

    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        grouped[row["reference"]["english"]].append(row)

    expected = expected_references(book, definition["verse_counts"])
    if set(grouped) != set(expected):
        missing = sorted(set(expected) - set(grouped))
        unexpected = sorted(set(grouped) - set(expected))
        raise RuntimeError(f"Referencias incompletas. Faltan={missing}; extras={unexpected}")

    verses = [verse_payload(reference, grouped[reference]) for reference in expected]
    statuses = Counter(row["textual_status"] for row in rows)
    languages = Counter(row["language"] for row in rows)
    counts = {
        "chapters": len(definition["verse_counts"]),
        "references": len(verses),
        "source_rows": len(rows),
        "visible_words": sum(verse["visible_word_count"] for verse in verses),
        "morpheme_components": sum(
            len(row["alignment"]["components"]) for row in rows
        ),
        "variant_rows": sum(
            bool(row["variants"]["meaning"] or row["variants"]["spelling"])
            for row in rows
        ),
        "qere_rows": statuses["qere"],
        "qere_omission_placeholders": sum(
            row["is_qere_omission_placeholder"] for row in rows
        ),
        "restored_rows": statuses["restored"],
        "lxx_addition_rows": statuses["lxx_addition"],
        "hebrew_rows": languages["hebrew"],
        "aramaic_rows": languages["aramaic"],
        "unknown_language_rows": languages["unknown"],
        "alignment_mismatches": sum(
            not row["alignment"]["aligned"] for row in rows
        ),
        "invalid_line_hashes": sum(
            len(row["source_line_sha256"]) != 64
            or any(
                character not in "0123456789abcdef"
                for character in row["source_line_sha256"]
            )
            for row in rows
        ),
    }
    if counts["unknown_language_rows"] or counts["invalid_line_hashes"]:
        raise RuntimeError(f"Integridad inválida: {counts}")

    package = {
        "schema_version": "stepbible-tahot-book-v1",
        "book": {
            "step_code": book,
            "internal_code": definition["internal_code"],
            "name_es": definition["name_es"],
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
    artifact_path = output / f"{definition['internal_code'].lower()}.json.gz"
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
    }
    output.mkdir(parents=True, exist_ok=True)
    (output / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    write_audit(output / "audit.md", package, artifact)
    return manifest


def self_test() -> None:
    fields = {
        "hebrew": "וּ/בֵית\\׃",
        "transliteration": "u/vet",
        "translation": "<and>/house",
        "dstrongs": "H9002/H1004",
        "grammar": "HC/HNcmsc",
    }
    alignment = component_alignment(fields)
    if not alignment["aligned"] or len(alignment["components"]) != 2:
        raise RuntimeError(f"Alineación sintética inesperada: {alignment}")
    if display_surface(fields["hebrew"]) != ("וּבֵית", "׃"):
        raise RuntimeError("La superficie sintética no se reconstruyó correctamente")
    if source_index_parts("0501") != {"raw": "0501", "base": 5, "subindex": 1}:
        raise RuntimeError("El índice suplementario no se preservó")
    if len(expected_references("Rut", BOOKS["Rut"]["verse_counts"])) != 85:
        raise RuntimeError("El catálogo de versículos de Rut no contiene 85 referencias")
    if len(expected_references("Hag", BOOKS["Hag"]["verse_counts"])) != 38:
        raise RuntimeError("El catálogo de versículos de Hageo no contiene 38 referencias")
    print("Auto-test de paquete TAHOT: OK")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--book", default="Oba")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("artifacts/stepbible-ot-book"),
    )
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return 0
    manifest = extract(args.book, args.output)
    print(json.dumps(manifest["counts"], ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
