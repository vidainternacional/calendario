create table if not exists public.ministerio_canciones (
  id uuid primary key default gen_random_uuid(),
  ministerio_id uuid not null references public.ministerios(id) on delete cascade,
  titulo text not null,
  artista text null,
  spotify_url text null,
  youtube_url text null,
  activo boolean not null default true,
  creado_por uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ministerio_canciones_titulo_check check (char_length(btrim(titulo)) between 1 and 160)
);

create unique index if not exists ux_ministerio_canciones_titulo_normalizado
  on public.ministerio_canciones (ministerio_id, lower(btrim(titulo)));
create index if not exists idx_ministerio_canciones_ministerio_activo
  on public.ministerio_canciones (ministerio_id, activo, titulo);

alter table public.ministerio_canciones enable row level security;

alter table public.evento_repertorio
  add column if not exists cancion_id uuid null references public.ministerio_canciones(id) on delete set null;
create index if not exists idx_evento_repertorio_cancion
  on public.evento_repertorio(cancion_id);

insert into public.ministerio_canciones (ministerio_id, titulo, spotify_url, youtube_url, creado_por)
select distinct on (e.ministerio_id, lower(btrim(er.titulo)))
  e.ministerio_id,
  btrim(er.titulo),
  er.spotify_url,
  er.youtube_url,
  er.creado_por
from public.evento_repertorio er
join public.eventos e on e.id = er.evento_id
where e.ministerio_id is not null
  and btrim(coalesce(er.titulo, '')) <> ''
order by e.ministerio_id, lower(btrim(er.titulo)), er.created_at asc
on conflict do nothing;

update public.evento_repertorio er
set cancion_id = mc.id
from public.eventos e, public.ministerio_canciones mc
where er.evento_id = e.id
  and e.ministerio_id = mc.ministerio_id
  and lower(btrim(er.titulo)) = lower(btrim(mc.titulo))
  and er.cancion_id is null;
