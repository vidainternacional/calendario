create table if not exists public.ayuda_necesidades_servicio (
  id uuid primary key default gen_random_uuid(),
  categoria text not null default 'habilidades',
  titulo text not null,
  detalle text,
  estado text not null default 'activa' check (estado in ('activa','cubierta','pausada')),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ayuda_necesidades_servicio enable row level security;

create policy "service needs read" on public.ayuda_necesidades_servicio
for select to authenticated using (estado = 'activa' or public.is_solidarity_manager());
create policy "service needs managers insert" on public.ayuda_necesidades_servicio
for insert to authenticated with check (public.is_solidarity_manager());
create policy "service needs managers update" on public.ayuda_necesidades_servicio
for update to authenticated using (public.is_solidarity_manager()) with check (public.is_solidarity_manager());
create policy "service needs managers delete" on public.ayuda_necesidades_servicio
for delete to authenticated using (public.is_solidarity_manager());

create table if not exists public.despensa_paquetes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  activo boolean not null default true,
  es_predeterminado boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists despensa_paquetes_un_predeterminado
on public.despensa_paquetes (es_predeterminado) where es_predeterminado = true;

alter table public.despensa_paquetes enable row level security;
create policy "pantry packages managers read" on public.despensa_paquetes for select to authenticated using (public.is_solidarity_manager());
create policy "pantry packages managers insert" on public.despensa_paquetes for insert to authenticated with check (public.is_solidarity_manager());
create policy "pantry packages managers update" on public.despensa_paquetes for update to authenticated using (public.is_solidarity_manager()) with check (public.is_solidarity_manager());
create policy "pantry packages managers delete" on public.despensa_paquetes for delete to authenticated using (public.is_solidarity_manager());

create table if not exists public.despensa_paquete_items (
  id uuid primary key default gen_random_uuid(),
  paquete_id uuid not null references public.despensa_paquetes(id) on delete cascade,
  necesidad_id uuid not null references public.despensa_necesidades(id) on delete restrict,
  cantidad numeric not null check (cantidad > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (paquete_id, necesidad_id)
);

alter table public.despensa_paquete_items enable row level security;
create policy "pantry package items managers read" on public.despensa_paquete_items for select to authenticated using (public.is_solidarity_manager());
create policy "pantry package items managers insert" on public.despensa_paquete_items for insert to authenticated with check (public.is_solidarity_manager());
create policy "pantry package items managers update" on public.despensa_paquete_items for update to authenticated using (public.is_solidarity_manager()) with check (public.is_solidarity_manager());
create policy "pantry package items managers delete" on public.despensa_paquete_items for delete to authenticated using (public.is_solidarity_manager());

create table if not exists public.despensa_salidas_paquetes (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null unique references public.solicitudes_ayuda_solidaria(id) on delete restrict,
  paquete_id uuid not null references public.despensa_paquetes(id) on delete restrict,
  entregado_por uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.despensa_salidas_paquetes enable row level security;
create policy "pantry package deliveries managers read" on public.despensa_salidas_paquetes for select to authenticated using (public.is_solidarity_manager());

alter table public.aportes_ayuda_solidaria
add column if not exists necesidad_servicio_id uuid references public.ayuda_necesidades_servicio(id) on delete set null;

insert into public.despensa_paquetes (nombre, activo, es_predeterminado)
select 'Paquete estándar', true, true
where not exists (select 1 from public.despensa_paquetes where es_predeterminado = true);

create or replace function public.descontar_paquete_despensa_entregado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_paquete_id uuid;
begin
  if new.tipo_ayuda = 'paquete_despensa'
     and new.estado = 'entregada'
     and old.estado is distinct from 'entregada' then
    if exists (select 1 from public.despensa_salidas_paquetes where solicitud_id = new.id) then return new; end if;
    select id into v_paquete_id from public.despensa_paquetes where activo = true and es_predeterminado = true order by created_at asc limit 1;
    if v_paquete_id is null then return new; end if;
    if not exists (select 1 from public.despensa_paquete_items where paquete_id = v_paquete_id) then return new; end if;
    update public.despensa_necesidades d
      set existencia_actual = greatest(0, d.existencia_actual - i.cantidad), updated_at = now(), updated_by = new.revisado_por
      from public.despensa_paquete_items i
      where i.paquete_id = v_paquete_id and i.necesidad_id = d.id;
    insert into public.despensa_salidas_paquetes (solicitud_id, paquete_id, entregado_por)
      values (new.id, v_paquete_id, new.revisado_por)
      on conflict (solicitud_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_descontar_paquete_despensa_entregado on public.solicitudes_ayuda_solidaria;
create trigger trg_descontar_paquete_despensa_entregado
after update of estado on public.solicitudes_ayuda_solidaria
for each row execute function public.descontar_paquete_despensa_entregado();
