#!/usr/bin/env python3
"""Inspecciona las cuatro fuentes TAHOT sin modificar Supabase ni producción."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import urllib.request
from collections import defaultdict
from pathlib import Path
from urllib.parse import quote

COMMIT = "b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39"
BASE = (
    f"https://raw.githubusercontent.com/STEPBible/STEPBible-Data/{COMMIT}/"
    "Translators%20Amalgamated%20OT%2BNT/"
)

SOURCES = [
    {
        "key": "tahot-gen-deu",
        "file": "TAHOT Gen-Deu - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
        "books": "Gen Exo Lev Num Deu".split(),
        "sha256": "e9b8546ee48fe0bfc57c3b70f5f40e98d96580e803526d19026224e31753368b",
    },
    {
        "key": "tahot-jos-est",
        "file": "TAHOT Jos-Est - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
        "books": "Jos Jdg Rut 1Sa 2Sa 1Ki 2Ki 1Ch 2Ch Ezr Neh Est".split(),
        "sha256": "195fee1dc3653bab33701f170734eb894ed647c10cd08cc61749375fe8b73775",
    },
    {
        "key": "tahot-job-sng",
        "file": "TAHOT Job-Sng - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
        "books": "Job Psa Pro Ecc Sng".split(),
        "sha256": "84e118a97e5725e3847cdfdd593873513021c790c63cc91a0d41fca2b5db2ed5",
    },
    {
        "key": "tahot-isa-mal",
        "file": "TAHOT Isa-Mal - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
        "books": "Isa Jer Lam Ezk Dan Hos Jol Amo Oba Jon Mic Nam Hab Zep Hag Zec Mal".split(),
        "sha256": "f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5",
    },
]

EXPECTED_BOOKS = [book for source in SOURCES for book in source["books"]]
REFERENCE_RE = re.compile(r"^(?P<book>[123]?[A-Za-z]{2,3})\.(?P<chapter>\d+)\.(?P<verse>\d+)")
STATUS_RE = re.compile(r"=(?P<status>[A-Za-z]+)$")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def download(source: dict[str, object]) -> tuple[str, bytes, str]:
    filename = str(source["file"])
    url = BASE + quote(filename)
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "Vida-Internacional-STEPBible-OT-Inspector/1.0"},
    )
    with urllib.request.urlopen(request, timeout=300) as response:
        if response.status != 200:
            raise RuntimeError(f"HTTP {response.status}: {url}")
        raw = response.read()

    digest = sha256_bytes(raw)
    expected = source.get("sha256")
    if expected and digest != expected:
        raise RuntimeError(
            f"SHA-256 inesperado en {source['key']}: {digest} != {expected}"
        )
    return url, raw, digest


def inspect_source(source: dict[str, object]) -> dict[str, object]:
    print(f"Descargando {source['key']}…", flush=True)
    url, raw, digest = download(source)
    text = raw.decode("utf-8-sig")

    row_count = 0
    comments = 0
    malformed_data_rows = 0
    books: dict[str, dict[str, object]] = defaultdict(
        lambda: {
            "rows": 0,
            "references": set(),
            "chapters": set(),
            "statuses": defaultdict(int),
        }
    )

    for line_number, line in enumerate(text.splitlines(), 1):
        if not line:
            continue
        if line.startswith("#"):
            comments += 1
            continue
        if "\t" not in line:
            continue

        first_field = line.split("\t", 1)[0]
        match = REFERENCE_RE.match(first_field)
        if not match:
            malformed_data_rows += 1
            continue

        book = match.group("book")
        chapter = int(match.group("chapter"))
        verse = int(match.group("verse"))
        status_match = STATUS_RE.search(first_field)
        status = status_match.group("status") if status_match else "sin-marca"

        info = books[book]
        info["rows"] = int(info["rows"]) + 1
        info["references"].add((chapter, verse))
        info["chapters"].add(chapter)
        info["statuses"][status] += 1
        row_count += 1

    expected_books = list(source["books"])
    found_books = sorted(books)
    missing_books = sorted(set(expected_books) - set(found_books))
    unexpected_books = sorted(set(found_books) - set(expected_books))
    if missing_books or unexpected_books:
        raise RuntimeError(
            f"Cobertura inesperada en {source['key']}: "
            f"faltan={missing_books}, inesperados={unexpected_books}"
        )

    book_summary = []
    for book in expected_books:
        info = books[book]
        book_summary.append(
            {
                "step_code": book,
                "rows": info["rows"],
                "references": len(info["references"]),
                "chapters": len(info["chapters"]),
                "first_reference": (
                    f"{book}.{min(info['references'])[0]}.{min(info['references'])[1]}"
                    if info["references"]
                    else None
                ),
                "last_reference": (
                    f"{book}.{max(info['references'])[0]}.{max(info['references'])[1]}"
                    if info["references"]
                    else None
                ),
                "status_rows": dict(sorted(info["statuses"].items())),
            }
        )

    result = {
        "key": source["key"],
        "filename": source["file"],
        "url": url,
        "bytes": len(raw),
        "lines": len(text.splitlines()),
        "sha256": digest,
        "sha256_was_pinned": bool(source.get("sha256")),
        "comment_lines": comments,
        "parsed_rows": row_count,
        "malformed_data_rows": malformed_data_rows,
        "books": book_summary,
    }
    print(
        f"{source['key']}: {len(raw):,} bytes, {row_count:,} filas, "
        f"{sum(book['references'] for book in book_summary):,} referencias.",
        flush=True,
    )
    return result


def write_summary(path: Path, manifest: dict[str, object]) -> None:
    totals = manifest["totals"]
    lines = [
        "# Validación de fuentes TAHOT del Antiguo Testamento",
        "",
        f"- Commit STEPBible: `{COMMIT}`",
        f"- Archivos: {totals['sources']}",
        f"- Libros: {totals['books']}",
        f"- Referencias distintas: {totals['references']:,}",
        f"- Filas morfológicas: {totals['rows']:,}",
        f"- Bytes descargados: {totals['bytes']:,}",
        f"- Filas tabuladas sin referencia reconocida: {totals['malformed_data_rows']}",
        "",
        "| Fuente | Libros | Referencias | Filas | Bytes | SHA-256 |",
        "|---|---:|---:|---:|---:|---|",
    ]
    for source in manifest["sources"]:
        lines.append(
            f"| {source['key']} | {len(source['books'])} | "
            f"{sum(book['references'] for book in source['books']):,} | "
            f"{source['parsed_rows']:,} | {source['bytes']:,} | `{source['sha256']}` |"
        )

    lines += [
        "",
        "Esta ejecución es de solo lectura. No importa datos, no cambia Supabase y no modifica producción.",
        "El siguiente paso será fijar los cuatro hashes y validar el formato completo de palabras, morfemas, Ketiv/Qere y marcas de procedencia antes de generar paquetes por libro.",
    ]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def inspect(output: Path) -> dict[str, object]:
    sources = [inspect_source(source) for source in SOURCES]
    found_books = [book["step_code"] for source in sources for book in source["books"]]
    if found_books != EXPECTED_BOOKS:
        raise RuntimeError("El orden o la cobertura de los 39 libros no coincide con el manifiesto.")

    totals = {
        "sources": len(sources),
        "books": len(found_books),
        "references": sum(
            book["references"] for source in sources for book in source["books"]
        ),
        "rows": sum(source["parsed_rows"] for source in sources),
        "bytes": sum(source["bytes"] for source in sources),
        "malformed_data_rows": sum(source["malformed_data_rows"] for source in sources),
    }
    manifest = {
        "schema_version": "stepbible-tahot-source-inspection-v1",
        "source_repository": "STEPBible/STEPBible-Data",
        "source_commit": COMMIT,
        "license": "CC BY 4.0",
        "attribution": "STEP Bible",
        "sources": sources,
        "totals": totals,
    }
    output.mkdir(parents=True, exist_ok=True)
    (output / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    write_summary(output / "validation.md", manifest)
    return manifest


def self_test() -> None:
    samples = [
        "Gen.1.1#01=L\tבְּרֵאשִׁית (bere'shit)\tin beginning",
        "Psa.23.1#04=L\tרֹעִי (ro'i)\tmy shepherd",
        "Dan.2.4#05=L\tאֱלָהִין (elahin)\tGod",
    ]
    parsed = []
    for sample in samples:
        match = REFERENCE_RE.match(sample.split("\t", 1)[0])
        if not match:
            raise RuntimeError(f"No se pudo analizar muestra: {sample}")
        parsed.append((match.group("book"), int(match.group("chapter")), int(match.group("verse"))))
    if parsed != [("Gen", 1, 1), ("Psa", 23, 1), ("Dan", 2, 4)]:
        raise RuntimeError(f"Resultado inesperado del auto-test: {parsed}")
    print("Auto-test TAHOT: OK")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("artifacts/stepbible-ot-sources"))
    parser.add_argument("--self-test", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        if args.self_test:
            self_test()
        else:
            manifest = inspect(args.output)
            print(json.dumps(manifest["totals"], ensure_ascii=False, indent=2))
        return 0
    except Exception as error:  # noqa: BLE001
        print(f"ERROR: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
