drop policy if exists evento_calendarios_read on public.evento_calendarios;
create policy evento_calendarios_read
on public.evento_calendarios
for select
to authenticated
using (
  public.cuenta_activa()
  and (
    public.es_admin_o_pastor()
    or exists (
      select 1
      from public.calendars c
      where c.id = evento_calendarios.calendar_id
        and (
          c.es_publico = true
          or exists (
            select 1
            from public.calendar_subscriptions s
            where s.calendar_id = c.id
              and s.user_id = (select auth.uid())
          )
        )
    )
  )
);

drop policy if exists evento_calendarios_insert on public.evento_calendarios;
create policy evento_calendarios_insert
on public.evento_calendarios
for insert
to authenticated
with check (
  public.es_admin_o_pastor()
  or exists (
    select 1
    from public.calendars c
    where c.id = evento_calendarios.calendar_id
      and c.ministerio_id is not null
      and public.lidera(c.ministerio_id)
      and exists (
        select 1
        from public.calendar_subscriptions s
        where s.calendar_id = c.id
          and s.user_id = (select auth.uid())
          and s.can_edit = true
      )
  )
);

drop policy if exists evento_calendarios_delete on public.evento_calendarios;
create policy evento_calendarios_delete
on public.evento_calendarios
for delete
to authenticated
using (
  public.es_admin_o_pastor()
  or exists (
    select 1
    from public.calendars c
    where c.id = evento_calendarios.calendar_id
      and c.ministerio_id is not null
      and public.lidera(c.ministerio_id)
      and exists (
        select 1
        from public.calendar_subscriptions s
        where s.calendar_id = c.id
          and s.user_id = (select auth.uid())
          and s.can_edit = true
      )
  )
);
