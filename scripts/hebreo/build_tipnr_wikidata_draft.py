#!/usr/bin/env python3
"""Genera un borrador SQL auditable para nombres propios hebreos.

Entradas:
- crosswalk TIPNR -> Wikidata fijado por blob;
- labels EN/ES de Wikidata generados por fetch_wikidata_labels.py.

El script NO conecta a Supabase y NO aplica migraciones. Produce:
- un borrador SQL insert-only dentro de supabase/migration-drafts;
- un JSON de auditoría.

Criterio conservador:
- TIPNR aporta identidad estable (nombre + referencia ancla);
- Wikidata aporta únicamente la etiqueta española CC0;
- la etiqueta inglesa del Q-ID debe coincidir exactamente con el nombre TIPNR
  o con uno de sus alias ingleses;
- si un TIPNR_ID produce más de una etiqueta española, se excluye del lote;
- no se usa RV1909 ni co-ocurrencia contextual como significado.
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
BATCH_ID = "fase_h_es_nombres_wikidata_draft_20260820"


def normalize_text(value: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", value or "").strip().split())


def normalize_key(value: str) -> str:
    value = normalize_text(value).lower()
    value = unicodedata.normalize("NFD", value)
    value = "".join(ch for ch in value if unicodedata.category(ch) != "Mn")
    value = re.sub(r"[^a-z0-9' _-]+", " ", value)
    return " ".join(value.split())


def parse_tipnr_id(value: str) -> tuple[str, str] | None:
    identity = normalize_text(value)
    match = re.fullmatch(r"(.+)_([123]?[A-Za-z]{2,3}\.[0-9]+\.[0-9]+)", identity)
    if not match:
        return None
    name, anchor = match.groups()
    return name, anchor


def load_crosswalk(path: Path) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    with path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle, delimiter="\t")
        required = {"TIPNR_ID", "WIKIDATA_ID"}
        if not reader.fieldnames or not required.issubset(reader.fieldnames):
            raise ValueError("Crosswalk TIPNR inválido")
        for row in reader:
            identity = normalize_text(row.get("TIPNR_ID") or "")
            qid = normalize_text(row.get("WIKIDATA_ID") or "")
            if not identity or not qid.startswith("Q") or not qid[1:].isdigit():
                continue
            parsed = parse_tipnr_id(identity)
            if not parsed:
                continue
            english_name, anchor = parsed
            rows.append({
                "tipnr_id": identity,
                "english_name": english_name,
                "anchor_ref": anchor,
                "wikidata_id": qid,
            })
    return rows


def load_wikidata(path: Path) -> dict[str, dict[str, object]]:
    result: dict[str, dict[str, object]] = {}
    with path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle, delimiter="\t")
        required = {
            "wikidata_id", "english_label", "english_aliases", "spanish_label",
            "source_uri", "license", "source_revision",
        }
        if not reader.fieldnames or not required.issubset(reader.fieldnames):
            raise ValueError("TSV de Wikidata inválido")
        for row in reader:
            qid = normalize_text(row.get("wikidata_id") or "")
            try:
                aliases = json.loads(row.get("english_aliases") or "[]")
            except json.JSONDecodeError:
                aliases = []
            result[qid] = {
                "english_label": normalize_text(row.get("english_label") or ""),
                "english_aliases": [normalize_text(str(v)) for v in aliases if normalize_text(str(v))],
                "spanish_label": normalize_text(row.get("spanish_label") or ""),
                "source_uri": normalize_text(row.get("source_uri") or ""),
                "license": normalize_text(row.get("license") or ""),
                "source_revision": normalize_text(row.get("source_revision") or ""),
            }
    return result


def english_matches(expected: str, item: dict[str, object]) -> bool:
    wanted = normalize_key(expected)
    values = [str(item.get("english_label") or "")] + [str(v) for v in item.get("english_aliases") or []]
    return any(normalize_key(v) == wanted for v in values if v)


def sql_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def build_mapping(crosswalk: list[dict[str, str]], wikidata: dict[str, dict[str, object]]) -> tuple[list[dict[str, str]], dict[str, int]]:
    reasons = Counter()
    by_identity: dict[str, list[dict[str, str]]] = defaultdict(list)

    for row in crosswalk:
        item = wikidata.get(row["wikidata_id"])
        if not item:
            reasons["wikidata_not_fetched"] += 1
            continue
        if str(item.get("license") or "").lower() not in {"cc0", "cc0-1.0", "creative commons cc0"}:
            reasons["license_not_cc0"] += 1
            continue
        if not english_matches(row["english_name"], item):
            reasons["english_identity_mismatch"] += 1
            continue
        spanish = normalize_text(str(item.get("spanish_label") or ""))
        if not spanish:
            reasons["wikidata_without_spanish_label"] += 1
            continue
        by_identity[row["tipnr_id"]].append({
            **row,
            "spanish_label": spanish,
            "english_label": normalize_text(str(item.get("english_label") or row["english_name"])),
            "source_uri": normalize_text(str(item.get("source_uri") or f"https://www.wikidata.org/entity/{row['wikidata_id']}")),
            "source_revision": normalize_text(str(item.get("source_revision") or "wikidata-lastrevid:unknown")),
        })

    accepted: list[dict[str, str]] = []
    for identity, candidates in by_identity.items():
        spanish_values = {c["spanish_label"] for c in candidates}
        qids = {c["wikidata_id"] for c in candidates}
        if len(spanish_values) != 1:
            reasons["ambiguous_spanish_label"] += 1
            continue
        # Si varios Q-ID dan exactamente la misma etiqueta, conservar el Q-ID menor
        # como evidencia representativa y registrar la identidad TIPNR completa.
        chosen = sorted(candidates, key=lambda c: int(c["wikidata_id"][1:]))[0]
        accepted.append(chosen)
        reasons["accepted_identity"] += 1
        if len(qids) > 1:
            reasons["same_spanish_multiple_qids"] += 1

    accepted.sort(key=lambda row: row["tipnr_id"])
    return accepted, dict(reasons)


def render_sql(rows: list[dict[str, str]]) -> str:
    values = []
    for row in rows:
        values.append(
            "  (" + ",".join([
                sql_literal(row["tipnr_id"]),
                sql_literal(row["wikidata_id"]),
                sql_literal(row["english_label"]),
                sql_literal(row["spanish_label"]),
                sql_literal(row["source_uri"]),
                sql_literal(row["source_revision"]),
            ]) + ")"
        )
    values_sql = ",\n".join(values) if values else "  (NULL,NULL,NULL,NULL,NULL,NULL)"

    return f"""-- BORRADOR NO ACTIVO — FASE H / Bloque 3 — nombres propios vía TIPNR + Wikidata.
-- NO mover a supabase/migrations ni aplicar sin auditoría read-only y aprobación explícita.
-- Batch id propuesto: {BATCH_ID}
-- Fuente identidad: STEPBible TIPNR CC BY 4.0, commit {STEP_TIPNR_REVISION}
-- Crosswalk: PatristicTextArchive/tipnr_data blob {TIPNR_CROSSWALK_BLOB}
-- Etiqueta española: Wikidata structured data CC0 1.0, revisión por Q-ID fijada en cada fila.
--
-- Reversión exacta si posteriormente se activa este lote:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = '{BATCH_ID}';

with map(tipnr_id, wikidata_id, english_label, display_gloss_es, source_uri, source_revision) as (
  values
{values_sql}
), eligible as (
  select
    e.id as lexical_entry_id,
    e.strong_number,
    e.source_gloss,
    map.tipnr_id,
    map.wikidata_id,
    map.english_label,
    map.display_gloss_es,
    map.source_uri,
    map.source_revision
  from public.biblical_lexical_entries e
  join map on map.tipnr_id =
    btrim(split_part(split_part(e.source_gloss,'»',2),'@',1)) || '_' ||
    substring(split_part(e.source_gloss,'@',2) from '[123]?[A-Za-z]{{2,3}}[.][0-9]+[.][0-9]+')
  left join public.biblical_hebrew_spanish_glosses g on g.lexical_entry_id = e.id
  where e.language = 'hebrew'
    and e.review_status = 'approved'
    and e.enabled = true
    and e.display_gloss_es is null
    and g.lexical_entry_id is null
)
insert into public.biblical_hebrew_spanish_glosses (
  lexical_entry_id, display_gloss_es, alternative_glosses_es, confidence,
  derivation_method, source_gloss_snapshot, status, provenance
)
select
  lexical_entry_id,
  display_gloss_es,
  '{{}}'::text[],
  98,
  'tipnr_wikidata_exact_entity_v1',
  source_gloss,
  'verified_derived',
  jsonb_build_object(
    'phase','FASE_H_BLOQUE_3',
    'batch_id','{BATCH_ID}',
    'source_identity','STEPBible TIPNR',
    'source_identity_license','CC BY 4.0',
    'step_tipnr_revision','{STEP_TIPNR_REVISION}',
    'tipnr_crosswalk_blob','{TIPNR_CROSSWALK_BLOB}',
    'tipnr_id',tipnr_id,
    'wikidata_id',wikidata_id,
    'wikidata_uri',source_uri,
    'wikidata_license','CC0-1.0',
    'wikidata_revision',source_revision,
    'strong_number',strong_number,
    'english_identity_label',english_label,
    'identity_match','TIPNR_ID exact + Wikidata English label/alias exact',
    'context_used_as_meaning',false,
    'rv1909_used_as_meaning',false
  )
from eligible
on conflict (lexical_entry_id) do nothing;
"""


def self_test() -> None:
    assert parse_tipnr_id("Aaron_Exo.4.14") == ("Aaron", "Exo.4.14")
    assert parse_tipnr_id("Beth-horon_Upper_Jos.16.5") == ("Beth-horon_Upper", "Jos.16.5")
    assert english_matches("Aaron", {"english_label": "Aaron", "english_aliases": []})
    assert english_matches("Zechariah", {"english_label": "Zechariah the prophet", "english_aliases": ["Zechariah"]})
    assert not english_matches("Aaron", {"english_label": "Moses", "english_aliases": []})
    sample_crosswalk = [{"tipnr_id":"Aaron_Exo.4.14","english_name":"Aaron","anchor_ref":"Exo.4.14","wikidata_id":"Q51676"}]
    sample_wikidata = {"Q51676": {"english_label":"Aaron","english_aliases":[],"spanish_label":"Aarón","source_uri":"https://www.wikidata.org/entity/Q51676","license":"CC0-1.0","source_revision":"wikidata-lastrevid:123"}}
    accepted, reasons = build_mapping(sample_crosswalk, sample_wikidata)
    assert len(accepted) == 1 and accepted[0]["spanish_label"] == "Aarón"
    assert reasons["accepted_identity"] == 1
    sql = render_sql(accepted)
    assert "migration-drafts" not in sql
    assert "on conflict (lexical_entry_id) do nothing" in sql
    assert "context_used_as_meaning',false" in sql
    print("tipnr-wikidata draft self-test OK")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--tipnr-wikidata-tsv", type=Path)
    parser.add_argument("--wikidata-labels-tsv", type=Path)
    parser.add_argument("--output-sql", type=Path)
    parser.add_argument("--audit", type=Path)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return 0
    if not all([args.tipnr_wikidata_tsv, args.wikidata_labels_tsv, args.output_sql, args.audit]):
        parser.error("Faltan entradas requeridas")

    crosswalk = load_crosswalk(args.tipnr_wikidata_tsv)
    wikidata = load_wikidata(args.wikidata_labels_tsv)
    rows, reasons = build_mapping(crosswalk, wikidata)

    args.output_sql.parent.mkdir(parents=True, exist_ok=True)
    args.output_sql.write_text(render_sql(rows), encoding="utf-8")

    audit = {
        "phase": "FASE_H_BLOQUE_3",
        "status": "draft_only_not_applied",
        "batch_id_proposed": BATCH_ID,
        "crosswalk_rows_with_qid": len(crosswalk),
        "mapping_identities_accepted": len(rows),
        "distinct_qids_accepted": len({row["wikidata_id"] for row in rows}),
        "reasons": reasons,
        "sources": {
            "tipnr_crosswalk": TIPNR_CROSSWALK_URI,
            "tipnr_crosswalk_blob": TIPNR_CROSSWALK_BLOB,
            "step_tipnr_revision": STEP_TIPNR_REVISION,
            "step_tipnr_license": "CC BY 4.0",
            "wikidata_license": "CC0-1.0",
        },
        "safety": {
            "fuzzy_matching": False,
            "context_used_as_meaning": False,
            "rv1909_used_as_meaning": False,
            "writes_database": False,
            "active_migration": False,
        },
    }
    args.audit.parent.mkdir(parents=True, exist_ok=True)
    args.audit.write_text(json.dumps(audit, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(audit, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
