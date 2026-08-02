#!/usr/bin/env python3
"""Inspecciona encabezados, estados y formas de fila de TAHOT sin importar datos."""
from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

import inspect_ot_sources as sources

HEADER_FIRST_FIELD = "Eng (Heb) Ref & Type"
TARGET_REFERENCES = {
    "Gen.1.1",
    "Psa.23.1",
    "Ezr.4.8",
    "Dan.2.4",
}
STATUS_RE = re.compile(r"=(?P<status>[A-Za-z]+)$")
REFERENCE_WITH_INDEX_RE = re.compile(
    r"^(?P<book>[123]?[A-Za-z]{2,3})\."
    r"(?P<chapter>\d+)\."
    r"(?P<verse>\d+)"
    r"(?P<context>[^#]*)"
    r"#(?P<index>\d+)"
    r"(?P<suffix>[^\t]*)$"
)


def clipped(value: str, limit: int = 180) -> str:
    value = value.replace("\r", "\\r").replace("\n", "\\n")
    return value if len(value) <= limit else value[: limit - 1] + "…"


def normalize_fields(fields: list[str], width: int) -> list[str]:
    if len(fields) < width:
        return fields + [""] * (width - len(fields))
    return fields[:width]


def field_pattern(fields: list[str]) -> str:
    return ",".join(str(index + 1) for index, value in enumerate(fields) if value != "")


def row_payload(
    *,
    line_number: int,
    inherited_reference: str | None,
    fields: list[str],
    headers: list[str],
) -> dict[str, Any]:
    width = max(len(fields), len(headers))
    row = normalize_fields(fields, width)
    named = {
        (headers[index] if index < len(headers) and headers[index] else f"column_{index + 1}"): clipped(value)
        for index, value in enumerate(row)
        if value != ""
    }
    return {
        "line": line_number,
        "inherited_reference": inherited_reference,
        "field_count": len(fields),
        "non_empty_pattern": field_pattern(fields),
        "fields": [clipped(value) for value in fields],
        "named_fields": named,
    }


def inspect_source(source: dict[str, object], sample_limit: int) -> dict[str, Any]:
    _, raw, digest = sources.download(source)
    text = raw.decode("utf-8-sig")

    headers: list[str] = []
    header_variants: Counter[tuple[str, ...]] = Counter()
    explicit_statuses: Counter[str] = Counter()
    explicit_field_counts: Counter[int] = Counter()
    continuation_field_counts: Counter[int] = Counter()
    continuation_patterns: Counter[str] = Counter()
    explicit_patterns: Counter[str] = Counter()
    status_samples: dict[str, list[dict[str, Any]]] = defaultdict(list)
    continuation_samples: dict[str, list[dict[str, Any]]] = defaultdict(list)
    target_rows: dict[str, list[dict[str, Any]]] = defaultdict(list)
    first_data_line: int | None = None
    previous_reference: str | None = None
    current_reference: str | None = None

    for line_number, line in enumerate(text.splitlines(), 1):
        if not line or line.startswith("#") or "\t" not in line:
            continue

        fields = line.split("\t")
        first = fields[0]

        if first == HEADER_FIRST_FIELD:
            headers = fields
            header_variants[tuple(fields)] += 1
            if current_reference in TARGET_REFERENCES:
                target_rows[current_reference].append(
                    row_payload(
                        line_number=line_number,
                        inherited_reference=current_reference,
                        fields=fields,
                        headers=headers,
                    )
                )
            continue

        explicit = REFERENCE_WITH_INDEX_RE.match(first)
        if explicit:
            first_data_line = first_data_line or line_number
            current_reference = (
                f"{explicit.group('book')}."
                f"{explicit.group('chapter')}."
                f"{explicit.group('verse')}"
            )
            previous_reference = current_reference
            status_match = STATUS_RE.search(first)
            status = status_match.group("status") if status_match else "sin-marca"
            explicit_statuses[status] += 1
            explicit_field_counts[len(fields)] += 1
            explicit_patterns[field_pattern(fields)] += 1
            payload = row_payload(
                line_number=line_number,
                inherited_reference=current_reference,
                fields=fields,
                headers=headers,
            )
            payload["source_index"] = int(explicit.group("index"))
            payload["source_suffix"] = explicit.group("suffix")
            payload["status"] = status
            if len(status_samples[status]) < sample_limit:
                status_samples[status].append(payload)
            if current_reference in TARGET_REFERENCES:
                target_rows[current_reference].append(payload)
            continue

        if first == "" and previous_reference:
            continuation_field_counts[len(fields)] += 1
            pattern = field_pattern(fields)
            continuation_patterns[pattern] += 1
            payload = row_payload(
                line_number=line_number,
                inherited_reference=previous_reference,
                fields=fields,
                headers=headers,
            )
            if len(continuation_samples[pattern]) < sample_limit:
                continuation_samples[pattern].append(payload)
            if previous_reference in TARGET_REFERENCES:
                target_rows[previous_reference].append(payload)

    if not header_variants:
        raise RuntimeError(f"No se encontró encabezado TAHOT en {source['key']}")
    if not explicit_statuses:
        raise RuntimeError(f"No se encontraron filas bíblicas en {source['key']}")

    return {
        "key": source["key"],
        "sha256": digest,
        "first_data_line": first_data_line,
        "header_variants": [
            {"count": count, "columns": list(columns)}
            for columns, count in header_variants.most_common()
        ],
        "explicit_statuses": dict(explicit_statuses.most_common()),
        "explicit_field_counts": {str(key): value for key, value in sorted(explicit_field_counts.items())},
        "continuation_field_counts": {
            str(key): value for key, value in sorted(continuation_field_counts.items())
        },
        "explicit_patterns": dict(explicit_patterns.most_common(20)),
        "continuation_patterns": dict(continuation_patterns.most_common(20)),
        "status_samples": dict(status_samples),
        "continuation_samples": dict(continuation_samples),
        "target_rows": dict(target_rows),
    }


def write_markdown(output: Path, payload: dict[str, Any]) -> None:
    lines = [
        "# Esquema observado de TAHOT",
        "",
        f"- Commit STEPBible: `{sources.COMMIT}`",
        f"- Fuentes inspeccionadas: {len(payload['sources'])}",
        f"- Variantes de encabezado globales: {payload['totals']['header_variants']}",
        f"- Estados textuales distintos: {payload['totals']['statuses']}",
        f"- Patrones de continuación distintos: {payload['totals']['continuation_patterns']}",
        "",
        "Este documento describe la forma observada de los archivos. No asigna todavía semántica definitiva a las columnas ni importa contenido.",
        "",
    ]

    for source in payload["sources"]:
        lines.extend(
            [
                f"## {source['key']}",
                "",
                f"SHA-256: `{source['sha256']}`",
                "",
                "### Encabezado principal",
                "",
            ]
        )
        columns = source["header_variants"][0]["columns"]
        lines.append("| # | Nombre exacto |")
        lines.append("|---:|---|")
        for index, name in enumerate(columns, 1):
            lines.append(f"| {index} | `{name}` |")
        lines.extend(["", "### Estados de fila explícita", ""])
        for status, count in source["explicit_statuses"].items():
            lines.append(f"- `{status}`: {count:,}")
        lines.extend(["", "### Patrones principales de fila continuada", ""])
        for pattern, count in list(source["continuation_patterns"].items())[:10]:
            lines.append(f"- columnas `{pattern}`: {count:,}")
        lines.append("")

    lines.extend(["## Referencias de control", ""])
    for reference in sorted(TARGET_REFERENCES):
        count = sum(len(source["target_rows"].get(reference, [])) for source in payload["sources"])
        lines.append(f"- `{reference}`: {count} filas conservadas en el artefacto JSON.")

    output.write_text("\n".join(lines) + "\n", encoding="utf-8")


def inspect(output: Path, sample_limit: int) -> dict[str, Any]:
    inspected = [inspect_source(source, sample_limit) for source in sources.SOURCES]
    all_headers = {
        tuple(variant["columns"])
        for source in inspected
        for variant in source["header_variants"]
    }
    all_statuses = {
        status for source in inspected for status in source["explicit_statuses"]
    }
    all_continuation_patterns = {
        pattern for source in inspected for pattern in source["continuation_patterns"]
    }
    payload = {
        "schema_version": "stepbible-tahot-schema-observation-v1",
        "source_repository": "STEPBible/STEPBible-Data",
        "source_commit": sources.COMMIT,
        "license": "CC BY 4.0",
        "attribution": "STEP Bible",
        "targets": sorted(TARGET_REFERENCES),
        "totals": {
            "header_variants": len(all_headers),
            "statuses": len(all_statuses),
            "continuation_patterns": len(all_continuation_patterns),
        },
        "sources": inspected,
    }
    output.mkdir(parents=True, exist_ok=True)
    (output / "schema-observation.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    write_markdown(output / "schema-observation.md", payload)
    return payload


def self_test() -> None:
    sample = "Gen.1.1#01=L\tבְּרֵאשִׁית\t"
    match = REFERENCE_WITH_INDEX_RE.match(sample.split("\t", 1)[0])
    if not match:
        raise RuntimeError("No se pudo analizar la referencia de control")
    if match.group("book") != "Gen" or int(match.group("index")) != 1:
        raise RuntimeError("La referencia de control produjo un resultado incorrecto")
    if field_pattern(["", "a", "", "b"]) != "2,4":
        raise RuntimeError("El patrón de columnas no es estable")
    print("Auto-test de esquema TAHOT: OK")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("artifacts/stepbible-ot-schema"),
    )
    parser.add_argument("--samples", type=int, default=4)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return 0

    payload = inspect(args.output, max(1, min(args.samples, 10)))
    print(json.dumps(payload["totals"], ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
