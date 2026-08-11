-- FASE D — Cobertura Bíblica Integral
-- TAHOT contiene 10 identificadores Hdddd[v-z] válidos y dos etiquetas de instancia #n.
-- Strong sigue siendo Hdddd. No modifica RLS.

alter table public.biblical_lexical_entries
  drop constraint if exists biblical_lexical_entries_lexical_id_format;

alter table public.biblical_lexical_entries
  add constraint biblical_lexical_entries_lexical_id_format
  check (lexical_id ~ '^[GH][0-9]{4}[A-Za-z]?$');

-- Parchea de forma determinista la función creada por la migración anterior.
-- La secuencia de migraciones garantiza que v4 exista antes de este bloque.
do $patch$
declare
  v_definition text;
  v_original text;
begin
  select pg_get_functiondef('internal.import_stepbible_tahot_core_v4(text,text[])'::regprocedure)
  into v_definition;
  v_original := v_definition;

  v_definition := replace(
    v_definition,
    'split_part(expanded_core,''='',1) expanded_id',
    'regexp_replace(split_part(expanded_core,''='',1),''#[0-9]+$'','''') expanded_id'
  );
  v_definition := replace(
    v_definition,
    'lexical_id !~ ''^H[0-9]{4}[A-Z]?$''',
    'lexical_id !~ ''^H[0-9]{4}[A-Za-z]?$'''
  );
  v_definition := replace(v_definition, 'tahot-core-v4', 'tahot-core-v4.1');
  v_definition := replace(v_definition, 'tahot-occurrence-v4', 'tahot-occurrence-v4.1');
  v_definition := replace(v_definition, 'tahot-verse-v4', 'tahot-verse-v4.1');
  v_definition := replace(v_definition, 'tahot-direct-core-v4', 'tahot-direct-core-v4.1');

  if v_definition = v_original then
    raise exception 'No se aplicó ningún parche al importador TAHOT v4';
  end if;
  if position('^[GH][0-9]{4}[A-Za-z]?$' in pg_get_constraintdef((select oid from pg_constraint where conrelid='public.biblical_lexical_entries'::regclass and conname='biblical_lexical_entries_lexical_id_format'))) = 0 then
    raise exception 'La restricción lexical_id no quedó ampliada';
  end if;

  execute v_definition;
end
$patch$;
