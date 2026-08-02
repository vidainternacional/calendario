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
        started_data = False
        classes = Counter()
        field_counts: dict[str, Counter[int]] = {
            "preamble": Counter(),
            "continuation": Counter(),
            "non_reference_after_data": Counter(),
        }
        samples: dict[str, list[dict[str, object]]] = {
            "preamble": [],
            "continuation": [],
            "non_reference_after_data": [],
        }

        for line_number, line in enumerate(raw.decode("utf-8-sig").splitlines(), 1):
            if not line or line.startswith("#") or "\t" not in line:
                continue

            fields = line.split("\t")
            first = fields[0]
            match = sources.REFERENCE_RE.match(first)
            if match:
                started_data = True
                previous_reference = (
                    f"{match.group('book')}.{match.group('chapter')}.{match.group('verse')}"
                )
                continue

            if not started_data:
                category = "preamble"
            elif first == "" and previous_reference:
                category = "continuation"
            else:
                category = "non_reference_after_data"

            classes[category] += 1
            totals[category] += 1
            field_counts[category][len(fields)] += 1

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
                    category: {
                        str(key): value for key, value in sorted(counts.items())
                    }
                    for category, counts in field_counts.items()
                },
                "samples": samples,
            }
        )

    payload = {
        "schema_version": "stepbible-tahot-row-shapes-v2",
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
        f"- Filas de preámbulo: {totals['preamble']:,}",
        f"- Filas continuadas: {totals['continuation']:,}",
        f"- Filas no reconocidas después de iniciar los datos: {totals['non_reference_after_data']:,}",
        "",
        "Una fila continuada tiene la primera columna vacía y hereda la referencia bíblica de la fila anterior.",
        "El preámbulo contiene licencia, documentación, encabezados y separadores previos al primer registro bíblico.",
        "No se interpreta todavía la semántica de las continuaciones; este paso solo clasifica su forma.",
        "",
        "| Fuente | Preámbulo | Continuadas | No reconocidas tras datos |",
        "|---|---:|---:|---:|",
    ]
    for source in result_sources:
        classes = source["classes"]
        lines.append(
            f"| {source['key']} | {classes.get('preamble', 0):,} | "
            f"{classes.get('continuation', 0):,} | "
            f"{classes.get('non_reference_after_data', 0):,} |"
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
