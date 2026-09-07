alter table public.planes_lectura
  add column if not exists creado_por uuid references public.profiles(id) on delete set null;

create index if not exists planes_lectura_creado_por_idx
  on public.planes_lectura(creado_por);

create policy planes_lectura_select_gestion
on public.planes_lectura
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.activo = true
      and p.estado_cuenta = 'activo'
      and p.rol::text in ('pastor', 'administrador')
      and (p.rol::text = 'administrador' or planes_lectura.creado_por = auth.uid())
  )
);

create policy planes_lectura_insert_gestion
on public.planes_lectura
for insert
to authenticated
with check (
  creado_por = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.activo = true
      and p.estado_cuenta = 'activo'
      and p.rol::text in ('pastor', 'administrador')
  )
);

create policy planes_lectura_update_gestion
on public.planes_lectura
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.activo = true
      and p.estado_cuenta = 'activo'
      and p.rol::text in ('pastor', 'administrador')
      and (p.rol::text = 'administrador' or planes_lectura.creado_por = auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.activo = true
      and p.estado_cuenta = 'activo'
      and p.rol::text in ('pastor', 'administrador')
      and (p.rol::text = 'administrador' or planes_lectura.creado_por = auth.uid())
  )
);

create policy planes_lectura_delete_gestion
on public.planes_lectura
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.activo = true
      and p.estado_cuenta = 'activo'
      and p.rol::text in ('pastor', 'administrador')
      and (p.rol::text = 'administrador' or planes_lectura.creado_por = auth.uid())
  )
);

create policy planes_lectura_dias_select_gestion
on public.planes_lectura_dias
for select
to authenticated
using (
  exists (
    select 1
    from public.planes_lectura pl
    join public.profiles p on p.id = auth.uid()
    where pl.id = planes_lectura_dias.plan_id
      and p.activo = true
      and p.estado_cuenta = 'activo'
      and p.rol::text in ('pastor', 'administrador')
      and (p.rol::text = 'administrador' or pl.creado_por = auth.uid())
  )
);

create policy planes_lectura_dias_insert_gestion
on public.planes_lectura_dias
for insert
to authenticated
with check (
  exists (
    select 1
    from public.planes_lectura pl
    join public.profiles p on p.id = auth.uid()
    where pl.id = planes_lectura_dias.plan_id
      and p.activo = true
      and p.estado_cuenta = 'activo'
      and p.rol::text in ('pastor', 'administrador')
      and (p.rol::text = 'administrador' or pl.creado_por = auth.uid())
  )
);

create policy planes_lectura_dias_update_gestion
on public.planes_lectura_dias
for update
to authenticated
using (
  exists (
    select 1
    from public.planes_lectura pl
    join public.profiles p on p.id = auth.uid()
    where pl.id = planes_lectura_dias.plan_id
      and p.activo = true
      and p.estado_cuenta = 'activo'
      and p.rol::text in ('pastor', 'administrador')
      and (p.rol::text = 'administrador' or pl.creado_por = auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.planes_lectura pl
    join public.profiles p on p.id = auth.uid()
    where pl.id = planes_lectura_dias.plan_id
      and p.activo = true
      and p.estado_cuenta = 'activo'
      and p.rol::text in ('pastor', 'administrador')
      and (p.rol::text = 'administrador' or pl.creado_por = auth.uid())
  )
);

create policy planes_lectura_dias_delete_gestion
on public.planes_lectura_dias
for delete
to authenticated
using (
  exists (
    select 1
    from public.planes_lectura pl
    join public.profiles p on p.id = auth.uid()
    where pl.id = planes_lectura_dias.plan_id
      and p.activo = true
      and p.estado_cuenta = 'activo'
      and p.rol::text in ('pastor', 'administrador')
      and (p.rol::text = 'administrador' or pl.creado_por = auth.uid())
  )
);
