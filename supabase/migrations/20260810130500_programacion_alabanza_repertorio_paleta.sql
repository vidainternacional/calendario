alter table public.evento_asignaciones
  add column if not exists capacidad_id uuid null references public.ministerio_capacidades(id) on delete set null,
  add column if not exists asignado_por uuid null references public.profiles(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_evento_asignaciones_capacidad on public.evento_asignaciones(capacidad_id);

create table if not exists public.evento_repertorio (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on delete cascade,
  orden integer not null default 0,
  titulo text not null,
  tonalidad text null,
  enlace text null,
  notas text null,
  creado_por uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_evento_repertorio_evento_orden on public.evento_repertorio(evento_id, orden, created_at);
alter table public.evento_repertorio enable row level security;

create table if not exists public.evento_paletas (
  evento_id uuid primary key references public.eventos(id) on delete cascade,
  colores text[] not null default '{}'::text[],
  observaciones text null,
  referencia_url text null,
  actualizado_por uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.evento_paletas enable row level security;

insert into public.ministerios (nombre, emoji, color_primario, color_secundario, descripcion, orden, activo)
select 'Fotografía', '📷', '#5b5bd6', '#7c3aed', 'Equipo de fotografía y cobertura visual.', 100, true
where not exists (select 1 from public.ministerios where lower(nombre) = 'fotografía' or lower(nombre) = 'fotografia');

insert into public.ministerios (nombre, emoji, color_primario, color_secundario, descripcion, orden, activo)
select 'Multimedia', '🎛️', '#2563eb', '#4f46e5', 'Equipo de proyección y apoyo multimedia.', 101, true
where not exists (select 1 from public.ministerios where lower(nombre) = 'multimedia');

update public.ministerio_responsabilidades
set nombre = 'Gestión de paleta de colores para Alabanza',
    descripcion = 'Permite editar la paleta de colores de los servicios programados de Alabanza sin otorgar liderazgo.',
    updated_at = now()
where codigo = 'paleta_colores';
