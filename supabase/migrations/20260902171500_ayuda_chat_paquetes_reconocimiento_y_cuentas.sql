alter table public.solicitudes_ayuda_solidaria
  add column if not exists tipo_ayuda text not null default 'general';

alter table public.solicitudes_ayuda_solidaria
  drop constraint if exists solicitudes_ayuda_solidaria_tipo_ayuda_check;

alter table public.solicitudes_ayuda_solidaria
  add constraint solicitudes_ayuda_solidaria_tipo_ayuda_check
  check (tipo_ayuda in ('general', 'paquete_despensa'));

alter table public.aportes_ayuda_solidaria
  add column if not exists agradecido_at timestamptz null,
  add column if not exists agradecido_por uuid null references public.profiles(id) on delete set null;

create table if not exists public.ayuda_solidaria_mensajes (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid null references public.solicitudes_ayuda_solidaria(id) on delete cascade,
  aporte_id uuid null references public.aportes_ayuda_solidaria(id) on delete cascade,
  autor_id uuid not null references public.profiles(id) on delete cascade,
  mensaje text not null,
  created_at timestamptz not null default now(),
  constraint ayuda_solidaria_mensajes_un_contexto check (num_nonnulls(solicitud_id, aporte_id) = 1),
  constraint ayuda_solidaria_mensajes_texto_check check (char_length(trim(mensaje)) between 1 and 2000)
);

create index if not exists ayuda_solidaria_mensajes_solicitud_idx on public.ayuda_solidaria_mensajes(solicitud_id, created_at);
create index if not exists ayuda_solidaria_mensajes_aporte_idx on public.ayuda_solidaria_mensajes(aporte_id, created_at);
create index if not exists ayuda_solidaria_mensajes_autor_idx on public.ayuda_solidaria_mensajes(autor_id);

alter table public.ayuda_solidaria_mensajes enable row level security;

drop policy if exists "solidarity chat participants read" on public.ayuda_solidaria_mensajes;
create policy "solidarity chat participants read" on public.ayuda_solidaria_mensajes for select to authenticated
using (
  exists (select 1 from public.solicitudes_ayuda_solidaria s where s.id = solicitud_id and (s.profile_id = auth.uid() or public.is_solidarity_manager()))
  or exists (select 1 from public.aportes_ayuda_solidaria a where a.id = aporte_id and (a.profile_id = auth.uid() or public.is_solidarity_manager()))
);

drop policy if exists "solidarity chat participants insert" on public.ayuda_solidaria_mensajes;
create policy "solidarity chat participants insert" on public.ayuda_solidaria_mensajes for insert to authenticated
with check (
  autor_id = auth.uid()
  and (
    exists (select 1 from public.solicitudes_ayuda_solidaria s where s.id = solicitud_id and (s.profile_id = auth.uid() or public.is_solidarity_manager()))
    or exists (select 1 from public.aportes_ayuda_solidaria a where a.id = aporte_id and (a.profile_id = auth.uid() or public.is_solidarity_manager()))
  )
);

grant select, insert on public.ayuda_solidaria_mensajes to authenticated;
revoke all on public.ayuda_solidaria_mensajes from anon;

create table if not exists public.cuentas_bancarias_iglesia (
  id uuid primary key default gen_random_uuid(),
  proposito text not null,
  titulo text not null,
  banco text not null,
  titular text not null,
  numero_cuenta text not null,
  tipo_cuenta text null,
  instrucciones text null,
  activo boolean not null default true,
  created_by uuid null references public.profiles(id) on delete set null,
  updated_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cuentas_bancarias_iglesia_proposito_check check (proposito in ('ayuda_solidaria', 'diezmos_ofrendas')),
  constraint cuentas_bancarias_iglesia_titulo_check check (char_length(trim(titulo)) between 1 and 120),
  constraint cuentas_bancarias_iglesia_banco_check check (char_length(trim(banco)) between 1 and 120),
  constraint cuentas_bancarias_iglesia_titular_check check (char_length(trim(titular)) between 1 and 160),
  constraint cuentas_bancarias_iglesia_numero_check check (char_length(trim(numero_cuenta)) between 1 and 120),
  constraint cuentas_bancarias_iglesia_instrucciones_check check (instrucciones is null or char_length(instrucciones) <= 1000)
);

create index if not exists cuentas_bancarias_iglesia_proposito_idx on public.cuentas_bancarias_iglesia(proposito, activo);
alter table public.cuentas_bancarias_iglesia enable row level security;

drop policy if exists "church bank accounts authenticated read" on public.cuentas_bancarias_iglesia;
create policy "church bank accounts authenticated read" on public.cuentas_bancarias_iglesia for select to authenticated
using (
  (activo = true and exists (select 1 from public.profiles p where p.id = auth.uid() and p.activo = true and p.estado_cuenta = 'activo'))
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.activo = true and p.estado_cuenta = 'activo' and p.rol = 'administrador')
);

drop policy if exists "church bank accounts admin insert" on public.cuentas_bancarias_iglesia;
create policy "church bank accounts admin insert" on public.cuentas_bancarias_iglesia for insert to authenticated
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.activo = true and p.estado_cuenta = 'activo' and p.rol = 'administrador'));

drop policy if exists "church bank accounts admin update" on public.cuentas_bancarias_iglesia;
create policy "church bank accounts admin update" on public.cuentas_bancarias_iglesia for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.activo = true and p.estado_cuenta = 'activo' and p.rol = 'administrador'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.activo = true and p.estado_cuenta = 'activo' and p.rol = 'administrador'));

drop policy if exists "church bank accounts admin delete" on public.cuentas_bancarias_iglesia;
create policy "church bank accounts admin delete" on public.cuentas_bancarias_iglesia for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.activo = true and p.estado_cuenta = 'activo' and p.rol = 'administrador'));

grant select, insert, update, delete on public.cuentas_bancarias_iglesia to authenticated;
revoke all on public.cuentas_bancarias_iglesia from anon;

comment on column public.solicitudes_ayuda_solidaria.tipo_ayuda is 'Distingue una petición general de un paquete de despensa; el tamaño del hogar se exige en la aplicación únicamente para paquete_despensa.';
comment on column public.aportes_ayuda_solidaria.agradecido_at is 'Fecha en que el equipo registró un agradecimiento personal por esta siembra.';
comment on table public.ayuda_solidaria_mensajes is 'Chat privado ligado a una solicitud o una siembra; visible solo para su dueño y el equipo autorizado.';
comment on table public.cuentas_bancarias_iglesia is 'Datos bancarios mostrados a usuarios autenticados para Ayuda Solidaria o Diezmos y Ofrendas; solo administradores activos pueden modificarlos.';
