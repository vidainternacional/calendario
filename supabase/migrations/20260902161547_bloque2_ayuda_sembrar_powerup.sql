create table if not exists public.despensa_necesidades (
  id uuid primary key default gen_random_uuid(),
  producto text not null,
  unidad text not null default 'unidad',
  existencia_actual numeric not null default 0,
  minimo_necesario numeric not null default 0,
  estado text not null default 'activa',
  created_by uuid null references public.profiles(id) on delete set null,
  updated_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint despensa_necesidades_producto_check check (char_length(trim(producto)) between 1 and 120),
  constraint despensa_necesidades_unidad_check check (char_length(trim(unidad)) between 1 and 40),
  constraint despensa_necesidades_existencia_check check (existencia_actual >= 0),
  constraint despensa_necesidades_minimo_check check (minimo_necesario >= 0),
  constraint despensa_necesidades_estado_check check (estado in ('activa','cubierta','pausada'))
);

alter table public.despensa_necesidades enable row level security;

revoke all on table public.despensa_necesidades from anon;
grant select, insert, update, delete on table public.despensa_necesidades to authenticated;

drop policy if exists "despensa necesidades read" on public.despensa_necesidades;
create policy "despensa necesidades read"
on public.despensa_necesidades
for select
to authenticated
using (estado = 'activa' or public.is_solidarity_manager());

drop policy if exists "despensa necesidades managers insert" on public.despensa_necesidades;
create policy "despensa necesidades managers insert"
on public.despensa_necesidades
for insert
to authenticated
with check (public.is_solidarity_manager());

drop policy if exists "despensa necesidades managers update" on public.despensa_necesidades;
create policy "despensa necesidades managers update"
on public.despensa_necesidades
for update
to authenticated
using (public.is_solidarity_manager())
with check (public.is_solidarity_manager());

drop policy if exists "despensa necesidades managers delete" on public.despensa_necesidades;
create policy "despensa necesidades managers delete"
on public.despensa_necesidades
for delete
to authenticated
using (public.is_solidarity_manager());

alter table public.aportes_ayuda_solidaria
  add column if not exists necesidad_despensa_id uuid null references public.despensa_necesidades(id) on delete set null;

create index if not exists aportes_ayuda_solidaria_necesidad_despensa_idx
  on public.aportes_ayuda_solidaria(necesidad_despensa_id)
  where necesidad_despensa_id is not null;

alter table public.aportes_ayuda_solidaria
  drop constraint if exists aportes_ayuda_solidaria_tipo_check;

alter table public.aportes_ayuda_solidaria
  add constraint aportes_ayuda_solidaria_tipo_check
  check (tipo = any (array[
    'alimentos'::text,
    'monetario'::text,
    'voluntariado'::text,
    'tiempo'::text,
    'transporte'::text,
    'herramientas'::text,
    'objetos'::text,
    'conocimientos'::text,
    'oficios'::text,
    'habilidades'::text,
    'otro'::text
  ]));
