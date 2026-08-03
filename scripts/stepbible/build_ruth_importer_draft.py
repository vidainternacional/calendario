#!/usr/bin/env python3
"""Deriva un borrador TAHOT generalizado desde la migración activa de Abdías."""
from __future__ import annotations

from pathlib import Path

SOURCE = Path("supabase/migrations/20260802232000_importador_payload_tahot_obadias.sql")
TARGET = Path("supabase/migration-drafts/20260803003000_importador_payload_tahot_rut.sql")

OLD_HEADER = "-- MIGRACIÓN ACTIVA VALIDADA. Importador restringido a service_role."
NEW_HEADER = "-- BORRADOR NO ACTIVO. Generalización validada fuera de producción para OBA y RUT."

OLD_CONTRACT = """  if v_reference_count<>21 or v_visible_word_count<>291 or v_occurrence_count<>434
     or v_lexical_count<>184 or v_variant_row_count<>2 or v_variant_count<>3 then
    raise exception 'Conteos piloto de Obadías inesperados';
  end if;
"""

NEW_CONTRACT = """  if not (
    (
      v_book_code='OBA'
      and v_step_code='Oba'
      and v_dataset='TAHOT Isa-Mal'
      and v_source_sha256='f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5'
      and v_package_sha256='b49dee68303e243c0c2ef4ff3366cbd955a4a8a9b14114eb761a8f174e25940e'
      and v_payload_sha256='502eade2003802940dd79d386073e4b9817ae5f0668fd341b84ae6ea9e828652'
      and v_reference_count=21 and v_visible_word_count=291
      and v_occurrence_count=434 and v_lexical_count=184
      and v_variant_row_count=2 and v_variant_count=3
    )
    or
    (
      v_book_code='RUT'
      and v_step_code='Rut'
      and v_dataset='TAHOT Jos-Est'
      and v_source_sha256='195fee1dc3653bab33701f170734eb894ed647c10cd08cc61749375fe8b73775'
      and v_package_sha256='80a79abd038de9159a90e7aa572f1d4ff6a0c7f1ca8bfb4195875ffd5a7ca20c'
      and v_payload_sha256='d88763cef355dc05d3251438f3adce08a99feed389b82502e8c8f1263d7b79ee'
      and v_reference_count=85 and v_visible_word_count=1293
      and v_occurrence_count=2026 and v_lexical_count=373
      and v_variant_row_count=19 and v_variant_count=29
    )
  ) then
    raise exception 'Contrato TAHOT no autorizado para %',v_book_code;
  end if;
"""

VARIANT_CHECK = """  if exists(
    select 1 from jsonb_array_elements(p_payload->'variants') variant
    where variant->>'reading_type' not in ('substitution','addition','omission','transposition','orthographic')
       or variant->>'content_hash' !~ '^[0-9a-f]{64}$'
  ) then raise exception 'Variantes inválidas'; end if;
"""

RUTH_QERE_CHECK = VARIANT_CHECK + """

  if v_book_code='RUT' and (
    (select count(*) from jsonb_array_elements(p_payload->'variants') variant
      where (variant->>'chapter')::integer=3
        and (variant->>'verse')::integer=12
        and variant->>'reading_type'='addition'
        and variant->>'base_reading' is null
        and variant->>'variant_reading'='אִם'
        and variant->>'anchor_word_index' is null
        and variant->'witnesses'='[\"K\"]'::jsonb)=1
    and not exists(
      select 1
      from jsonb_array_elements(p_payload->'occurrences') occurrence
      join jsonb_array_elements(p_payload->'variants') variant
        on variant->>'source_line_sha256'=occurrence->>'source_line_sha256'
      where (variant->>'chapter')::integer=3
        and (variant->>'verse')::integer=12
        and variant->>'reading_type'='addition'
    )
  ) is not true then
    raise exception 'Omisión Qere inválida para Rut 3:12';
  end if;
"""


def build() -> str:
    text = SOURCE.read_text(encoding="utf-8")
    if text.count(OLD_HEADER) != 1:
        raise RuntimeError("Encabezado fuente inesperado")
    if text.count(OLD_CONTRACT) != 1:
        raise RuntimeError("Contrato rígido de Abdías no encontrado una sola vez")
    if text.count(VARIANT_CHECK) != 1:
        raise RuntimeError("Bloque de validación de variantes inesperado")
    text = text.replace(OLD_HEADER, NEW_HEADER, 1)
    text = text.replace(OLD_CONTRACT, NEW_CONTRACT, 1)
    text = text.replace(VARIANT_CHECK, RUTH_QERE_CHECK, 1)
    if "supabase/migrations/20260802232000" in text:
        raise RuntimeError("El borrador no debe contener rutas activas")
    return text


def self_test() -> None:
    sample = OLD_CONTRACT
    assert "Conteos piloto de Obadías" in sample
    assert "v_book_code='RUT'" in NEW_CONTRACT
    assert "b49dee68303e243c0c2ef4ff3366cbd955a4a8a9b14114eb761a8f174e25940e" in NEW_CONTRACT
    assert "variant_reading'='אִם'" in RUTH_QERE_CHECK
    print("Auto-test del generador de importador: OK")


def main() -> int:
    self_test()
    text = build()
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    TARGET.write_text(text, encoding="utf-8")
    print(TARGET)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
