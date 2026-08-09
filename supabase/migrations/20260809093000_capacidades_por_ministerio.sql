-- Capacidades de servicio por ministerio.
-- Permite que cada ministerio defina su propio catálogo y que cada miembro
-- declare capacidades que luego pueden ser confirmadas o añadidas por liderazgo.

create table if not exists public.ministerio_capacidades (
  id uuid primary key default gen_random_uuid(),
  ministerio_id uuid not null references public.ministerios(id) on delete cascade,
  nombre text not null,
  categoria text not null default 'General',
  activo boolean not null default true,
  orden integer not null default 0,
  creado_por uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ministerio_capacidades_nombre_uq
  on public.ministerio_capacidades (ministerio_id, lower(nombre));

create table if not exists public.ministerio_miembro_capacidades (
  id uuid primary key default gen_random_uuid(),
  ministerio_id uuid not null references public.ministerios(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  capacidad_id uuid not null references public.ministerio_capacidades(id) on delete cascade,
  origen text not null default 'miembro' check (origen in ('miembro', 'lider', 'administrador')),
  confirmada_por uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ministerio_id, profile_id, capacidad_id)
);

alter table public.ministerio_capacidades enable row level security;
alter table public.ministerio_miembro_capacidades enable row level security;

create policy "capacidades_read_authenticated"
on public.ministerio_capacidades for select
to authenticated
using (true);

create policy "capacidades_manage_leaders"
on public.ministerio_capacidades for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol in ('pastor', 'administrador')
  )
  or exists (
    select 1 from public.ministerio_miembros mm
    where mm.profile_id = auth.uid()
      and mm.ministerio_id = ministerio_capacidades.ministerio_id
      and mm.es_lider = true
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol in ('pastor', 'administrador')
  )
  or exists (
    select 1 from public.ministerio_miembros mm
    where mm.profile_id = auth.uid()
      and mm.ministerio_id = ministerio_capacidades.ministerio_id
      and mm.es_lider = true
  )
);

create policy "miembro_capacidades_read_same_ministry"
on public.ministerio_miembro_capacidades for select
to authenticated
using (
  profile_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol in ('pastor', 'administrador')
  )
  or exists (
    select 1 from public.ministerio_miembros mm
    where mm.profile_id = auth.uid()
      and mm.ministerio_id = ministerio_miembro_capacidades.ministerio_id
  )
);

create policy "miembro_capacidades_insert_self_or_leader"
on public.ministerio_miembro_capacidades for insert
to authenticated
with check (
  (
    profile_id = auth.uid()
    and exists (
      select 1 from public.ministerio_miembros mm
      where mm.profile_id = auth.uid()
        and mm.ministerio_id = ministerio_miembro_capacidades.ministerio_id
    )
  )
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol in ('pastor', 'administrador')
  )
  or exists (
    select 1 from public.ministerio_miembros mm
    where mm.profile_id = auth.uid()
      and mm.ministerio_id = ministerio_miembro_capacidades.ministerio_id
      and mm.es_lider = true
  )
);

create policy "miembro_capacidades_update_self_or_leader"
on public.ministerio_miembro_capacidades for update
to authenticated
using (
  profile_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol in ('pastor', 'administrador')
  )
  or exists (
    select 1 from public.ministerio_miembros mm
    where mm.profile_id = auth.uid()
      and mm.ministerio_id = ministerio_miembro_capacidades.ministerio_id
      and mm.es_lider = true
  )
)
with check (
  profile_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol in ('pastor', 'administrador')
  )
  or exists (
    select 1 from public.ministerio_miembros mm
    where mm.profile_id = auth.uid()
      and mm.ministerio_id = ministerio_miembro_capacidades.ministerio_id
      and mm.es_lider = true
  )
);

create policy "miembro_capacidades_delete_self_or_leader"
on public.ministerio_miembro_capacidades for delete
to authenticated
using (
  profile_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol in ('pastor', 'administrador')
  )
  or exists (
    select 1 from public.ministerio_miembros mm
    where mm.profile_id = auth.uid()
      and mm.ministerio_id = ministerio_miembro_capacidades.ministerio_id
      and mm.es_lider = true
  )
);

-- Catálogo inicial útil para el ministerio de Alabanza cuando exista.
insert into public.ministerio_capacidades (ministerio_id, nombre, categoria, orden)
select m.id, x.nombre, x.categoria, x.orden
from public.ministerios m
cross join (values
  ('Guitarra', 'Instrumentos', 10),
  ('Bajo', 'Instrumentos', 20),
  ('Batería', 'Instrumentos', 30),
  ('Teclado / Piano', 'Instrumentos', 40),
  ('Voz soprano', 'Voces', 50),
  ('Voz alto', 'Voces', 60),
  ('Voz tenor', 'Voces', 70),
  ('Voz barítono', 'Voces', 80),
  ('Dirección musical', 'Servicio', 90),
  ('Sonido', 'Técnica', 100),
  ('Multimedia', 'Técnica', 110)
) as x(nombre, categoria, orden)
where lower(m.nombre) like '%alabanza%'
on conflict do nothing;
