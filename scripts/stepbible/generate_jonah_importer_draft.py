#!/usr/bin/env python3
"""Deriva el borrador del importador de Jonás desde la migración activa de Nahúm."""
from __future__ import annotations

import argparse
from pathlib import Path

BASE_FUNCTION_SHA256 = "69045240e658995cd0e1ba3557e54a2700b623078b36125e73ed1ada64f5139c"

JONAH_CONTRACT = """    or
    (
      v_book_code='JON'
      and v_step_code='Jon'
      and v_dataset='TAHOT Isa-Mal'
      and v_source_sha256='f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5'
      and v_package_sha256='083b869fe7d10493deaeee392babd9811e9dffb91f0db816d2f21a22b2135915'
      and v_payload_sha256='f986bdd833c86f9f239ddd26e4594aeb33d48a89f72fb05dcc853dbd1d512fc4'
      and v_reference_count=48 and v_visible_word_count=688
      and v_occurrence_count=1080 and v_lexical_count=288
      and v_variant_row_count=0 and v_variant_count=0
    )
"""

JONAH_VARIANT_CHECK = """
  if v_book_code='JON' and jsonb_array_length(p_payload->'variants')<>0 then
    raise exception 'Variantes inesperadas para Jonás';
  end if;
"""


def extract_block(text: str, start: str, end: str) -> str:
    if text.count(start) != 1:
        raise RuntimeError(f"Ancla inicial inesperada: {start!r}")
    tail = text.split(start, 1)[1]
    if tail.count(end) != 1:
        raise RuntimeError(f"Ancla final inesperada: {end!r}")
    return tail.split(end, 1)[0]


def build_draft(active_text: str) -> str:
    current_contract = extract_block(
        active_text,
        "  v_new_contract constant text := $new$\n",
        "$new$;\n",
    )
    nahum_check = extract_block(
        active_text,
        "  v_nahum_variant_check constant text := $nahum$\n",
        "$nahum$;\n",
    )

    contract_end = "  ) then\n    raise exception 'Contrato TAHOT no autorizado para %',v_book_code;\n  end if;\n"
    if current_contract.count(contract_end) != 1:
        raise RuntimeError("No se encontró el cierre único del contrato OBA/RUT/HAG/NAM")
    new_contract = current_contract.replace(contract_end, JONAH_CONTRACT + contract_end, 1)

    return f"""-- FASE D · Bloque 4
-- BORRADOR NO ACTIVO. Amplía el importador validado para aceptar exactamente Jonás.
-- Derivado de la migración activa de Nahúm y protegido por SHA-256 de la función.

do $migration$
declare
  v_definition text;
  v_definition_sha256 text;
  v_old_contract constant text := $old$
{current_contract}$old$;
  v_new_contract constant text := $new$
{new_contract}$new$;
  v_nahum_variant_check constant text := $nahum$
{nahum_check}$nahum$;
  v_jonah_variant_check constant text := $jonah$
{JONAH_VARIANT_CHECK}$jonah$;
begin
  select pg_get_functiondef('internal.import_stepbible_tahot_payload(jsonb,jsonb)'::regprocedure)
    into v_definition;

  v_definition_sha256 := encode(
    extensions.digest(convert_to(v_definition,'UTF8'),'sha256'),
    'hex'
  );

  if v_definition_sha256 <> '{BASE_FUNCTION_SHA256}' then
    raise exception 'La función TAHOT activa no coincide con la versión OBA/RUT/HAG/NAM validada: %',v_definition_sha256;
  end if;

  if (length(v_definition)-length(replace(v_definition,v_old_contract,'')))/length(v_old_contract) <> 1 then
    raise exception 'Contrato OBA/RUT/HAG/NAM no encontrado exactamente una vez';
  end if;
  if (length(v_definition)-length(replace(v_definition,v_nahum_variant_check,'')))/length(v_nahum_variant_check) <> 1 then
    raise exception 'Validador de Nahúm no encontrado exactamente una vez';
  end if;

  v_definition := replace(v_definition,v_old_contract,v_new_contract);
  v_definition := replace(
    v_definition,
    v_nahum_variant_check,
    v_nahum_variant_check||v_jonah_variant_check
  );
  execute v_definition;

  select pg_get_functiondef('internal.import_stepbible_tahot_payload(jsonb,jsonb)'::regprocedure)
    into v_definition;

  if strpos(v_definition,'v_book_code=''JON''')=0
     or strpos(v_definition,'Variantes inesperadas para Jonás')=0
     or strpos(v_definition,'Variantes inválidas para Nahúm')=0
     or strpos(v_definition,'Variantes inválidas para Hageo')=0
     or strpos(v_definition,'Omisión Qere inválida para Rut 3:12')=0 then
    raise exception 'La ampliación del importador TAHOT para Jonás no quedó instalada';
  end if;
end
$migration$;

revoke all on function internal.import_stepbible_tahot_payload(jsonb,jsonb)
  from public,anon,authenticated;
grant execute on function internal.import_stepbible_tahot_payload(jsonb,jsonb)
  to service_role;
"""


def self_test() -> None:
    synthetic_contract = (
        "  if not (\n"
        "    (v_book_code='NAM')\n"
        "  ) then\n"
        "    raise exception 'Contrato TAHOT no autorizado para %',v_book_code;\n"
        "  end if;\n"
    )
    synthetic = (
        "  v_new_contract constant text := $new$\n"
        + synthetic_contract
        + "$new$;\n"
        + "  v_nahum_variant_check constant text := $nahum$\n"
        + "  if v_book_code='NAM' then null; end if;\n"
        + "$nahum$;\n"
    )
    generated = build_draft(synthetic)
    for required in (
        "BORRADOR NO ACTIVO",
        "v_book_code='JON'",
        "Variantes inesperadas para Jonás",
        "Variantes inválidas para Nahúm",
        BASE_FUNCTION_SHA256,
    ):
        if required not in generated:
            raise RuntimeError(f"Borrador sintético incompleto: {required}")
    print("Auto-test del generador de importador de Jonás: OK")


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
    print(f"Borrador de Jonás generado: {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
