#!/usr/bin/env python3
"""Clasifica las filas TAHOT que no repiten una referencia bíblica."""
from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

import inspect_ot_sources as sources


def clipped(value: str, limit: int = 120) -> str:
    value = value.replace("\r", "\\r").replace("\n", "\\n")
    return value if len(value) <= limit else value[: limit - 1] + "…"


def inspect(output: Path, sample_limit: int) -> dict[str, object]:
    result_sources: list[dict[str, object]] = []
    totals = Counter()

    for source in sources.SOURCES:
        _, raw, digest = sources.download(source)
        previous_reference: str | None = None
        classes = Counter()
        field_counts = Counter()
        samples: dict[str, list[dict[str, object]]] = {
            "continuation": [],
            "non_reference": [],
        }

        for line_number, line in enumerate(raw.decode("utf-8-sig").splitlines(), 1):
            if not line or line.startswith("#") or "\t" not in line:
                continue

            fields = line.split("\t")
            first = fields[0]
            match = sources.REFERENCE_RE.match(first)
            if match:
                previous_reference = (
                    f"{match.group('book')}.{match.group('chapter')}.{match.group('verse')}"
                )
                continue

            field_counts[len(fields)] += 1
            if first == "" and previous_reference:
                category = "continuation"
            else:
                category = "non_reference"
            classes[category] += 1
            totals[category] += 1

            if len(samples[category]) < sample_limit:
                samples[category].append(
                    {
                        "line": line_number,
                        "previous_reference": previous_reference,
                        "field_count": len(fields),
                        "fields": [clipped(value) for value in fields[:8]],
                    }
                )

        result_sources.append(
            {
                "key": source["key"],
                "sha256": digest,
                "classes": dict(classes),
                "field_counts": {
                    str(key): value for key, value in sorted(field_counts.items())
                },
                "samples": samples,
            }
        )

    payload = {
        "schema_version": "stepbible-tahot-row-shapes-v1",
        "source_commit": sources.COMMIT,
        "totals": dict(totals),
        "sources": result_sources,
    }
    output.mkdir(parents=True, exist_ok=True)
    (output / "row-shapes.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    lines = [
        "# Formas de fila TAHOT sin referencia repetida",
        "",
        f"- Filas continuadas: {totals['continuation']:,}",
        f"- Otras filas tabuladas sin referencia: {totals['non_reference']:,}",
        "",
        "Una fila continuada tiene la primera columna vacía y hereda la referencia bíblica de la fila anterior.",
        "No se interpreta todavía su semántica; este paso solo evita clasificarlas erróneamente como datos dañados.",
        "",
        "| Fuente | Continuadas | Otras | Conteos de columnas |",
        "|---|---:|---:|---|",
    ]
    for source in result_sources:
        counts = ", ".join(
            f"{fields} campos: {count:,}"
            for fields, count in source["field_counts"].items()
        )
        lines.append(
            f"| {source['key']} | {source['classes'].get('continuation', 0):,} | "
            f"{source['classes'].get('non_reference', 0):,} | {counts or '—'} |"
        )
    (output / "row-shapes.md").write_text(
        "\n".join(lines) + "\n", encoding="utf-8"
    )
    return payload


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("artifacts/stepbible-ot-sources"),
    )
    parser.add_argument("--samples", type=int, default=8)
    args = parser.parse_args()
    payload = inspect(args.output, max(1, min(args.samples, 20)))
    print(json.dumps(payload["totals"], ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
