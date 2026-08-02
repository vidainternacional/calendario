#!/usr/bin/env python3
"""Clasifica estados, lenguas y documentación interna de TAHOT. Solo lectura."""
from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

import inspect_ot_sources as sources
from inspect_ot_schema import HEADER_FIRST_FIELD, REFERENCE_WITH_INDEX_RE, clipped

KEYWORDS = (
    "aramaic",
    "grammar",
    "hebrew",
    "ketiv",
    "kethiv",
    "meaning variants",
    "qere",
    "qeri",
    "read",
    "spelling variants",
    "type",
    "written",
)


def suffix_family(suffix: str) -> str:
    if suffix == "=L":
        return "l_base"
    if suffix.startswith("=Q("):
        return "qere_with_ketiv"
    if suffix == "=R":
        return "r"
    if suffix == "=X":
        return "x"
    if suffix.startswith("=L") or suffix.startswith("=LA"):
        return "l_with_annotation"
    if suffix:
        return "other"
    return "missing"


def non_empty_pattern(fields: list[str]) -> str:
    return ",".join(str(index + 1) for index, value in enumerate(fields) if value != "")


def sample_payload(line_number: int, fields: list[str], headers: list[str]) -> dict[str, Any]:
    named = {
        (headers[index] if index < len(headers) and headers[index] else f"column_{index + 1}"): clipped(value)
        for index, value in enumerate(fields)
        if value != ""
    }
    return {
        "line": line_number,
        "reference": fields[0],
        "field_count": len(fields),
        "non_empty_pattern": non_empty_pattern(fields),
        "fields": [clipped(value) for value in fields],
        "named_fields": named,
    }


def inspect_source(source: dict[str, object], sample_limit: int) -> dict[str, Any]:
    _, raw, digest = sources.download(source)
    text = raw.decode("utf-8-sig")

    headers: list[str] = []
    preamble_lines: list[dict[str, Any]] = []
    keyword_lines: list[dict[str, Any]] = []
    first_data_seen = False
    exact_suffixes: Counter[str] = Counter()
    suffix_families: Counter[str] = Counter()
    suffix_samples: dict[str, list[dict[str, Any]]] = defaultdict(list)
    grammar_languages: Counter[str] = Counter()
    grammar_prefix_samples: dict[str, list[dict[str, Any]]] = defaultdict(list)
    blank_separator_rows = 0
    empty_first_nonblank_rows = 0
    empty_first_nonblank_patterns: Counter[str] = Counter()
    empty_first_nonblank_samples: dict[str, list[dict[str, Any]]] = defaultdict(list)
    reserved_nonempty: Counter[int] = Counter()

    for line_number, line in enumerate(text.splitlines(), 1):
        if not first_data_seen:
            lower = line.lower()
            if line.strip() and len(preamble_lines) < 120:
                preamble_lines.append({"line": line_number, "text": clipped(line, 300)})
            if any(keyword in lower for keyword in KEYWORDS) and len(keyword_lines) < 120:
                keyword_lines.append({"line": line_number, "text": clipped(line, 500)})

        if not line or line.startswith("#") or "\t" not in line:
            continue

        fields = line.split("\t")
        first = fields[0]

        if first == HEADER_FIRST_FIELD:
            headers = fields
            continue

        match = REFERENCE_WITH_INDEX_RE.match(first)
        if match:
            first_data_seen = True
            suffix = match.group("suffix")
            exact_suffixes[suffix] += 1
            family = suffix_family(suffix)
            suffix_families[family] += 1
            if len(suffix_samples[suffix]) < sample_limit:
                suffix_samples[suffix].append(sample_payload(line_number, fields, headers))

            grammar = fields[5].strip() if len(fields) > 5 else ""
            language = grammar[:1] if grammar[:1] in {"H", "A"} else "other"
            grammar_languages[language] += 1
            if len(grammar_prefix_samples[language]) < sample_limit:
                grammar_prefix_samples[language].append(
                    {
                        "line": line_number,
                        "reference": first,
                        "grammar": grammar,
                        "hebrew": fields[1] if len(fields) > 1 else "",
                        "translation": fields[3] if len(fields) > 3 else "",
                    }
                )

            for index, value in enumerate(fields[12:], 13):
                if value != "":
                    reserved_nonempty[index] += 1
            continue

        if first == "":
            if all(value == "" for value in fields):
                blank_separator_rows += 1
            else:
                empty_first_nonblank_rows += 1
                pattern = non_empty_pattern(fields)
                empty_first_nonblank_patterns[pattern] += 1
                if len(empty_first_nonblank_samples[pattern]) < sample_limit:
                    empty_first_nonblank_samples[pattern].append(
                        sample_payload(line_number, fields, headers)
                    )

    if not headers:
        raise RuntimeError(f"No se encontró encabezado en {source['key']}")
    if reserved_nonempty:
        raise RuntimeError(
            f"{source['key']} usa columnas reservadas inesperadas: {dict(reserved_nonempty)}"
        )

    return {
        "key": source["key"],
        "sha256": digest,
        "headers": headers,
        "named_column_count": sum(1 for header in headers if header),
        "reserved_column_count": sum(1 for header in headers if not header),
        "preamble_lines": preamble_lines,
        "keyword_lines": keyword_lines,
        "exact_suffixes": dict(exact_suffixes.most_common()),
        "suffix_families": dict(suffix_families.most_common()),
        "suffix_samples": dict(suffix_samples),
        "grammar_languages": dict(grammar_languages.most_common()),
        "grammar_prefix_samples": dict(grammar_prefix_samples),
        "blank_separator_rows": blank_separator_rows,
        "empty_first_nonblank_rows": empty_first_nonblank_rows,
        "empty_first_nonblank_patterns": dict(empty_first_nonblank_patterns.most_common()),
        "empty_first_nonblank_samples": dict(empty_first_nonblank_samples),
        "reserved_nonempty": dict(reserved_nonempty),
    }


def write_markdown(output: Path, payload: dict[str, Any]) -> None:
    totals = payload["totals"]
    lines = [
        "# Clasificación semántica preliminar de TAHOT",
        "",
        f"- Fuentes: {totals['sources']}",
        f"- Columnas nombradas: {totals['named_columns']}",
        f"- Columnas reservadas vacías: {totals['reserved_columns']}",
        f"- Separadores completamente vacíos: {totals['blank_separator_rows']:,}",
        f"- Filas con primera columna vacía y contenido: {totals['empty_first_nonblank_rows']}",
        f"- Filas hebreas según `Grammar`: {totals['grammar_languages'].get('H', 0):,}",
        f"- Filas arameas según `Grammar`: {totals['grammar_languages'].get('A', 0):,}",
        f"- Otras filas lingüísticas: {totals['grammar_languages'].get('other', 0):,}",
        "",
        "La clasificación de estado conserva el sufijo exacto de la referencia. Las familias son técnicas y no sustituyen la documentación de STEPBible.",
        "",
    ]

    for source in payload["sources"]:
        lines.extend(
            [
                f"## {source['key']}",
                "",
                f"- separadores vacíos: {source['blank_separator_rows']:,}",
                f"- filas vacías de referencia con contenido: {source['empty_first_nonblank_rows']:,}",
                f"- filas hebreas: {source['grammar_languages'].get('H', 0):,}",
                f"- filas arameas: {source['grammar_languages'].get('A', 0):,}",
                "",
                "### Familias de sufijo",
                "",
            ]
        )
        for family, count in source["suffix_families"].items():
            lines.append(f"- `{family}`: {count:,}")
        lines.extend(["", "### Sufijos exactos principales", ""])
        for suffix, count in list(source["exact_suffixes"].items())[:20]:
            lines.append(f"- `{suffix}`: {count:,}")

        if source["empty_first_nonblank_patterns"]:
            lines.extend(["", "### Filas sin referencia explícita pero con contenido", ""])
            for pattern, count in source["empty_first_nonblank_patterns"].items():
                lines.append(f"- columnas `{pattern}`: {count:,}")
                for sample in source["empty_first_nonblank_samples"].get(pattern, [])[:3]:
                    values = "; ".join(
                        f"{name}={value}" for name, value in sample["named_fields"].items()
                    )
                    lines.append(f"  - L{sample['line']}: `{values}`")

        lines.extend(["", "### Líneas documentales relevantes", ""])
        for item in source["keyword_lines"][:20]:
            lines.append(f"- L{item['line']}: `{item['text']}`")
        lines.append("")

    output.write_text("\n".join(lines) + "\n", encoding="utf-8")


def inspect(output: Path, sample_limit: int) -> dict[str, Any]:
    inspected = [inspect_source(source, sample_limit) for source in sources.SOURCES]
    language_totals: Counter[str] = Counter()
    for source in inspected:
        language_totals.update(source["grammar_languages"])

    named_counts = {source["named_column_count"] for source in inspected}
    reserved_counts = {source["reserved_column_count"] for source in inspected}
    if len(named_counts) != 1 or len(reserved_counts) != 1:
        raise RuntimeError("Los cuatro archivos no comparten el mismo ancho de encabezado")

    payload = {
        "schema_version": "stepbible-tahot-semantics-observation-v1",
        "source_repository": "STEPBible/STEPBible-Data",
        "source_commit": sources.COMMIT,
        "license": "CC BY 4.0",
        "attribution": "STEP Bible",
        "totals": {
            "sources": len(inspected),
            "named_columns": next(iter(named_counts)),
            "reserved_columns": next(iter(reserved_counts)),
            "blank_separator_rows": sum(source["blank_separator_rows"] for source in inspected),
            "empty_first_nonblank_rows": sum(
                source["empty_first_nonblank_rows"] for source in inspected
            ),
            "grammar_languages": dict(language_totals),
        },
        "sources": inspected,
    }
    output.mkdir(parents=True, exist_ok=True)
    (output / "schema-semantics.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    write_markdown(output / "schema-semantics.md", payload)
    return payload


def self_test() -> None:
    expected = {
        "=L": "l_base",
        "=Q(K)": "qere_with_ketiv",
        "=Q(k)": "qere_with_ketiv",
        "=L(abh)": "l_with_annotation",
        "=R": "r",
        "=X": "x",
    }
    actual = {value: suffix_family(value) for value in expected}
    if actual != expected:
        raise RuntimeError(f"Familias inesperadas: {actual}")
    if non_empty_pattern(["", "a", "", "b"]) != "2,4":
        raise RuntimeError("El patrón de columnas no es estable")
    print("Auto-test semántico TAHOT: OK")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("artifacts/stepbible-ot-schema"),
    )
    parser.add_argument("--samples", type=int, default=3)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return 0

    payload = inspect(args.output, max(1, min(args.samples, 8)))
    print(json.dumps(payload["totals"], ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
