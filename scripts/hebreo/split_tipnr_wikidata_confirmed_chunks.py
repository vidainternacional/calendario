#!/usr/bin/env python3
"""Divide el borrador TIPNR/Wikidata en lotes pequeños con gate de ortografía española.

No conecta a Supabase. Cada SQL generado sigue siendo un BORRADOR NO ACTIVO.
La futura inserción queda condicionada a que:
- la entrada fuente represente exactamente la misma entidad a ambos lados de `»`;
- la etiqueta inglesa primaria de Wikidata coincida exactamente con esa entidad;
- la etiqueta española propuesta aparezca como frase completa en al menos dos
  fuentes bíblicas españolas verificadas, exactamente en la referencia ancla TIPNR.

Ese versículo se usa únicamente para confirmar la grafía/identidad del nombre,
nunca como fuente del significado léxico.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

TUPLE_RE = re.compile(
    r"^\s*\('((?:''|[^'])*)','((?:''|[^'])*)','((?:''|[^'])*)','((?:''|[^'])*)','((?:''|[^'])*)','((?:''|[^'])*)'\),?\s*$"
)
ANCHOR_RE = re.compile(r"_((?:[123])?[A-Za-z]{2,3}\.\d+\.\d+)$")


def unescape_sql(value: str) -> str:
    return value.replace("''", "'")


def sql_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


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


def render_chunk(rows: list[dict[str, str]], index: int) -> str:
    batch_id = f"fase_h_es_nombres_wikidata_anchor2_{index:03d}_20260820"
    values = ",\n".join(
        "  (" + ",".join([
            sql_literal(row["tipnr_id"]),
            sql_literal(row["anchor_ref"]),
            sql_literal(row["wikidata_id"]),
            sql_literal(row["english_label"]),
            sql_literal(row["spanish_label"]),
            sql_literal(row["source_uri"]),
            sql_literal(row["source_revision"]),
        ]) + ")"
        for row in rows
    )
    return f"""-- BORRADOR NO ACTIVO — FASE H / Bloque 3 — nombres propios TIPNR + Wikidata + gate bíblico español.
-- Chunk {index:03d}; candidatos={len(rows)}.
-- No aplicar sin auditoría read-only del lote.
-- La referencia ancla se usa SOLO para confirmar la grafía española, no como significado.
-- Gate: source_gloss debe representar exactamente la misma entidad a ambos lados de ».
-- Gate: la etiqueta inglesa primaria de Wikidata debe coincidir exactamente con esa entidad.
-- Gate: la etiqueta española debe aparecer como frase completa en >= 2 fuentes españolas verificadas.
-- Política futura: insert-only + ON CONFLICT DO NOTHING.
-- Reversión exacta si se activa:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = '{batch_id}';

with map(tipnr_id, anchor_ref, wikidata_id, english_label, display_gloss_es, source_uri, source_revision) as (
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
 group by map.tipnr_id,map.anchor_ref,map.wikidata_id,map.english_label,map.display_gloss_es,map.source_uri,map.source_revision
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
 'tipnr_wikidata_spanish_anchor_2source_exact_primary_v3',
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
    sample = """with map(...) as (\n  ('Aaron_Exo.4.14','Q51676','Aaron','Aarón','https://www.wikidata.org/entity/Q51676','wikidata-lastrevid:123'),\n  ('Absalom_2Sa.3.3','Q205372','Absalom','Absalón','https://www.wikidata.org/entity/Q205372','wikidata-lastrevid:456')\n)"""
    rows = parse_rows(sample)
    assert len(rows) == 2
    assert rows[0]["anchor_ref"] == "Exo.4.14"
    sql = render_chunk(rows, 1)
    assert "spanish_anchor_sources >= 2" in sql
    assert "split_part(e.source_gloss,'»',1)" in sql
    assert "evidence.english_label" in sql
    assert "exact_source_entity',true" in sql
    assert "exact_wikidata_primary_label',true" in sql
    assert "anchor_used_for_name_spelling_only',true" in sql
    assert "context_used_as_meaning',false" in sql
    assert "on conflict (lexical_entry_id) do nothing" in sql
    print("tipnr confirmed chunks self-test OK")


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

    rows = parse_rows(args.input_sql.read_text(encoding="utf-8"))
    if not rows:
        raise SystemExit("No se encontraron filas TIPNR/Wikidata en el borrador")
    args.output_dir.mkdir(parents=True, exist_ok=True)
    for old in args.output_dir.glob("fase_h_nombres_wikidata_anchor2_chunk_*.sql"):
        old.unlink()

    files: list[str] = []
    for offset in range(0, len(rows), args.chunk_size):
        index = offset // args.chunk_size + 1
        path = args.output_dir / f"fase_h_nombres_wikidata_anchor2_chunk_{index:03d}.sql"
        path.write_text(render_chunk(rows[offset:offset + args.chunk_size], index), encoding="utf-8")
        files.append(str(path))

    audit = {
        "phase": "FASE_H_BLOQUE_3",
        "status": "draft_only_not_applied",
        "candidates": len(rows),
        "chunk_size": args.chunk_size,
        "chunks": len(files),
        "files": files,
        "database_gate": {
            "exact_source_entity_required": True,
            "exact_wikidata_primary_label_required": True,
            "spanish_verified_sources_at_anchor_minimum": 2,
            "full_phrase_boundary_normalization": True,
            "anchor_used_for_name_spelling_only": True,
            "context_used_as_meaning": False,
            "insert_only": True,
            "on_conflict_do_nothing": True,
        },
    }
    args.audit.parent.mkdir(parents=True, exist_ok=True)
    args.audit.write_text(json.dumps(audit, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(audit, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
