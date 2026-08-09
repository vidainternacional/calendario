create table if not exists public.member_profile_details (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  sexo text null check (sexo is null or sexo in ('masculino','femenino','prefiere_no_indicar')),
  estado_civil text null check (estado_civil is null or estado_civil in ('soltero','casado','divorciado','viudo','prefiere_no_indicar')),
  municipio text null,
  departamento text null,
  direccion_referencia text null,
  contacto_emergencia_nombre text null,
  contacto_emergencia_telefono text null,
  contacto_emergencia_relacion text null,
  bautizado boolean null,
  desea_bautizarse boolean null,
  fecha_bautismo date null,
  fecha_ingreso_vida date null,
  iglesia_anterior text null,
  profesion_oficio text null,
  empresa_emprendimiento text null,
  descripcion_profesional text null,
  visibilidad_profesional boolean not null default false,
  disponibilidad_dias text[] not null default '{}',
  disponibilidad_horarios text null,
  habilidades_personales text[] not null default '{}',
  idiomas text[] not null default '{}',
  formacion_ministerial text[] not null default '{}',
  biografia text null,
  updated_at timestamptz not null default now(),
  constraint member_profile_details_text_lengths check (
    char_length(coalesce(municipio,'')) <= 120 and
    char_length(coalesce(departamento,'')) <= 120 and
    char_length(coalesce(direccion_referencia,'')) <= 500 and
    char_length(coalesce(contacto_emergencia_nombre,'')) <= 160 and
    char_length(coalesce(contacto_emergencia_telefono,'')) <= 60 and
    char_length(coalesce(contacto_emergencia_relacion,'')) <= 100 and
    char_length(coalesce(iglesia_anterior,'')) <= 180 and
    char_length(coalesce(profesion_oficio,'')) <= 180 and
    char_length(coalesce(empresa_emprendimiento,'')) <= 180 and
    char_length(coalesce(descripcion_profesional,'')) <= 1200 and
    char_length(coalesce(disponibilidad_horarios,'')) <= 500 and
    char_length(coalesce(biografia,'')) <= 1200
  )
);

alter table public.member_profile_details enable row level security;

drop policy if exists member_profile_details_select on public.member_profile_details;
create policy member_profile_details_select on public.member_profile_details
for select to authenticated using (
  profile_id = auth.uid() or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.rol in ('pastor','administrador')
  )
);

drop policy if exists member_profile_details_insert on public.member_profile_details;
create policy member_profile_details_insert on public.member_profile_details
for insert to authenticated with check (
  profile_id = auth.uid() or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.rol in ('pastor','administrador')
  )
);

drop policy if exists member_profile_details_update on public.member_profile_details;
create policy member_profile_details_update on public.member_profile_details
for update to authenticated
using (
  profile_id = auth.uid() or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.rol in ('pastor','administrador')
  )
)
with check (
  profile_id = auth.uid() or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.rol in ('pastor','administrador')
  )
);

drop policy if exists member_profile_details_delete on public.member_profile_details;
create policy member_profile_details_delete on public.member_profile_details
for delete to authenticated using (
  profile_id = auth.uid() or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.rol = 'administrador'
  )
);

create or replace function public.set_member_profile_details_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_member_profile_details_updated_at on public.member_profile_details;
create trigger trg_member_profile_details_updated_at
before update on public.member_profile_details
for each row execute function public.set_member_profile_details_updated_at();
