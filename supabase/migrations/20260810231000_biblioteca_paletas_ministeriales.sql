-- Biblioteca reutilizable de paletas por ministerio.
-- Las paletas aplicadas a cada servicio continúan almacenadas en evento_paletas,
-- de modo que reutilizar o editar una biblioteca no altera servicios anteriores.

create table if not exists public.ministerio_paletas (
  id uuid primary key default gen_random_uuid(),
  ministerio_id uuid not null references public.ministerios(id) on delete cascade,
  nombre text not null,
  colores jsonb not null default '[]'::jsonb,
  observaciones text null,
  referencia_url text null,
  activo boolean not null default true,
  creado_por uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ministerio_paletas_nombre_check check (char_length(btrim(nombre)) between 2 and 80),
  constraint ministerio_paletas_colores_check check (
    jsonb_typeof(colores) = 'array'
    and jsonb_array_length(colores) between 2 and 8
  )
);

create unique index if not exists ux_ministerio_paletas_nombre_activo
  on public.ministerio_paletas (ministerio_id, lower(btrim(nombre)))
  where activo = true;

create index if not exists idx_ministerio_paletas_ministerio
  on public.ministerio_paletas (ministerio_id, activo, updated_at desc);

alter table public.ministerio_paletas enable row level security;

comment on table public.ministerio_paletas is
  'Biblioteca reutilizable de paletas por ministerio. Las paletas de servicios siguen viviendo en evento_paletas.';
