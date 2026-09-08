create or replace function public.discipulado_eliminar_curso(p_curso_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.puede_gestionar_discipulado() then
    raise exception 'No tienes permiso para gestionar Discipulado';
  end if;

  if p_curso_id is null then
    raise exception 'Curso inválido';
  end if;

  if not exists (
    select 1
    from public.discipulado_cursos c
    where c.id = p_curso_id
  ) then
    raise exception 'El curso ya no existe';
  end if;

  delete from public.discipulado_cursos
  where id = p_curso_id;
end;
$$;

revoke all on function public.discipulado_eliminar_curso(uuid) from public;
revoke all on function public.discipulado_eliminar_curso(uuid) from anon;
grant execute on function public.discipulado_eliminar_curso(uuid) to authenticated;
grant execute on function public.discipulado_eliminar_curso(uuid) to service_role;
