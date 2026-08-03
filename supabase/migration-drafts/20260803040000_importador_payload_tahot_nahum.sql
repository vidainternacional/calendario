-- FASE D · Bloque 4
-- BORRADOR NO ACTIVO. Amplía el importador validado para aceptar exactamente Nahúm.
-- Derivado de la migración activa de Hageo y protegido por SHA-256 de la función.

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
    or
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
  ) then
    raise exception 'Contrato TAHOT no autorizado para %',v_book_code;
  end if;
$new$;
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
  v_nahum_variant_check constant text := $nahum$

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
       <> $expected$[
  {"variant_key":"nam-1-3-04=Q(K)-orthographic","chapter":1,"verse":3,"anchor_word_index":4,"reading_type":"orthographic","base_reading":"וּגְדָל","variant_reading":"וּגְדָול־","witnesses":["L"],"content_hash":"9efe642d1d9a24992c94a52e80dc35d259c3faf9453875f976c25b3c20055d64"},
  {"variant_key":"nam-1-3-04=Q(K)-substitution","chapter":1,"verse":3,"anchor_word_index":4,"reading_type":"substitution","base_reading":"וּגְדָל","variant_reading":"וּגְדוֹל","witnesses":["K"],"content_hash":"768331bda59484864f4825dddfe73fcd814831ca06887015954888c266218cf8"},
  {"variant_key":"nam-1-15-17=Q(k)-orthographic","chapter":1,"verse":15,"anchor_word_index":17,"reading_type":"orthographic","base_reading":"לַֽעֲבָר","variant_reading":"לַֽעֲבָור־","witnesses":["L"],"content_hash":"dcec339d7811971e87221aaf0d5f572576deeaad3a398d1b885fbf4373efb762"},
  {"variant_key":"nam-1-15-17=Q(k)-substitution","chapter":1,"verse":15,"anchor_word_index":17,"reading_type":"substitution","base_reading":"לַֽעֲבָר","variant_reading":"לַעֲבוֹר","witnesses":["K"],"content_hash":"613a3dd58eb3ef5366b9c0e37b349381f4b78bc5941096612f407c76bb8b2540"},
  {"variant_key":"nam-2-5-04=Q(K)-orthographic","chapter":2,"verse":5,"anchor_word_index":4,"reading_type":"orthographic","base_reading":"בַּהֲלִֽיכָתָ֑ם","variant_reading":"בַּהֲלִֽכָותָ֑ם","witnesses":["L"],"content_hash":"eb49717fc623dfafd078f9d67574542ae9a41af22529d2b3e769fb55e634367d"},
  {"variant_key":"nam-2-5-04=Q(K)-substitution","chapter":2,"verse":5,"anchor_word_index":4,"reading_type":"substitution","base_reading":"בַּהֲלִֽיכָתָ֑ם","variant_reading":"בַהֲלִכוֹתָם","witnesses":["K"],"content_hash":"c60f300822ead99fb756d1427105eb9c00813db850d24187a9ad0f9137e99c46"},
  {"variant_key":"nam-3-3-14=Q(K)-orthographic","chapter":3,"verse":3,"anchor_word_index":14,"reading_type":"orthographic","base_reading":"וְכָשְׁל֖וּ","variant_reading":"יְכָשְׁל֖וּ","witnesses":["L"],"content_hash":"1b9369fc3a5e1d3b392f8dc14a0fb18fed6961aaf64efa8bb2d7c2c3e523d914"},
  {"variant_key":"nam-3-3-14=Q(K)-substitution","chapter":3,"verse":3,"anchor_word_index":14,"reading_type":"substitution","base_reading":"וְכָשְׁל֖וּ","variant_reading":"יִכְשְׁלוּ","witnesses":["K"],"content_hash":"b6b4657e955cd7c0097746d5dd2b0bd207772aa3fc7d5df37dcac4c5b0ac597c"}
]$expected$::jsonb
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
$nahum$;
begin
  select pg_get_functiondef('internal.import_stepbible_tahot_payload(jsonb,jsonb)'::regprocedure)
    into v_definition;

  v_definition_sha256 := encode(
    extensions.digest(convert_to(v_definition,'UTF8'),'sha256'),
    'hex'
  );

  if v_definition_sha256 <> '619b0249f70e6ac373256da724a89033cb3ecb566ad26f2ac9709ee0b6f9977d' then
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
