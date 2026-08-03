-- FASE D · Bloque 4
-- MIGRACIÓN ACTIVA. Generaliza el importador validado de Abdías para aceptar únicamente OBA y RUT.
-- Deriva la definición desde la función activa previamente validada y aborta si su huella cambió.

do $migration$
declare
  v_definition text;
  v_definition_sha256 text;
  v_old_contract constant text := $old$
  if v_reference_count<>21 or v_visible_word_count<>291 or v_occurrence_count<>434
     or v_lexical_count<>184 or v_variant_row_count<>2 or v_variant_count<>3 then
    raise exception 'Conteos piloto de Obadías inesperados';
  end if;
$old$;
  v_new_contract constant text := $new$
  if not (
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
$new$;
  v_variant_check constant text := $variant$
  if exists(
    select 1 from jsonb_array_elements(p_payload->'variants') variant
    where variant->>'reading_type' not in ('substitution','addition','omission','transposition','orthographic')
       or variant->>'content_hash' !~ '^[0-9a-f]{64}$'
  ) then raise exception 'Variantes inválidas'; end if;
$variant$;
  v_ruth_qere_check constant text := $qere$

  if v_book_code='RUT' and (
    (select count(*) from jsonb_array_elements(p_payload->'variants') variant
      where (variant->>'chapter')::integer=3
        and (variant->>'verse')::integer=12
        and variant->>'reading_type'='addition'
        and variant->>'base_reading' is null
        and variant->>'variant_reading'='אִם'
        and variant->>'anchor_word_index' is null
        and variant->'witnesses'='["K"]'::jsonb)=1
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
$qere$;
begin
  select pg_get_functiondef('internal.import_stepbible_tahot_payload(jsonb,jsonb)'::regprocedure)
    into v_definition;

  v_definition_sha256 := encode(
    extensions.digest(convert_to(v_definition,'UTF8'),'sha256'),
    'hex'
  );

  if v_definition_sha256 <> 'a6c99f4a12dd9fc33a5df23eaa3165c71b93799e3001d257deeb2a77d06c624c' then
    raise exception 'La función TAHOT activa no coincide con la versión base validada: %',v_definition_sha256;
  end if;

  if (length(v_definition)-length(replace(v_definition,v_old_contract,'')))/length(v_old_contract) <> 1 then
    raise exception 'Contrato rígido de Abdías no encontrado exactamente una vez';
  end if;
  if (length(v_definition)-length(replace(v_definition,v_variant_check,'')))/length(v_variant_check) <> 1 then
    raise exception 'Validador de variantes no encontrado exactamente una vez';
  end if;

  v_definition := replace(v_definition,v_old_contract,v_new_contract);
  v_definition := replace(v_definition,v_variant_check,v_variant_check||v_ruth_qere_check);
  execute v_definition;

  select pg_get_functiondef('internal.import_stepbible_tahot_payload(jsonb,jsonb)'::regprocedure)
    into v_definition;

  if strpos(v_definition,'Contrato TAHOT no autorizado para %')=0
     or strpos(v_definition,'Omisión Qere inválida para Rut 3:12')=0
     or strpos(v_definition,'Conteos piloto de Obadías inesperados')<>0 then
    raise exception 'La generalización del importador TAHOT no quedó instalada correctamente';
  end if;
end
$migration$;

revoke all on function internal.import_stepbible_tahot_payload(jsonb,jsonb)
  from public,anon,authenticated;
grant execute on function internal.import_stepbible_tahot_payload(jsonb,jsonb)
  to service_role;
