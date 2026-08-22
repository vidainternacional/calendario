#!/usr/bin/env python3
"""Descarga labels EN/ES de Wikidata para Q-IDs de un crosswalk TIPNR.

No escribe en Supabase. Produce un TSV reproducible para el pipeline de nombres
propios de FASE H / Bloque 3.

Fuente de labels: Wikidata structured data (CC0 1.0).
La revisión se fija por `lastrevid` de cada entidad.
"""
from __future__ import annotations

import argparse
import csv
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Iterable

API = "https://www.wikidata.org/w/api.php"
USER_AGENT = "VIDA-Internacional-Hebreo/1.0 (FASE H; data audit)"


def chunked(values: list[str], size: int) -> Iterable[list[str]]:
    for index in range(0, len(values), size):
        yield values[index:index + size]


def read_qids(path: Path) -> list[str]:
    qids: set[str] = set()
    with path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle, delimiter="\t")
        if not reader.fieldnames or "WIKIDATA_ID" not in reader.fieldnames:
            raise ValueError("El crosswalk debe incluir WIKIDATA_ID")
        for row in reader:
            qid = (row.get("WIKIDATA_ID") or "").strip()
            if qid.startswith("Q") and qid[1:].isdigit():
                qids.add(qid)
    return sorted(qids, key=lambda value: int(value[1:]))


def normalize_entity(qid: str, entity: dict[str, object]) -> dict[str, str]:
    labels = entity.get("labels") if isinstance(entity.get("labels"), dict) else {}
    aliases = entity.get("aliases") if isinstance(entity.get("aliases"), dict) else {}

    def label(lang: str) -> str:
        value = labels.get(lang) if isinstance(labels, dict) else None
        return str(value.get("value") or "") if isinstance(value, dict) else ""

    def alias_values(lang: str) -> list[str]:
        values = aliases.get(lang) if isinstance(aliases, dict) else None
        if not isinstance(values, list):
            return []
        result: list[str] = []
        for item in values:
            if isinstance(item, dict) and item.get("value"):
                result.append(str(item["value"]))
        return sorted(set(result))

    lastrevid = entity.get("lastrevid")
    revision = f"wikidata-lastrevid:{lastrevid}" if lastrevid else "wikidata-lastrevid:unknown"
    return {
        "wikidata_id": qid,
        "english_label": label("en"),
        "english_aliases": json.dumps(alias_values("en"), ensure_ascii=False),
        "spanish_label": label("es"),
        "spanish_aliases": json.dumps(alias_values("es"), ensure_ascii=False),
        "source_uri": f"https://www.wikidata.org/entity/{qid}",
        "license": "CC0-1.0",
        "source_revision": revision,
    }


def fetch_batch(qids: list[str]) -> list[dict[str, str]]:
    params = urllib.parse.urlencode({
        "action": "wbgetentities",
        "ids": "|".join(qids),
        "props": "labels|aliases|info",
        "languages": "en|es",
        "format": "json",
        "formatversion": "2",
    })
    request = urllib.request.Request(f"{API}?{params}", headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=30) as response:
        payload = json.load(response)
    entities = payload.get("entities") or {}
    if not isinstance(entities, dict):
        raise ValueError("Respuesta inesperada de Wikidata")
    return [normalize_entity(qid, entities.get(qid) or {}) for qid in qids]


def self_test() -> None:
    row = normalize_entity("Q51676", {
        "lastrevid": 123,
        "labels": {"en": {"value": "Aaron"}, "es": {"value": "Aarón"}},
        "aliases": {"en": [{"value": "Aaron (Old Testament character)"}]},
    })
    assert row["english_label"] == "Aaron"
    assert row["spanish_label"] == "Aarón"
    assert row["source_revision"] == "wikidata-lastrevid:123"
    assert "Old Testament" in row["english_aliases"]
    print("wikidata-labels self-test OK")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--tipnr-wikidata-tsv", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--audit", type=Path)
    parser.add_argument("--batch-size", type=int, default=50)
    parser.add_argument("--sleep-ms", type=int, default=100)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return 0
    if not all([args.tipnr_wikidata_tsv, args.output, args.audit]):
        parser.error("Se requieren --tipnr-wikidata-tsv, --output y --audit")
    if args.batch_size < 1 or args.batch_size > 50:
        parser.error("--batch-size debe estar entre 1 y 50")

    qids = read_qids(args.tipnr_wikidata_tsv)
    rows: list[dict[str, str]] = []
    for batch in chunked(qids, args.batch_size):
        rows.extend(fetch_batch(batch))
        if args.sleep_ms:
            time.sleep(args.sleep_ms / 1000)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "wikidata_id", "english_label", "english_aliases", "spanish_label",
        "spanish_aliases", "source_uri", "license", "source_revision",
    ]
    with args.output.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, delimiter="\t", fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    audit = {
        "phase": "FASE_H_BLOQUE_3",
        "source": "Wikidata structured data",
        "license": "CC0-1.0",
        "qids_requested": len(qids),
        "rows_written": len(rows),
        "with_english_label": sum(bool(row["english_label"]) for row in rows),
        "with_spanish_label": sum(bool(row["spanish_label"]) for row in rows),
        "without_spanish_label": sum(not bool(row["spanish_label"]) for row in rows),
    }
    args.audit.parent.mkdir(parents=True, exist_ok=True)
    args.audit.write_text(json.dumps(audit, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(audit, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
