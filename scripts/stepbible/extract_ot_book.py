#!/usr/bin/env python3
"""Genera un paquete reproducible por libro desde TAHOT. No modifica Supabase."""
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
    RESERVED_COLUMN_COUNT,
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
        "chapters": 1,
        "references": 21,
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
    if value == "":
        return []
    return [nfc(part.strip()) for part in value.split("/")]


def display_surface(hebrew: str) -> tuple[str, str]:
    lexical, punctuation = split_punctuation(hebrew)
    return nfc(lexical.replace("/", "")), nfc(punctuation.replace("/", ""))


def display_transliteration(value: str) -> str:
    lexical, punctuation = split_punctuation(value)
    joined = "".join(part.strip() for part in lexical.split("/"))
    return f"{joined}{punctuation}".strip()


def source_gloss_sequence(value: str) -> str:
    lexical, _ = split_punctuation(value)
    return " ".join(part.strip() for part in lexical.split("/") if part.strip())


def source_index_parts(value: str) -> dict[str, Any]:
    if not value.isdigit():
        raise ValueError(f"Índice fuente no numérico: {value}")
    if len(value) <= 2:
        return {"raw": value, "base": int(value), "subindex": 0}
    return {
        "raw": value,
        "base": int(value[:2]),
        "subindex": int(value[2:]),
    }


def component_alignment(fields: dict[str, str]) -> dict[str, Any]:
    component_fields = {
        "hebrew": split_components(split_punctuation(fields["hebrew"])[0]),
        "transliteration": split_components(split_punctuation(fields["transliteration"])[0]),
        "translation": split_components(split_punctuation(fields["translation"])[0]),
        "dstrongs": split_components(fields["dstrongs"]),
        "grammar": split_components(fields["grammar"]),
    }
    counts = {name: len(values) for name, values in component_fields.items()}
    nonzero = [count for count in counts.values() if count > 0]
    aligned = len(set(nonzero)) <= 1
    width = max(nonzero, default=0)
    components = []
    for index in range(width):
        components.append(
            {
                "index": index + 1,
                **{
                    name: values[index] if index < len(values) else None
                    for name, values in component_fields.items()
                },
            }
        )
    return {
        "aligned": aligned,
        "counts": counts,
        "components": components,
    }


def parse_row(
    *,
    line: str,
    line_number: int,
    source_key: str,
    source_url: str,
) -> dict[str, Any] | None:
    if not line or line.startswith("#") or "\t" not in line:
        return None
    fields_list = line.split("\t")
    if not fields_list[0].startswith("Oba."):
        return None
    if len(fields_list) != TOTAL_COLUMN_COUNT:
        raise RuntimeError(
            f"L{line_number}: {len(fields_list)} columnas, se esperaban {TOTAL_COLUMN_COUNT}"
        )
    if any(fields_list[len(TAHOT_COLUMNS) :]):
        raise RuntimeError(f"L{line_number}: columnas reservadas con contenido")

    reference = parse_reference_field(fields_list[0])
    fields = dict(zip(TAHOT_COLUMNS, fields_list[: len(TAHOT_COLUMNS)], strict=True))
    language = language_from_grammar(fields["grammar"])
    placeholder = is_qere_omission_placeholder(fields_list)
    if language == "unknown":
        raise RuntimeError(f"L{line_number}: idioma desconocido en {fields['grammar']}")
    if language == "none" and not placeholder:
        raise RuntimeError(f"L{line_number}: fila sin gramática que no es omisión Qere")

    surface, punctuation = display_surface(fields["hebrew"])
    alignment = component_alignment(fields)
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
        "alignment": alignment,
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
    for display_index, row in enumerate(visible, 1):
        row["display_word_index"] = display_index
    for row in rows:
        if not row["is_visible_base_word"]:
            row["display_word_index"] = None

    original_text = " ".join(
        f"{row['surface_form']}{row['punctuation_after']}".strip()
        for row in visible
        if row["surface_form"] or row["punctuation_after"]
    )
    transliteration = " ".join(
        row["transliteration"] for row in visible if row["transliteration"]
    )
    gloss_sequence = " ".join(
        row["source_gloss_en"] for row in visible if row["source_gloss_en"]
    )
    canonical = {
        "reference": reference,
        "original_text": original_text,
        "transliteration": transliteration,
        "source_gloss_sequence_en": gloss_sequence,
        "rows": rows,
    }
    content_hash = sha256_text(
        json.dumps(canonical, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    )
    return {
        **canonical,
        "visible_word_count": len(visible),
        "source_row_count": len(rows),
        "alignment_mismatch_count": sum(
            1 for row in rows if not row["alignment"]["aligned"]
        ),
        "variant_row_count": sum(
            1
            for row in rows
            if row["variants"]["meaning"] or row["variants"]["spelling"]
        ),
        "content_hash": content_hash,
    }


def write_gzip_json(path: Path, payload: dict[str, Any]) -> tuple[int, str]:
    data = (
        json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
        + "\n"
    ).encode("utf-8")
    path.parent.mkdir(parents=True, exist_ok=True)
    with gzip.open(path, "wb", compresslevel=9, mtime=0) as handle:
        handle.write(data)
    compressed = path.read_bytes()
    return len(compressed), sha256_bytes(compressed)


def write_audit(path: Path, package: dict[str, Any], artifact: dict[str, Any]) -> None:
    counts = package["counts"]
    lines = [
        "# Auditoría del paquete TAHOT — Obadías",
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
            "El paquete conserva las doce columnas originales de cada fila y cinco columnas reservadas vacías no se serializan.",
            "Las glosas son las secuencias inglesas de la fuente; todavía no constituyen una traducción literal española.",
            "Este proceso no modifica Supabase, la interfaz ni producción.",
        ]
    )
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def extract(book: str, output: Path) -> dict[str, Any]:
    if book not in BOOKS:
        raise ValueError(f"Libro no habilitado todavía: {book}")
    definition = BOOKS[book]
    source = source_for_book(book)
    source_url, raw, digest = sources.download(source)

    rows: list[dict[str, Any]] = []
    for line_number, line in enumerate(raw.decode("utf-8-sig").splitlines(), 1):
        parsed = parse_row(
            line=line,
            line_number=line_number,
            source_key=str(source["key"]),
            source_url=source_url,
        )
        if parsed is not None:
            rows.append(parsed)

    if not rows:
        raise RuntimeError(f"No se encontraron filas para {book}")

    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        grouped[row["reference"]["english"]].append(row)

    expected_references = [f"{book}.1.{verse}" for verse in range(1, 22)]
    if sorted(grouped, key=lambda ref: int(ref.rsplit(".", 1)[1])) != expected_references:
        raise RuntimeError(
            f"Referencias incompletas: {sorted(grouped)} != {expected_references}"
        )

    verses = [verse_payload(reference, grouped[reference]) for reference in expected_references]
    statuses = Counter(row["textual_status"] for row in rows)
    languages = Counter(row["language"] for row in rows)
    counts = {
        "chapters": definition["chapters"],
        "references": len(verses),
        "source_rows": len(rows),
        "visible_words": sum(verse["visible_word_count"] for verse in verses),
        "morpheme_components": sum(
            len(row["alignment"]["components"]) for row in rows
        ),
        "variant_rows": sum(
            1
            for row in rows
            if row["variants"]["meaning"] or row["variants"]["spelling"]
        ),
        "qere_rows": statuses["qere"],
        "qere_omission_placeholders": sum(
            1 for row in rows if row["is_qere_omission_placeholder"]
        ),
        "restored_rows": statuses["restored"],
        "lxx_addition_rows": statuses["lxx_addition"],
        "hebrew_rows": languages["hebrew"],
        "aramaic_rows": languages["aramaic"],
        "unknown_language_rows": languages["unknown"],
        "alignment_mismatches": sum(
            1 for row in rows if not row["alignment"]["aligned"]
        ),
        "invalid_line_hashes": sum(
            1
            for row in rows
            if len(row["source_line_sha256"]) != 64
            or any(char not in "0123456789abcdef" for char in row["source_line_sha256"])
        ),
    }
    if counts["references"] != definition["references"]:
        raise RuntimeError("Conteo de referencias inesperado")
    if counts["unknown_language_rows"]:
        raise RuntimeError("El paquete contiene idiomas desconocidos")
    if counts["invalid_line_hashes"]:
        raise RuntimeError("El paquete contiene hashes de línea inválidos")

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
    surface, punctuation = display_surface(fields["hebrew"])
    if surface != "וּבֵית" or punctuation != "׃":
        raise RuntimeError(f"Superficie sintética inesperada: {surface!r}, {punctuation!r}")
    index = source_index_parts("0501")
    if index != {"raw": "0501", "base": 5, "subindex": 1}:
        raise RuntimeError(f"Índice suplementario inesperado: {index}")
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
