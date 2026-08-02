#!/usr/bin/env python3
"""Extrae y valida Salmos 23:1 y Juan 3:16 desde STEPBible.

El script no importa datos ni modifica Supabase. Descarga las fuentes públicas,
calcula sus hashes, localiza las líneas exactas y genera datos estructurados para
revisión editorial previa.
"""

from __future__ import annotations

import hashlib
import json
import re
import sys
import unicodedata
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
    expected_indexes: tuple[int, ...]


@dataclass(frozen=True)
class Match:
    line_number: int
    text: str


SOURCES = (
    SourceSpec(
        key="psalm-23-1",
        passage="Salmos 23:1",
        language="hebrew",
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
        expected_indexes=(3, 4, 5, 6),
    ),
    SourceSpec(
        key="john-3-16",
        passage="Juan 3:16",
        language="greek",
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
        expected_indexes=tuple(range(1, 27)),
    ),
)


def nfc(value: str) -> str:
    return unicodedata.normalize("NFC", value.strip())


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


def parse_index(reference: str) -> int:
    match = re.search(r"#(\d+)", reference)
    if not match:
        raise ValueError(f"Referencia sin índice de palabra: {reference}")
    return int(match.group(1))


def parse_hebrew(match: Match) -> dict[str, object]:
    fields = match.text.split("\t")
    if len(fields) < 9:
        raise ValueError(f"Línea hebrea incompleta L{match.line_number}: {match.text}")

    reference = fields[0]
    lexical_id = fields[8].strip()
    strong_match = re.search(r"H\d{4}", lexical_id or fields[4])
    if not strong_match:
        raise ValueError(f"Strong hebreo ausente L{match.line_number}")

    lemma = ""
    details = fields[-1]
    if lexical_id:
        lemma_match = re.search(re.escape(lexical_id) + r"=([^=}/]+)=", details)
        if lemma_match:
            lemma = nfc(lemma_match.group(1))

    surface = nfc(fields[1].replace("\\", ""))
    return {
        "source_reference": reference,
        "word_index": parse_index(reference),
        "surface_form": surface,
        "occurrence_transliteration": fields[2].strip(),
        "source_gloss_en": fields[3].strip(),
        "strong_expression": fields[4].strip(),
        "strong_number": strong_match.group(0),
        "morphology_code": fields[5].strip(),
        "lexical_id": lexical_id,
        "lemma": lemma,
        "source_details": details.strip(),
        "source_line": match.line_number,
        "raw_line": match.text,
    }


def parse_greek_surface(value: str) -> tuple[str, str]:
    match = re.match(r"^(.*?)\s+\(([^()]*)\)\s*$", value)
    if not match:
        raise ValueError(f"Forma griega sin transliteración reconocible: {value}")
    return nfc(match.group(1)), match.group(2).strip()


def parse_greek(match: Match) -> dict[str, object]:
    fields = match.text.split("\t")
    if len(fields) < 12:
        raise ValueError(f"Línea griega incompleta L{match.line_number}: {match.text}")

    reference = fields[0]
    surface, transliteration = parse_greek_surface(fields[1])
    strong_and_morph = fields[3].split("=", maxsplit=1)
    if len(strong_and_morph) != 2:
        raise ValueError(f"Strong/morfología griega inválida L{match.line_number}")
    strong_number, morphology_code = strong_and_morph

    lemma_field = fields[4].split("=", maxsplit=1)
    lemma = nfc(lemma_field[0])
    lemma_gloss = lemma_field[1].strip() if len(lemma_field) == 2 else ""

    return {
        "source_reference": reference,
        "word_index": parse_index(reference),
        "surface_form": surface,
        "occurrence_transliteration": transliteration,
        "source_gloss_en": fields[2].strip(),
        "strong_number": strong_number.strip(),
        "morphology_code": morphology_code.strip(),
        "lemma": lemma,
        "lemma_gloss_en": lemma_gloss,
        "textual_witnesses": fields[5].strip(),
        "variant_note": fields[7].strip(),
        "source_gloss_es": fields[8].strip(),
        "source_lemma_gloss": fields[9].strip(),
        "source_word_link": fields[10].strip(),
        "lexical_id": fields[11].strip(),
        "source_line": match.line_number,
        "raw_line": match.text,
    }


def parse_words(source: SourceSpec, matches: list[Match]) -> tuple[str, list[dict[str, object]]]:
    headers = [match.text for match in matches if match.text.startswith("# ")]
    detail_matches = [match for match in matches if not match.text.startswith("# ")]
    if len(headers) != 1:
        raise RuntimeError(
            f"Se esperaba un encabezado para {source.passage}; encontrados: {len(headers)}"
        )

    parser = parse_hebrew if source.language == "hebrew" else parse_greek
    words = [parser(match) for match in detail_matches]
    words.sort(key=lambda word: int(word["word_index"]))

    actual_indexes = tuple(int(word["word_index"]) for word in words)
    if actual_indexes != source.expected_indexes:
        raise RuntimeError(
            f"Secuencia incompleta para {source.passage}: "
            f"esperada {source.expected_indexes}, obtenida {actual_indexes}"
        )
    if len({word["word_index"] for word in words}) != len(words):
        raise RuntimeError(f"Índices duplicados en {source.passage}")

    return headers[0], words


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
        "La validación comprueba continuidad de posiciones y estructura de cada palabra. "
        "No modifica la base de datos.",
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
                f"- Palabras validadas: {result['word_count']}",
                f"- Posiciones: `{result['word_indexes']}`",
                "",
                "| Posición | Forma | Transliteración | Lema | Strong | Morfología | Glosa fuente |",
                "|---:|---|---|---|---|---|---|",
            ]
        )
        for word in result["words"]:  # type: ignore[index]
            source_gloss = str(word.get("source_gloss_es") or word.get("source_gloss_en") or "")
            lines.append(
                "| {word_index} | {surface_form} | {occurrence_transliteration} | "
                "{lemma} | {strong_number} | {morphology_code} | {gloss} |".format(
                    **word,
                    gloss=source_gloss.replace("|", "\\|"),
                )
            )
        lines.extend(["", "### Línea de encabezado", "", "```text", str(result["header"]), "```", ""])

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
        header, words = parse_words(source, matches)

        result: dict[str, object] = {
            "key": source.key,
            "passage": source.passage,
            "language": source.language,
            "url": source.url,
            "sha256": sha256,
            "bytes": len(raw),
            "match_count": len(matches),
            "word_count": len(words),
            "word_indexes": [word["word_index"] for word in words],
            "header": header,
            "words": words,
            "raw_matches": [asdict(match) for match in matches],
        }
        results.append(result)
        print(
            f"Validada secuencia de {len(words)} palabras para {source.passage}.",
            flush=True,
        )

    payload = json.dumps(results, ensure_ascii=False, indent=2) + "\n"
    (OUTPUT_DIR / "validation.json").write_text(payload, encoding="utf-8")
    (OUTPUT_DIR / "structured.json").write_text(payload, encoding="utf-8")
    write_markdown(results)
    print(f"Artefactos escritos en {OUTPUT_DIR}", flush=True)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001 - salida clara para CI
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
