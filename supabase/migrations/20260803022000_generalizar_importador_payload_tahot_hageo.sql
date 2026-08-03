-- FASE D · Bloque 4
-- MIGRACIÓN ACTIVA. Amplía el importador TAHOT validado para aceptar exactamente Hageo.
-- Verifica la huella de la función OBA/RUT y conserva ejecución exclusiva de service_role.

do $migration$
declare
  v_definition text;
  v_definition_sha256 text;
  v_old_contract constant text := $old$
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
    or
    (
      v_book_code='HAG'
      and v_step_code='Hag'
      and v_dataset='TAHOT Isa-Mal'
      and v_source_sha256='f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5'
      and v_package_sha256='bc8e1caebce9a2e55d34b3be4770f3591e430b3aa217208324dee1bdbdd54e38'
      and v_payload_sha256='db6510d6e971e672c2fac244b406ffd1f704ac49d4fc3b3bbca3b1c5cde71fa9'
      and v_reference_count=38 and v_visible_word_count=600
      and v_occurrence_count=911 and v_lexical_count=235
      and v_variant_row_count=2 and v_variant_count=3
    )
  ) then
    raise exception 'Contrato TAHOT no autorizado para %',v_book_code;
  end if;
$new$;
  v_ruth_qere_check constant text := $ruth$

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
$ruth$;
  v_haggai_variant_check constant text := $haggai$

  if v_book_code='HAG' and (
    (select count(*) from jsonb_array_elements(p_payload->'variants') variant
      where (variant->>'chapter')::integer=1
        and (variant->>'verse')::integer=8
        and (variant->>'anchor_word_index')::integer=9
        and variant->>'reading_type'='orthographic'
        and variant->>'base_reading'='וְאֶכָּבְדָ֖ה'
        and variant->>'variant_reading'='וְאֶכָּבְדָ֖'
        and variant->'witnesses'='["L"]'::jsonb)=1
    and
    (select count(*) from jsonb_array_elements(p_payload->'variants') variant
      where (variant->>'chapter')::integer=1
        and (variant->>'verse')::integer=8
        and (variant->>'anchor_word_index')::integer=9
        and variant->>'reading_type'='substitution'
        and variant->>'base_reading'='וְאֶכָּבְדָ֖ה'
        and variant->>'variant_reading'='וְאֶכָּבֵד'
        and variant->'witnesses'='["K"]'::jsonb)=1
    and
    (select count(*) from jsonb_array_elements(p_payload->'variants') variant
      where (variant->>'chapter')::integer=1
        and (variant->>'verse')::integer=10
        and (variant->>'anchor_word_index')::integer=5
        and variant->>'reading_type'='orthographic'
        and variant->>'base_reading'='שָמַ֖יִם'
        and variant->>'variant_reading'='שָׁמַ֖יִם'
        and variant->'witnesses'='["ABH"]'::jsonb)=1
    and not exists(
      select 1 from jsonb_array_elements(p_payload->'variants') variant
      where variant->>'reading_type' in ('addition','omission','transposition')
    )
  ) is not true then
    raise exception 'Variantes inválidas para Hageo';
  end if;
$haggai$;
begin
  select pg_get_functiondef('internal.import_stepbible_tahot_payload(jsonb,jsonb)'::regprocedure)
    into v_definition;

  v_definition_sha256 := encode(
    extensions.digest(convert_to(v_definition,'UTF8'),'sha256'),
    'hex'
  );

  if v_definition_sha256 <> 'dad481d9de705efc566dfa1beaa68cba99b85de069f241733183e33c3b04b381' then
    raise exception 'La función TAHOT activa no coincide con la versión OBA/RUT validada: %',v_definition_sha256;
  end if;

  if (length(v_definition)-length(replace(v_definition,v_old_contract,'')))/length(v_old_contract) <> 1 then
    raise exception 'Contrato OBA/RUT no encontrado exactamente una vez';
  end if;
  if (length(v_definition)-length(replace(v_definition,v_ruth_qere_check,'')))/length(v_ruth_qere_check) <> 1 then
    raise exception 'Validador Qere de Rut no encontrado exactamente una vez';
  end if;

  v_definition := replace(v_definition,v_old_contract,v_new_contract);
  v_definition := replace(
    v_definition,
    v_ruth_qere_check,
    v_ruth_qere_check||v_haggai_variant_check
  );
  execute v_definition;

  select pg_get_functiondef('internal.import_stepbible_tahot_payload(jsonb,jsonb)'::regprocedure)
    into v_definition;

  if strpos(v_definition,"v_book_code='HAG'")=0
     or strpos(v_definition,'Variantes inválidas para Hageo')=0
     or strpos(v_definition,'Omisión Qere inválida para Rut 3:12')=0 then
    raise exception 'La ampliación del importador TAHOT para Hageo no quedó instalada';
  end if;
end
$migration$;

revoke all on function internal.import_stepbible_tahot_payload(jsonb,jsonb)
  from public,anon,authenticated;
grant execute on function internal.import_stepbible_tahot_payload(jsonb,jsonb)
  to service_role;
