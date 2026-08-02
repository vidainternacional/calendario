-- FASE D · Bloque 4
-- Normaliza Daniel y Ezequiel y evita secciones activas solapadas futuras.

update public.biblical_context_units
set enabled = false,
    review_status = 'rejected',
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'disabled_reason', 'overlapping_noncanonical_scope',
      'disabled_at', now()
    ),
    updated_at = now()
where slug in (
  'daniel-1-6-corte',
  'daniel-7-9-visiones',
  'ezequiel-1-7',
  'ezequiel-8-19',
  'ezequiel-20-32'
);

create or replace function internal.prevent_biblical_context_section_overlap()
returns trigger
language plpgsql
set search_path to public, pg_temp
as $function$
begin
  if new.scope_kind = 'section'
     and new.enabled
     and new.review_status = 'approved'
     and exists (
       select 1
       from public.biblical_context_units existing
       where existing.id <> new.id
         and existing.book_code = new.book_code
         and existing.scope_kind = 'section'
         and existing.enabled
         and existing.review_status = 'approved'
         and existing.chapter_start <= new.chapter_end
         and new.chapter_start <= existing.chapter_end
     ) then
    raise exception 'La sección contextual % se solapa con otra sección activa de %', new.slug, new.book_code;
  end if;

  return new;
end;
$function$;

revoke all on function internal.prevent_biblical_context_section_overlap() from public, anon, authenticated;

drop trigger if exists prevent_biblical_context_section_overlap on public.biblical_context_units;
create trigger prevent_biblical_context_section_overlap
before insert or update of book_code, scope_kind, chapter_start, chapter_end, review_status, enabled
on public.biblical_context_units
for each row
execute function internal.prevent_biblical_context_section_overlap();