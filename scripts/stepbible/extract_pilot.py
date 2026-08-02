#!/usr/bin/env python3
"""Extrae únicamente Salmos 23:1 y Juan 3:16 desde archivos oficiales de STEPBible.

El script no importa datos ni modifica Supabase. Descarga las fuentes públicas,
calcula sus hashes y genera un artefacto pequeño con las líneas coincidentes para
revisión editorial previa.
"""

from __future__ import annotations

import hashlib
import json
import re
import sys
import urllib.request
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable

OUTPUT_DIR = Path("artifacts/stepbible-pilot")


@dataclass(frozen=True)
class SourceSpec:
    key: str
    passage: str
    language: str
    url: str
    patterns: tuple[str, ...]


@dataclass(frozen=True)
class Match:
    line_number: int
    text: str


SOURCES = (
    SourceSpec(
        key="psalm-23-1",
        passage="Salmos 23:1",
        language="hebreo",
        url=(
            "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/"
            "Translators%20Amalgamated%20OT%2BNT/"
            "TAHOT%20Job-Sng%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20"
            "STEPBible.org%20CC%20BY.txt"
        ),
        patterns=(
            r"\bPsa(?:lm)?[.\s:_-]*23[.\s:_-]+1(?:\b|[#.:_-])",
            r"\bPs[.\s:_-]*23[.\s:_-]+1(?:\b|[#.:_-])",
        ),
    ),
    SourceSpec(
        key="john-3-16",
        passage="Juan 3:16",
        language="griego",
        url=(
            "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/"
            "Translators%20Amalgamated%20OT%2BNT/"
            "TAGNT%20Mat-Jhn%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20"
            "STEPBible.org%20CC-BY.txt"
        ),
        patterns=(
            r"\bJhn[.\s:_-]*3[.\s:_-]+16(?:\b|[#.:_-])",
            r"\bJohn[.\s:_-]*3[.\s:_-]+16(?:\b|[#.:_-])",
        ),
    ),
)


def download(url: str) -> bytes:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "Vida-Internacional-STEPBible-Validator/1.0"},
    )
    with urllib.request.urlopen(request, timeout=120) as response:
        if response.status != 200:
            raise RuntimeError(f"Descarga falló con HTTP {response.status}: {url}")
        return response.read()


def find_matches(text: str, patterns: Iterable[str]) -> list[Match]:
    compiled = [re.compile(pattern, re.IGNORECASE) for pattern in patterns]
    matches: list[Match] = []
    for line_number, line in enumerate(text.splitlines(), start=1):
        if any(pattern.search(line) for pattern in compiled):
            matches.append(Match(line_number=line_number, text=line.rstrip()))
    return matches


def summarize_match_count(source: SourceSpec, matches: list[Match]) -> None:
    if not matches:
        raise RuntimeError(
            f"No se encontró {source.passage}. "
            "El formato de referencia de la fuente debe inspeccionarse antes de importar."
        )
    if len(matches) > 100:
        raise RuntimeError(
            f"Se encontraron {len(matches)} líneas para {source.passage}; "
            "el patrón es demasiado amplio."
        )


def write_markdown(results: list[dict[str, object]]) -> None:
    lines = [
        "# Validación piloto STEPBible",
        "",
        "Este artefacto contiene únicamente las líneas fuente necesarias para revisar "
        "Salmos 23:1 y Juan 3:16. No modifica la base de datos.",
        "",
    ]
    for result in results:
        lines.extend(
            [
                f"## {result['passage']}",
                "",
                f"- Idioma: {result['language']}",
                f"- Fuente: `{result['url']}`",
                f"- SHA-256 del archivo: `{result['sha256']}`",
                f"- Tamaño: {result['bytes']} bytes",
                f"- Líneas encontradas: {result['match_count']}",
                "",
                "```text",
            ]
        )
        for match in result["matches"]:  # type: ignore[index]
            lines.append(f"L{match['line_number']}: {match['text']}")
        lines.extend(["```", ""])
    (OUTPUT_DIR / "validation.md").write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    results: list[dict[str, object]] = []

    for source in SOURCES:
        print(f"Descargando {source.passage} desde STEPBible…", flush=True)
        raw = download(source.url)
        sha256 = hashlib.sha256(raw).hexdigest()
        text = raw.decode("utf-8-sig")
        matches = find_matches(text, source.patterns)
        summarize_match_count(source, matches)

        result: dict[str, object] = {
            "key": source.key,
            "passage": source.passage,
            "language": source.language,
            "url": source.url,
            "sha256": sha256,
            "bytes": len(raw),
            "match_count": len(matches),
            "matches": [asdict(match) for match in matches],
        }
        results.append(result)
        print(f"Encontradas {len(matches)} líneas para {source.passage}.", flush=True)

    (OUTPUT_DIR / "validation.json").write_text(
        json.dumps(results, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    write_markdown(results)
    print(f"Artefactos escritos en {OUTPUT_DIR}", flush=True)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001 - salida clara para CI
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
