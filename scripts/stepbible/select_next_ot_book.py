#!/usr/bin/env python3
"""Clasifica libros TAHOT restantes sin generar paquetes ni modificar Supabase."""
from __future__ import annotations

import argparse
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

import inspect_ot_sources as sources
from extract_ot_book import parse_row

EXCLUDED_BOOKS = {"Oba", "Rut", "Hag"}
SELECTION_ORDINAL = "cuarto"


def risk_key(item: dict[str, Any]) -> tuple[int, ...]:
    """Orden conservador: integridad, estructuras especiales, tamaño y variantes."""
    counts = item["counts"]
    return (
        1 if counts["alignment_mismatches"] else 0,
        1 if counts["unknown_language_rows"] else 0,
        1 if counts["qere_omission_placeholders"] else 0,
        1 if counts["aramaic_rows"] else 0,
        1 if counts["restored_rows"] else 0,
        1 if counts["lxx_addition_rows"] else 0,
        counts["references"],
        counts["qere_rows"],
        counts["variant_rows"],
        counts["morpheme_components"],
        counts["source_rows"],
    )


def inspect_book_rows(
    book: str,
    rows: list[dict[str, Any]],
    source: dict[str, object],
    source_url: str,
    source_sha256: str,
) -> dict[str, Any]:
    statuses = Counter(row["textual_status"] for row in rows)
    languages = Counter(row["language"] for row in rows)
    references = {
        (row["reference"]["chapter"], row["reference"]["verse"])
        for row in rows
    }
    chapters = {chapter for chapter, _verse in references}
    counts = {
        "chapters": len(chapters),
        "references": len(references),
        "source_rows": len(rows),
        "visible_words": sum(row["is_visible_base_word"] for row in rows),
        "morpheme_components": sum(len(row["alignment"]["components"]) for row in rows),
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
        "alignment_mismatches": sum(not row["alignment"]["aligned"] for row in rows),
        "max_components_per_row": max(
            (len(row["alignment"]["components"]) for row in rows),
            default=0,
        ),
    }
    eligible = (
        counts["references"] > 0
        and counts["alignment_mismatches"] == 0
        and counts["unknown_language_rows"] == 0
    )
    return {
        "step_code": book,
        "source_key": source["key"],
        "source_url": source_url,
        "source_sha256": source_sha256,
        "counts": counts,
        "eligible": eligible,
    }


def inspect_all() -> dict[str, Any]:
    results: list[dict[str, Any]] = []
    for source in sources.SOURCES:
        print(f"Descargando {source['key']}…", flush=True)
        source_url, raw, digest = sources.download(source)
        wanted = set(source["books"]) - EXCLUDED_BOOKS
        grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)

        for line_number, line in enumerate(raw.decode("utf-8-sig").splitlines(), 1):
            if not line or "\t" not in line:
                continue
            first = line.split("\t", 1)[0]
            match = sources.REFERENCE_RE.match(first)
            if not match:
                continue
            book = match.group("book")
            if book not in wanted:
                continue
            parsed = parse_row(
                line,
                line_number,
                book,
                str(source["key"]),
                source_url,
            )
            if parsed is not None:
                grouped[book].append(parsed)

        for book in source["books"]:
            if book in EXCLUDED_BOOKS:
                continue
            rows = grouped.get(book, [])
            if not rows:
                raise RuntimeError(f"No se encontraron filas para {book}")
            results.append(inspect_book_rows(book, rows, source, source_url, digest))

    ranked = sorted(results, key=risk_key)
    eligible = [item for item in ranked if item["eligible"]]
    if not eligible:
        raise RuntimeError(f"No existe un candidato íntegro para el {SELECTION_ORDINAL} libro")

    winner = eligible[0]
    return {
        "schema_version": "vida-tahot-next-book-selection-v1",
        "source_commit": sources.COMMIT,
        "excluded_books": sorted(EXCLUDED_BOOKS),
        "selection_ordinal": SELECTION_ORDINAL,
        "selection_policy": {
            "integrity_required": [
                "alignment_mismatches=0",
                "unknown_language_rows=0",
                "references>0",
            ],
            "preference_order": [
                "sin omisiones Qere",
                "sin filas arameas",
                "sin texto restaurado",
                "sin adiciones reconstruidas desde LXX",
                "menor número de referencias",
                "menos filas Qere",
                "menos filas con variantes",
                "menos componentes morfológicos",
                "menos filas fuente",
            ],
        },
        "candidate_count": len(results),
        "selected": winner,
        "ranking": ranked,
    }


def write_report(output: Path, result: dict[str, Any]) -> None:
    output.mkdir(parents=True, exist_ok=True)
    (output / "selection.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    selected = result["selected"]
    counts = selected["counts"]
    lines = [
        f"# Selección auditada del {result['selection_ordinal']} libro TAHOT",
        "",
        f"- Commit STEPBible: `{result['source_commit']}`",
        f"- Libros evaluados: {result['candidate_count']}",
        f"- Libros excluidos por importación aprobada: {', '.join(result['excluded_books'])}",
        f"- Seleccionado: `{selected['step_code']}`",
        f"- Fuente: `{selected['source_key']}`",
        f"- Referencias: {counts['references']}",
        f"- Capítulos: {counts['chapters']}",
        f"- Palabras visibles: {counts['visible_words']}",
        f"- Componentes morfológicos: {counts['morpheme_components']}",
        f"- Filas con variantes: {counts['variant_rows']}",
        f"- Filas Qere: {counts['qere_rows']}",
        f"- Omisiones Qere: {counts['qere_omission_placeholders']}",
        f"- Filas arameas: {counts['aramaic_rows']}",
        f"- Texto restaurado: {counts['restored_rows']}",
        f"- Adiciones desde LXX: {counts['lxx_addition_rows']}",
        f"- Desalineaciones: {counts['alignment_mismatches']}",
        "",
        "## Primeros diez candidatos",
        "",
        "| Orden | Libro | Ref. | Palabras | Morfemas | Variantes | Qere | Omisiones | Arameo | Restaurado | LXX | Desalineaciones |",
        "|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for index, item in enumerate(result["ranking"][:10], 1):
        c = item["counts"]
        lines.append(
            f"| {index} | {item['step_code']} | {c['references']} | "
            f"{c['visible_words']} | {c['morpheme_components']} | {c['variant_rows']} | "
            f"{c['qere_rows']} | {c['qere_omission_placeholders']} | {c['aramaic_rows']} | "
            f"{c['restored_rows']} | {c['lxx_addition_rows']} | {c['alignment_mismatches']} |"
        )
    lines += [
        "",
        "Esta auditoría es de solo lectura. No genera paquetes, payloads o migraciones y no modifica Supabase ni producción.",
    ]
    (output / "selection.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def self_test() -> None:
    safe_small = {
        "counts": {
            "alignment_mismatches": 0,
            "unknown_language_rows": 0,
            "qere_omission_placeholders": 0,
            "aramaic_rows": 0,
            "restored_rows": 0,
            "lxx_addition_rows": 0,
            "references": 40,
            "qere_rows": 2,
            "variant_rows": 3,
            "morpheme_components": 900,
            "source_rows": 600,
        }
    }
    risky_smaller = {
        "counts": {
            **safe_small["counts"],
            "references": 30,
            "qere_omission_placeholders": 1,
        }
    }
    if not risk_key(safe_small) < risk_key(risky_smaller):
        raise RuntimeError("La política no prioriza seguridad sobre tamaño")
    if EXCLUDED_BOOKS != {"Oba", "Rut", "Hag"}:
        raise RuntimeError("La selección no excluye exactamente los tres libros aprobados")
    print("Auto-test de selección TAHOT: OK")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("artifacts/next-ot-book"))
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    try:
        if args.self_test:
            self_test()
            return 0
        result = inspect_all()
        write_report(args.output, result)
        print(json.dumps(result["selected"], ensure_ascii=False, indent=2))
        return 0
    except Exception as error:  # noqa: BLE001
        print(f"ERROR: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
