-- FASE F — Biblia → Notas
-- Correlativo seguro por usuario para notas de predicación.
-- Esta migración ya fue aplicada en Supabase antes de versionarse en el repositorio.
-- No modifica RLS ni datos existentes.

alter table public.notas_estudio
  add column if not exists estado_predicacion text;

create unique index if not exists notas_estudio_profile_numero_predicacion_unique
  on public.notas_estudio (profile_id, numero_predicacion)
  where origen = 'biblia_notas'
    and tipo = 'predicacion'
    and estado = 'activo'
    and numero_predicacion is not null;

create or replace function public.asignar_numero_predicacion_nota(p_nota_id uuid)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_numero integer;
begin
  if v_user_id is null then
    raise exception 'No autenticado';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  select numero_predicacion
    into v_numero
  from public.notas_estudio
  where id = p_nota_id
    and profile_id = v_user_id
    and origen = 'biblia_notas'
    and tipo = 'predicacion'
    and estado = 'activo';

  if found and v_numero is not null then
    return v_numero;
  end if;

  select coalesce(max(numero_predicacion), 0) + 1
    into v_numero
  from public.notas_estudio
  where profile_id = v_user_id
    and origen = 'biblia_notas'
    and tipo = 'predicacion'
    and estado = 'activo';

  update public.notas_estudio
  set numero_predicacion = v_numero
  where id = p_nota_id
    and profile_id = v_user_id
    and origen = 'biblia_notas'
    and tipo = 'predicacion'
    and estado = 'activo'
    and numero_predicacion is null;

  if not found then
    raise exception 'Nota de predicación no disponible';
  end if;

  return v_numero;
end;
$$;

revoke all on function public.asignar_numero_predicacion_nota(uuid) from public;
revoke all on function public.asignar_numero_predicacion_nota(uuid) from anon;
grant execute on function public.asignar_numero_predicacion_nota(uuid) to authenticated;
