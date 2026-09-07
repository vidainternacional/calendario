create table if not exists public.evento_repertorio_compartidos (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on delete cascade,
  ministerio_origen_id uuid not null references public.ministerios(id) on delete cascade,
  ministerio_destino_id uuid not null references public.ministerios(id) on delete cascade,
  creado_por uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint evento_repertorio_compartidos_origen_destino_distintos check (ministerio_origen_id <> ministerio_destino_id),
  constraint evento_repertorio_compartidos_unico unique (evento_id, ministerio_origen_id, ministerio_destino_id)
);

create index if not exists evento_repertorio_compartidos_destino_idx
  on public.evento_repertorio_compartidos (ministerio_destino_id, created_at desc);

create index if not exists evento_repertorio_compartidos_origen_evento_idx
  on public.evento_repertorio_compartidos (ministerio_origen_id, evento_id);

alter table public.evento_repertorio_compartidos enable row level security;

revoke all on table public.evento_repertorio_compartidos from anon, authenticated;
grant all on table public.evento_repertorio_compartidos to service_role;

comment on table public.evento_repertorio_compartidos is 'Comparte en solo lectura el repertorio vivo de un servicio entre ministerios autorizados.';
