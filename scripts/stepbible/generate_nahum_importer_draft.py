#!/usr/bin/env python3
"""Deriva el borrador del importador de Nahúm desde la migración activa de Hageo."""
from __future__ import annotations

import argparse
from pathlib import Path

BASE_FUNCTION_SHA256 = "619b0249f70e6ac373256da724a89033cb3ecb566ad26f2ac9709ee0b6f9977d"

NAM_CONTRACT = """    or
    (
      v_book_code='NAM'
      and v_step_code='Nam'
      and v_dataset='TAHOT Isa-Mal'
      and v_source_sha256='f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5'
      and v_package_sha256='60e280a6d94abc8788b7cc9647e4dfa0f679e0a9708a1adf00be30abfc23b7f5'
      and v_payload_sha256='43a5ab1b8c9cf773e218c73eab3def49715ac7c0511a04ee9cae3990be4a8a99'
      and v_reference_count=47 and v_visible_word_count=558
      and v_occurrence_count=828 and v_lexical_count=387
      and v_variant_row_count=4 and v_variant_count=8
    )
"""

EXPECTED_VARIANTS_JSON = r'''[
  {"variant_key":"nam-1-3-04=Q(K)-orthographic","chapter":1,"verse":3,"anchor_word_index":4,"reading_type":"orthographic","base_reading":"וּגְדָל","variant_reading":"וּגְדָול־","witnesses":["L"],"content_hash":"9efe642d1d9a24992c94a52e80dc35d259c3faf9453875f976c25b3c20055d64"},
  {"variant_key":"nam-1-3-04=Q(K)-substitution","chapter":1,"verse":3,"anchor_word_index":4,"reading_type":"substitution","base_reading":"וּגְדָל","variant_reading":"וּגְדוֹל","witnesses":["K"],"content_hash":"768331bda59484864f4825dddfe73fcd814831ca06887015954888c266218cf8"},
  {"variant_key":"nam-1-15-17=Q(k)-orthographic","chapter":1,"verse":15,"anchor_word_index":17,"reading_type":"orthographic","base_reading":"לַֽעֲבָר","variant_reading":"לַֽעֲבָור־","witnesses":["L"],"content_hash":"dcec339d7811971e87221aaf0d5f572576deeaad3a398d1b885fbf4373efb762"},
  {"variant_key":"nam-1-15-17=Q(k)-substitution","chapter":1,"verse":15,"anchor_word_index":17,"reading_type":"substitution","base_reading":"לַֽעֲבָר","variant_reading":"לַעֲבוֹר","witnesses":["K"],"content_hash":"613a3dd58eb3ef5366b9c0e37b349381f4b78bc5941096612f407c76bb8b2540"},
  {"variant_key":"nam-2-5-04=Q(K)-orthographic","chapter":2,"verse":5,"anchor_word_index":4,"reading_type":"orthographic","base_reading":"בַּהֲלִֽיכָתָ֑ם","variant_reading":"בַּהֲלִֽכָותָ֑ם","witnesses":["L"],"content_hash":"eb49717fc623dfafd078f9d67574542ae9a41af22529d2b3e769fb55e634367d"},
  {"variant_key":"nam-2-5-04=Q(K)-substitution","chapter":2,"verse":5,"anchor_word_index":4,"reading_type":"substitution","base_reading":"בַּהֲלִֽיכָתָ֑ם","variant_reading":"בַהֲלִכוֹתָם","witnesses":["K"],"content_hash":"c60f300822ead99fb756d1427105eb9c00813db850d24187a9ad0f9137e99c46"},
  {"variant_key":"nam-3-3-14=Q(K)-orthographic","chapter":3,"verse":3,"anchor_word_index":14,"reading_type":"orthographic","base_reading":"וְכָשְׁל֖וּ","variant_reading":"יְכָשְׁל֖וּ","witnesses":["L"],"content_hash":"1b9369fc3a5e1d3b392f8dc14a0fb18fed6961aaf64efa8bb2d7c2c3e523d914"},
  {"variant_key":"nam-3-3-14=Q(K)-substitution","chapter":3,"verse":3,"anchor_word_index":14,"reading_type":"substitution","base_reading":"וְכָשְׁל֖וּ","variant_reading":"יִכְשְׁלוּ","witnesses":["K"],"content_hash":"b6b4657e955cd7c0097746d5dd2b0bd207772aa3fc7d5df37dcac4c5b0ac597c"}
]'''


def extract_block(text: str, start: str, end: str) -> str:
    if text.count(start) != 1:
        raise RuntimeError(f"Ancla inicial inesperada: {start!r}")
    tail = text.split(start, 1)[1]
    if tail.count(end) != 1:
        raise RuntimeError(f"Ancla final inesperada: {end!r}")
    return tail.split(end, 1)[0]


def build_draft(active_text: str) -> str:
    old_contract = extract_block(
        active_text,
        "  v_new_contract constant text := $new$\n",
        "$new$;\n",
    )
    haggai_check = extract_block(
        active_text,
        "  v_haggai_variant_check constant text := $haggai$\n",
        "$haggai$;\n",
    )
    contract_end = "  ) then\n    raise exception 'Contrato TAHOT no autorizado para %',v_book_code;\n  end if;\n"
    if old_contract.count(contract_end) != 1:
        raise RuntimeError("No se encontró el cierre único del contrato OBA/RUT/HAG")
    new_contract = old_contract.replace(contract_end, NAM_CONTRACT + contract_end, 1)

    nahum_check = f"""
  if v_book_code='NAM' and (
    (select jsonb_agg(
       jsonb_build_object(
         'variant_key',variant->>'variant_key',
         'chapter',(variant->>'chapter')::integer,
         'verse',(variant->>'verse')::integer,
         'anchor_word_index',(variant->>'anchor_word_index')::integer,
         'reading_type',variant->>'reading_type',
         'base_reading',variant->>'base_reading',
         'variant_reading',variant->>'variant_reading',
         'witnesses',variant->'witnesses',
         'content_hash',variant->>'content_hash'
       ) order by
         (variant->>'chapter')::integer,
         (variant->>'verse')::integer,
         variant->>'reading_type'
     ) from jsonb_array_elements(p_payload->'variants') variant)
       <> $expected${EXPECTED_VARIANTS_JSON}$expected$::jsonb
    or (select count(*) from jsonb_array_elements(p_payload->'variants') variant
        where variant->>'reading_type'='orthographic') <> 4
    or (select count(*) from jsonb_array_elements(p_payload->'variants') variant
        where variant->>'reading_type'='substitution') <> 4
    or exists(
      select 1 from jsonb_array_elements(p_payload->'variants') variant
      where variant->>'reading_type' in ('addition','omission','transposition')
         or variant->>'anchor_word_index' is null
    )
  ) then
    raise exception 'Variantes inválidas para Nahúm';
  end if;
"""

    return f"""-- FASE D · Bloque 4
-- BORRADOR NO ACTIVO. Amplía el importador validado para aceptar exactamente Nahúm.
-- Derivado de la migración activa de Hageo y protegido por SHA-256 de la función.

do $migration$
declare
  v_definition text;
  v_definition_sha256 text;
  v_old_contract constant text := $old$
{old_contract}$old$;
  v_new_contract constant text := $new$
{new_contract}$new$;
  v_haggai_variant_check constant text := $haggai$
{haggai_check}$haggai$;
  v_nahum_variant_check constant text := $nahum$
{nahum_check}$nahum$;
begin
  select pg_get_functiondef('internal.import_stepbible_tahot_payload(jsonb,jsonb)'::regprocedure)
    into v_definition;

  v_definition_sha256 := encode(
    extensions.digest(convert_to(v_definition,'UTF8'),'sha256'),
    'hex'
  );

  if v_definition_sha256 <> '{BASE_FUNCTION_SHA256}' then
    raise exception 'La función TAHOT activa no coincide con la versión OBA/RUT/HAG validada: %',v_definition_sha256;
  end if;

  if (length(v_definition)-length(replace(v_definition,v_old_contract,'')))/length(v_old_contract) <> 1 then
    raise exception 'Contrato OBA/RUT/HAG no encontrado exactamente una vez';
  end if;
  if (length(v_definition)-length(replace(v_definition,v_haggai_variant_check,'')))/length(v_haggai_variant_check) <> 1 then
    raise exception 'Validador de Hageo no encontrado exactamente una vez';
  end if;

  v_definition := replace(v_definition,v_old_contract,v_new_contract);
  v_definition := replace(
    v_definition,
    v_haggai_variant_check,
    v_haggai_variant_check||v_nahum_variant_check
  );
  execute v_definition;

  select pg_get_functiondef('internal.import_stepbible_tahot_payload(jsonb,jsonb)'::regprocedure)
    into v_definition;

  if strpos(v_definition,'v_book_code=''NAM''')=0
     or strpos(v_definition,'Variantes inválidas para Nahúm')=0
     or strpos(v_definition,'Variantes inválidas para Hageo')=0
     or strpos(v_definition,'Omisión Qere inválida para Rut 3:12')=0 then
    raise exception 'La ampliación del importador TAHOT para Nahúm no quedó instalada';
  end if;
end
$migration$;

revoke all on function internal.import_stepbible_tahot_payload(jsonb,jsonb)
  from public,anon,authenticated;
grant execute on function internal.import_stepbible_tahot_payload(jsonb,jsonb)
  to service_role;
"""


def self_test() -> None:
    synthetic = "  v_new_contract constant text := $new$\n" + (
        "  if not (\n    (v_book_code='HAG')\n  ) then\n"
        "    raise exception 'Contrato TAHOT no autorizado para %',v_book_code;\n"
        "  end if;\n"
    ) + "$new$;\n  v_haggai_variant_check constant text := $haggai$\n" + (
        "  if v_book_code='HAG' then null; end if;\n"
    ) + "$haggai$;\n"
    generated = build_draft(synthetic)
    for required in (
        "BORRADOR NO ACTIVO",
        "v_book_code='NAM'",
        "Variantes inválidas para Nahúm",
        "(variant->>'chapter')::integer",
        BASE_FUNCTION_SHA256,
    ):
        if required not in generated:
            raise RuntimeError(f"Borrador sintético incompleto: {required}")
    print("Auto-test del generador de importador de Nahúm: OK")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--active", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return 0
    if args.active is None or args.output is None:
        parser.error("--active y --output son obligatorios")
    draft = build_draft(args.active.read_text(encoding="utf-8"))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(draft, encoding="utf-8")
    print(f"Borrador de Nahúm generado: {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
