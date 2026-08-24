#!/usr/bin/env python3
"""Construye mapping Strong + nombre inglés -> nombre español para nombres propios.

Entradas:
- léxico VIDA exportado a JSONL;
- crosswalk TIPNR -> Wikidata (`tipnr-persons-wikidata.tsv`);
- labels Wikidata EN/ES generados por `fetch_wikidata_labels.py`.

Salida compatible con `proper_name_spanish_pipeline.py`.
No escribe en Supabase.
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

TIPNR_CROSSWALK_URI = "https://github.com/PatristicTextArchive/tipnr_data/blob/master/tipnr-persons-wikidata.tsv"
TIPNR_CROSSWALK_BLOB = "abc3e21b9d08dc310066152f9b62858c4818f4eb"
STEP_TIPNR_REVISION = "b83a3cf1224af5cf72606d86d6be1789adc69541"


def normalize_text(value: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", value or "").strip().split())


def normalize_key(value: str) -> str:
    value = normalize_text(value).lower()
    value = unicodedata.normalize("NFD", value)
    value = "".join(ch for ch in value if unicodedata.category(ch) != "Mn")
    value = re.sub(r"[^a-z0-9' -]+", " ", value)
    return " ".join(value.split())


def normalize_strong(value: str) -> str:
    raw = normalize_text(value).upper().replace(" ", "")
    match = re.fullmatch(r"([HG])(\d+)([A-Z]?)", raw)
    if not match:
        return raw
    prefix, digits, suffix = match.groups()
    return f"{prefix}{int(digits)}{suffix}"


def exact_named_entity(source_gloss: str) -> tuple[str, str] | None:
    value = normalize_text(source_gloss)
    if "»" not in value or "@" not in value:
        return None
    left, right = value.split("»", 1)
    entity, anchor = right.split("@", 1)
    left = normalize_text(left)
    entity = normalize_text(entity)
    if not left or not entity or normalize_key(left) != normalize_key(entity):
        return None
    match = re.search(r"(?:[1-3])?[A-Za-z]{2,3}\.\d+\.\d+", anchor)
    if not match:
        return None
    return left, match.group(0)


def tipnr_id(english_name: str, anchor: str) -> str:
    return f"{english_name.replace('@', '_')}_{anchor}"


def load_crosswalk(path: Path) -> dict[str, list[str]]:
    result: dict[str, list[str]] = defaultdict(list)
    with path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle, delimiter="\t")
        if not reader.fieldnames or not {"TIPNR_ID", "WIKIDATA_ID"}.issubset(reader.fieldnames):
            raise ValueError("Crosswalk TIPNR inválido")
        for row in reader:
            identity = normalize_text(row.get("TIPNR_ID") or "")
            qid = normalize_text(row.get("WIKIDATA_ID") or "")
            if identity and qid.startswith("Q") and qid[1:].isdigit():
                result[identity].append(qid)
    return result


def load_wikidata(path: Path) -> dict[str, dict[str, object]]:
    result: dict[str, dict[str, object]] = {}
    with path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle, delimiter="\t")
        required = {"wikidata_id", "english_label", "english_aliases", "spanish_label", "source_uri", "license", "source_revision"}
        if not reader.fieldnames or not required.issubset(reader.fieldnames):
            raise ValueError("TSV Wikidata inválido")
        for row in reader:
            qid = normalize_text(row.get("wikidata_id") or "")
            try:
                aliases = json.loads(row.get("english_aliases") or "[]")
            except json.JSONDecodeError:
                aliases = []
            result[qid] = {
                "english_label": normalize_text(row.get("english_label") or ""),
                "english_aliases": [normalize_text(str(value)) for value in aliases if normalize_text(str(value))],
                "spanish_label": normalize_text(row.get("spanish_label") or ""),
                "source_uri": normalize_text(row.get("source_uri") or ""),
                "license": normalize_text(row.get("license") or ""),
                "source_revision": normalize_text(row.get("source_revision") or ""),
            }
    return result


def english_matches(expected: str, item: dict[str, object]) -> bool:
    wanted = normalize_key(expected)
    values = [str(item.get("english_label") or "")] + [str(value) for value in item.get("english_aliases") or []]
    return any(normalize_key(value) == wanted for value in values if value)


def read_lexicon(path: Path) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        row = json.loads(line)
        if not row.get("id") or not row.get("strong_number") or not row.get("source_gloss"):
            raise ValueError(f"Lexicon incompleto en línea {line_number}")
        rows.append(row)
    return rows


def self_test() -> None:
    assert exact_named_entity("Aaron»Aaron@Exo.4.14-Heb") == ("Aaron", "Exo.4.14")
    assert tipnr_id("Aaron", "Exo.4.14") == "Aaron_Exo.4.14"
    assert english_matches("Aaron", {"english_label": "Aaron", "english_aliases": []})
    assert english_matches("Zechariah", {"english_label": "Zechariah the prophet", "english_aliases": ["Zechariah"]})
    assert not english_matches("Aaron", {"english_label": "Moses", "english_aliases": []})
    print("tipnr-wikidata mapping self-test OK")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lexicon-jsonl", type=Path)
    parser.add_argument("--tipnr-wikidata-tsv", type=Path)
    parser.add_argument("--wikidata-labels-tsv", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--audit", type=Path)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return 0
    if not all([args.lexicon_jsonl, args.tipnr_wikidata_tsv, args.wikidata_labels_tsv, args.output, args.audit]):
        parser.error("Faltan entradas requeridas")

    crosswalk = load_crosswalk(args.tipnr_wikidata_tsv)
    wikidata = load_wikidata(args.wikidata_labels_tsv)
    lexicon = read_lexicon(args.lexicon_jsonl)

    rows: list[dict[str, str]] = []
    reasons = Counter()
    seen: set[tuple[str, str, str]] = set()

    for lexical in lexicon:
        named = exact_named_entity(str(lexical.get("source_gloss") or ""))
        if not named:
            reasons["not_exact_named_entity"] += 1
            continue
        english_name, anchor = named
        identity = tipnr_id(english_name, anchor)
        qids = crosswalk.get(identity) or []
        if not qids:
            reasons["tipnr_without_wikidata"] += 1
            continue

        accepted = 0
        for qid in qids:
            item = wikidata.get(qid)
            if not item:
                reasons["wikidata_not_fetched"] += 1
                continue
            if not english_matches(english_name, item):
                reasons["english_label_mismatch"] += 1
                continue
            spanish = str(item.get("spanish_label") or "")
            if not spanish:
                reasons["wikidata_without_spanish_label"] += 1
                continue
            key = (normalize_strong(str(lexical.get("strong_number") or "")), normalize_key(english_name), spanish)
            if key in seen:
                continue
            seen.add(key)
            accepted += 1
            rows.append({
                "strong_number": key[0],
                "english_label": english_name,
                "spanish_label": spanish,
                "source_uri": str(item.get("source_uri") or f"https://www.wikidata.org/entity/{qid}"),
                "license": str(item.get("license") or "CC0-1.0"),
                "source_revision": (
                    f"{item.get('source_revision')};"
                    f"pta-tipnr-crosswalk-blob:{TIPNR_CROSSWALK_BLOB};"
                    f"step-tipnr:{STEP_TIPNR_REVISION}"
                ),
            })
        if accepted:
            reasons["accepted"] += accepted

    rows.sort(key=lambda row: (row["strong_number"], normalize_key(row["english_label"]), normalize_key(row["spanish_label"])))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = ["strong_number", "english_label", "spanish_label", "source_uri", "license", "source_revision"]
    with args.output.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, delimiter="\t", fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    audit = {
        "phase": "FASE_H_BLOQUE_3",
        "mapping_rows": len(rows),
        "distinct_strong": len({row["strong_number"] for row in rows}),
        "distinct_spanish_labels": len({row["spanish_label"] for row in rows}),
        "reasons": dict(reasons),
        "sources": {
            "tipnr_crosswalk": TIPNR_CROSSWALK_URI,
            "tipnr_crosswalk_blob": TIPNR_CROSSWALK_BLOB,
            "step_tipnr_revision": STEP_TIPNR_REVISION,
            "tipnr_license": "CC BY 4.0",
            "wikidata_license": "CC0-1.0",
        },
        "safety": {
            "context_used_as_meaning": False,
            "rv1909_used_as_meaning": False,
            "fuzzy_name_matching": False,
            "writes_supabase": False,
        },
    }
    args.audit.parent.mkdir(parents=True, exist_ok=True)
    args.audit.write_text(json.dumps(audit, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(audit, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
