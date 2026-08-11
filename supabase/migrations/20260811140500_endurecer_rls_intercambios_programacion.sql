-- Cierre de seguridad de Programación Ministerial — reemplazos.
-- Estado aplicado en Supabase el 2026-08-11 y consolidado aquí para mantener
-- trazabilidad reproducible entre base de datos y repositorio.

create or replace function public.puede_gestionar_intercambio(
  p_asignacion_origen_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.es_admin_o_pastor()
    or exists (
      select 1
      from public.evento_asignaciones ea
      where ea.id = p_asignacion_origen_id
        and ea.ministerio_id is not null
        and public.lidera(ea.ministerio_id)
    );
$$;

create or replace function public.es_asignacion_propia_intercambio(
  p_asignacion_origen_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.evento_asignaciones ea
    where ea.id = p_asignacion_origen_id
      and ea.profile_id = auth.uid()
  );
$$;

revoke all on function public.puede_gestionar_intercambio(uuid) from public;
revoke all on function public.es_asignacion_propia_intercambio(uuid) from public;
grant execute on function public.puede_gestionar_intercambio(uuid) to authenticated;
grant execute on function public.es_asignacion_propia_intercambio(uuid) to authenticated;

-- Retirar todas las variantes históricas de políticas amplias, incluyendo las
-- que otorgaban acceso solamente porque destinatario_id era NULL.
drop policy if exists "Usuarios pueden ver intercambios relevantes" on public.intercambios;
drop policy if exists "Usuarios autorizados pueden actualizar intercambios" on public.intercambios;
drop policy if exists "Usuarios autenticados pueden crear intercambios" on public.intercambios;
drop policy if exists "ver_intercambios" on public.intercambios;
drop policy if exists "responder_intercambios" on public.intercambios;
drop policy if exists "crear_intercambios" on public.intercambios;

-- Idempotencia si esta migración se reproduce sobre una base que ya recibió el
-- cierre manual mediante Supabase MCP.
drop policy if exists "Usuarios pueden ver intercambios autorizados" on public.intercambios;
drop policy if exists "Servidor crea reemplazo de asignacion propia" on public.intercambios;
drop policy if exists "Usuarios actualizan intercambios autorizados" on public.intercambios;

create policy "Usuarios pueden ver intercambios autorizados"
on public.intercambios
for select
to authenticated
using (
  (select public.es_admin_o_pastor())
  or (select auth.uid()) = solicitante_id
  or (
    destinatario_id is not null
    and (select auth.uid()) = destinatario_id
  )
  or public.puede_gestionar_intercambio(asignacion_origen_id)
);

create policy "Servidor crea reemplazo de asignacion propia"
on public.intercambios
for insert
to authenticated
with check (
  (select auth.uid()) = solicitante_id
  and public.es_asignacion_propia_intercambio(asignacion_origen_id)
  and destinatario_id is null
  and asignacion_destino_id is null
  and estado = 'pendiente'
);

revoke update on public.intercambios from authenticated;
grant update (estado, resuelto_at) on public.intercambios to authenticated;

create policy "Usuarios actualizan intercambios autorizados"
on public.intercambios
for update
to authenticated
using (
  public.puede_gestionar_intercambio(asignacion_origen_id)
  or (select auth.uid()) = solicitante_id
  or (
    destinatario_id is not null
    and (select auth.uid()) = destinatario_id
  )
)
with check (
  public.puede_gestionar_intercambio(asignacion_origen_id)
  or (
    (select auth.uid()) = solicitante_id
    and estado = 'cancelado'
  )
  or (
    destinatario_id is not null
    and (select auth.uid()) = destinatario_id
    and estado in ('aceptado', 'rechazado')
  )
);

-- El flujo vigente ya no permite que un servidor tome directamente una
-- solicitud abierta. El líder selecciona el reemplazo y la acción de servidor
-- crea la asignación destino pendiente.
drop policy if exists "aceptar_intercambio_asignacion" on public.evento_asignaciones;

-- Una misma asignación no puede generar dos solicitudes abiertas simultáneas.
create unique index if not exists intercambios_unico_pendiente_por_asignacion
on public.intercambios (asignacion_origen_id)
where estado = 'pendiente';
