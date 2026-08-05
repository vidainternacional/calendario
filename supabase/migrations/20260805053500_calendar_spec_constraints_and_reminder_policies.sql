-- Garantías de integridad y edición compartida del calendario.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.eventos'::regclass
      and conname = 'eventos_valid_range'
  ) then
    alter table public.eventos
      add constraint eventos_valid_range check (fecha_fin > fecha_inicio) not valid;
    alter table public.eventos validate constraint eventos_valid_range;
  end if;
end;
$$;

create or replace function public.touch_event_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists eventos_touch_updated_at on public.eventos;
create trigger eventos_touch_updated_at
before update on public.eventos
for each row execute function public.touch_event_updated_at();

create or replace function public.preserve_reminder_creator()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.created_by := old.created_by;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists calendar_reminders_preserve_creator on public.calendar_reminders;
create trigger calendar_reminders_preserve_creator
before update on public.calendar_reminders
for each row execute function public.preserve_reminder_creator();

drop policy if exists reminders_manage_editable on public.calendar_reminders;
drop policy if exists reminders_insert_editable on public.calendar_reminders;
drop policy if exists reminders_update_editable on public.calendar_reminders;
drop policy if exists reminders_delete_editable on public.calendar_reminders;

create policy reminders_insert_editable
on public.calendar_reminders for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (
    public.es_admin_o_pastor()
    or exists (
      select 1
      from public.calendar_subscriptions s
      where s.calendar_id = calendar_reminders.calendar_id
        and s.user_id = (select auth.uid())
        and s.can_edit
    )
  )
);

create policy reminders_update_editable
on public.calendar_reminders for update to authenticated
using (
  public.es_admin_o_pastor()
  or exists (
    select 1
    from public.calendar_subscriptions s
    where s.calendar_id = calendar_reminders.calendar_id
      and s.user_id = (select auth.uid())
      and s.can_edit
  )
)
with check (
  public.es_admin_o_pastor()
  or exists (
    select 1
    from public.calendar_subscriptions s
    where s.calendar_id = calendar_reminders.calendar_id
      and s.user_id = (select auth.uid())
      and s.can_edit
  )
);

create policy reminders_delete_editable
on public.calendar_reminders for delete to authenticated
using (
  public.es_admin_o_pastor()
  or exists (
    select 1
    from public.calendar_subscriptions s
    where s.calendar_id = calendar_reminders.calendar_id
      and s.user_id = (select auth.uid())
      and s.can_edit
  )
);
