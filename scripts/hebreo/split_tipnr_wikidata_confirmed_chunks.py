#!/usr/bin/env python3
"""Divide el borrador TIPNR/Wikidata en lotes pequeños y conservadores.

No conecta a Supabase. Los SQL generados son BORRADORES NO ACTIVOS.
Una propuesta solo llega al lote seguro cuando:
- TIPNR/Wikidata ya la identificaron como candidato;
- la forma inglesa primaria de Wikidata coincide exactamente con la entidad
  fuente a la derecha de `»`;
- `source_gloss` representa exactamente esa misma entidad a ambos lados de `»`;
- la forma española es razonablemente compatible con una adaptación/transliteración
  del nombre inglés (gate fonético conservador, no traducción semántica);
- la forma española aparece como frase completa en >=2 fuentes bíblicas españolas
  verificadas en la referencia ancla.

La referencia bíblica se usa exclusivamente para corroborar grafía/identidad del
nombre y nunca como fuente del significado léxico.
"""
from __future__ import annotations

import argparse
import json
import re
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path

TUPLE_RE = re.compile(
    r"^\s*\('((?:''|[^'])*)','((?:''|[^'])*)','((?:''|[^'])*)','((?:''|[^'])*)','((?:''|[^'])*)','((?:''|[^'])*)'\),?\s*$"
)
ANCHOR_RE = re.compile(r"_((?:[123])?[A-Za-z]{2,3}\.\d+\.\d+)$")
MIN_NAME_SIMILARITY = 0.55


def unescape_sql(value: str) -> str:
    return value.replace("''", "'")


def sql_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def normalize_name_for_similarity(value: str) -> str:
    value = unicodedata.normalize("NFD", value.lower())
    value = "".join(ch for ch in value if unicodedata.category(ch) != "Mn")
    value = re.sub(r"\([^)]*\)", "", value)
    value = re.sub(r"[^a-z]+", "", value)
    for source, target in (("ph", "f"), ("th", "t"), ("sh", "s"), ("ch", "k"), ("qu", "k")):
        value = value.replace(source, target)
    value = value.replace("q", "k").replace("c", "k")
    if value.endswith("h"):
        value = value[:-1]
    return value


def name_similarity(english: str, spanish: str) -> float:
    left = normalize_name_for_similarity(english)
    right = normalize_name_for_similarity(spanish)
    if not left or not right:
        return 0.0
    return SequenceMatcher(None, left, right).ratio()


def parse_rows(sql: str) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for line in sql.splitlines():
        match = TUPLE_RE.match(line)
        if not match:
            continue
        tipnr_id, qid, english, spanish, uri, revision = map(unescape_sql, match.groups())
        anchor_match = ANCHOR_RE.search(tipnr_id)
        if not anchor_match:
            continue
        rows.append({
            "tipnr_id": tipnr_id,
            "anchor_ref": anchor_match.group(1),
            "wikidata_id": qid,
            "english_label": english,
            "spanish_label": spanish,
            "source_uri": uri,
            "source_revision": revision,
        })
    return rows


def filter_similarity(rows: list[dict[str, str]]) -> tuple[list[dict[str, object]], list[dict[str, object]]]:
    accepted: list[dict[str, object]] = []
    rejected: list[dict[str, object]] = []
    for row in rows:
        score = round(name_similarity(row["english_label"], row["spanish_label"]), 6)
        enriched: dict[str, object] = {**row, "name_similarity": score}
        if score >= MIN_NAME_SIMILARITY:
            accepted.append(enriched)
        else:
            rejected.append(enriched)
    return accepted, rejected


def render_chunk(rows: list[dict[str, object]], index: int) -> str:
    batch_id = f"fase_h_es_nombres_wikidata_safe_v4_{index:03d}_20260820"
    values = ",\n".join(
        "  (" + ",".join([
            sql_literal(str(row["tipnr_id"])),
            sql_literal(str(row["anchor_ref"])),
            sql_literal(str(row["wikidata_id"])),
            sql_literal(str(row["english_label"])),
            sql_literal(str(row["spanish_label"])),
            sql_literal(str(row["source_uri"])),
            sql_literal(str(row["source_revision"])),
            f"{float(row['name_similarity']):.6f}",
        ]) + ")"
        for row in rows
    )
    return f"""-- BORRADOR NO ACTIVO — FASE H / Bloque 3 — nombres propios TIPNR + Wikidata, gate seguro v4.
-- Chunk {index:03d}; candidatos seguros={len(rows)}.
-- No aplicar sin auditoría read-only del lote.
-- La referencia ancla se usa SOLO para confirmar la grafía española, no como significado.
-- Gate: source_gloss debe representar exactamente la misma entidad a ambos lados de ».
-- Gate: la etiqueta inglesa primaria de Wikidata debe coincidir exactamente con esa entidad.
-- Gate: similitud fonética conservadora inglés/español >= {MIN_NAME_SIMILARITY:.2f}.
-- Gate: la etiqueta española debe aparecer como frase completa en >= 2 fuentes españolas verificadas.
-- Política futura: insert-only + ON CONFLICT DO NOTHING.
-- Reversión exacta si se activa:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = '{batch_id}';

with map(tipnr_id, anchor_ref, wikidata_id, english_label, display_gloss_es, source_uri, source_revision, name_similarity) as (
 values
{values}
), evidence as (
 select
   map.*,
   count(distinct v.source_id) as spanish_anchor_sources
 from map
 join public.biblical_verse_texts v
   on v.book_code = upper(split_part(map.anchor_ref,'.',1))
  and v.chapter = split_part(map.anchor_ref,'.',2)::int
  and v.verse = split_part(map.anchor_ref,'.',3)::int
 join public.biblical_sources s
   on s.id = v.source_id
  and s.language = 'spa'
  and s.license_status = 'verified'
  and s.enabled = true
 where position(
   ' ' || btrim(regexp_replace(lower(map.display_gloss_es),'[^[:alpha:]]+',' ','g')) || ' '
   in
   ' ' || btrim(regexp_replace(lower(v.original_text),'[^[:alpha:]]+',' ','g')) || ' '
 ) > 0
 group by map.tipnr_id,map.anchor_ref,map.wikidata_id,map.english_label,map.display_gloss_es,map.source_uri,map.source_revision,map.name_similarity
), eligible as (
 select
   e.id as lexical_entry_id,
   e.strong_number,
   e.source_gloss,
   evidence.*
 from public.biblical_lexical_entries e
 join evidence on evidence.tipnr_id =
   btrim(split_part(split_part(e.source_gloss,'»',2),'@',1)) || '_' ||
   substring(split_part(e.source_gloss,'@',2) from '[123]?[A-Za-z]{{2,3}}[.][0-9]+[.][0-9]+')
 left join public.biblical_hebrew_spanish_glosses g on g.lexical_entry_id = e.id
 where e.language = 'hebrew'
   and e.review_status = 'approved'
   and e.enabled = true
   and e.display_gloss_es is null
   and g.lexical_entry_id is null
   and lower(regexp_replace(btrim(split_part(e.source_gloss,'»',1)), '[^[:alnum:]]+', '', 'g')) =
       lower(regexp_replace(btrim(split_part(split_part(e.source_gloss,'»',2),'@',1)), '[^[:alnum:]]+', '', 'g'))
   and lower(regexp_replace(btrim(evidence.english_label), '[^[:alnum:]]+', '', 'g')) =
       lower(regexp_replace(btrim(split_part(split_part(e.source_gloss,'»',2),'@',1)), '[^[:alnum:]]+', '', 'g'))
   and evidence.name_similarity >= {MIN_NAME_SIMILARITY:.2f}
   and evidence.spanish_anchor_sources >= 2
)
insert into public.biblical_hebrew_spanish_glosses (
 lexical_entry_id, display_gloss_es, alternative_glosses_es, confidence,
 derivation_method, source_gloss_snapshot, status, provenance
)
select
 lexical_entry_id,
 display_gloss_es,
 '{{}}'::text[],
 99,
 'tipnr_wikidata_spanish_anchor_similarity_safe_v4',
 source_gloss,
 'verified_derived',
 jsonb_build_object(
   'phase','FASE_H_BLOQUE_3',
   'batch_id','{batch_id}',
   'source_identity','STEPBible TIPNR',
   'source_identity_license','CC BY 4.0',
   'wikidata_id',wikidata_id,
   'wikidata_uri',source_uri,
   'wikidata_license','CC0-1.0',
   'wikidata_revision',source_revision,
   'english_identity_label',english_label,
   'anchor_reference',anchor_ref,
   'spanish_anchor_sources',spanish_anchor_sources,
   'spanish_anchor_sources_minimum',2,
   'name_similarity',name_similarity,
   'name_similarity_minimum',{MIN_NAME_SIMILARITY:.2f},
   'exact_source_entity',true,
   'exact_wikidata_primary_label',true,
   'anchor_used_for_name_spelling_only',true,
   'context_used_as_meaning',false,
   'rv1909_used_as_meaning',false,
   'strong_number',strong_number
 )
from eligible
on conflict (lexical_entry_id) do nothing;
"""


def self_test() -> None:
    sample = """with map(...) as (\n  ('Aaron_Exo.4.14','Q51676','Aaron','Aarón','https://www.wikidata.org/entity/Q51676','wikidata-lastrevid:123'),\n  ('Haran_Gen.11.26','Q1199156','Haran','Taré','https://www.wikidata.org/entity/Q1199156','wikidata-lastrevid:456'),\n  ('Bathsheba_2Sa.11.3','Q272277','Bathsheba','Betsabé','https://www.wikidata.org/entity/Q272277','wikidata-lastrevid:789')\n)"""
    rows = parse_rows(sample)
    assert len(rows) == 3
    accepted, rejected = filter_similarity(rows)
    assert {row["tipnr_id"] for row in accepted} == {"Aaron_Exo.4.14", "Bathsheba_2Sa.11.3"}
    assert {row["tipnr_id"] for row in rejected} == {"Haran_Gen.11.26"}
    assert name_similarity("Hezekiah", "Ezequías") >= MIN_NAME_SIMILARITY
    assert name_similarity("Haran", "Taré") < MIN_NAME_SIMILARITY
    sql = render_chunk(accepted, 1)
    assert "spanish_anchor_sources >= 2" in sql
    assert "evidence.name_similarity >= 0.55" in sql
    assert "exact_source_entity',true" in sql
    assert "exact_wikidata_primary_label',true" in sql
    assert "context_used_as_meaning',false" in sql
    assert "on conflict (lexical_entry_id) do nothing" in sql
    print("tipnr safe-v4 chunks self-test OK")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-sql", type=Path)
    parser.add_argument("--output-dir", type=Path)
    parser.add_argument("--audit", type=Path)
    parser.add_argument("--chunk-size", type=int, default=40)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return 0
    if not all([args.input_sql, args.output_dir, args.audit]):
        parser.error("Se requieren --input-sql, --output-dir y --audit")
    if args.chunk_size < 1 or args.chunk_size > 80:
        parser.error("--chunk-size debe estar entre 1 y 80")

    input_rows = parse_rows(args.input_sql.read_text(encoding="utf-8"))
    if not input_rows:
        raise SystemExit("No se encontraron filas TIPNR/Wikidata en el borrador")
    rows, rejected = filter_similarity(input_rows)
    if not rows:
        raise SystemExit("Ningún candidato superó el gate de similitud")

    args.output_dir.mkdir(parents=True, exist_ok=True)
    for old in args.output_dir.glob("fase_h_nombres_wikidata_safe_v4_chunk_*.sql"):
        old.unlink()

    files: list[str] = []
    for offset in range(0, len(rows), args.chunk_size):
        index = offset // args.chunk_size + 1
        path = args.output_dir / f"fase_h_nombres_wikidata_safe_v4_chunk_{index:03d}.sql"
        path.write_text(render_chunk(rows[offset:offset + args.chunk_size], index), encoding="utf-8")
        files.append(str(path))

    audit = {
        "phase": "FASE_H_BLOQUE_3",
        "status": "draft_only_not_applied",
        "input_candidates": len(input_rows),
        "similarity_safe_candidates": len(rows),
        "excluded_low_similarity": len(rejected),
        "minimum_name_similarity": MIN_NAME_SIMILARITY,
        "chunk_size": args.chunk_size,
        "chunks": len(files),
        "files": files,
        "database_gate": {
            "exact_source_entity_required": True,
            "exact_wikidata_primary_label_required": True,
            "minimum_name_similarity": MIN_NAME_SIMILARITY,
            "spanish_verified_sources_at_anchor_minimum": 2,
            "full_phrase_boundary_normalization": True,
            "anchor_used_for_name_spelling_only": True,
            "context_used_as_meaning": False,
            "insert_only": True,
            "on_conflict_do_nothing": True,
        },
        "rejected_low_similarity_sample": [
            {
                "tipnr_id": row["tipnr_id"],
                "english_label": row["english_label"],
                "spanish_label": row["spanish_label"],
                "name_similarity": row["name_similarity"],
            }
            for row in rejected[:30]
        ],
    }
    args.audit.parent.mkdir(parents=True, exist_ok=True)
    args.audit.write_text(json.dumps(audit, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(audit, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
