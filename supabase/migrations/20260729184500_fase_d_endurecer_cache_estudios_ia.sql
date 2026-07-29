alter table public.estudios_profundos_ia
  add column if not exists modelo text not null default 'legacy',
  add column if not exists prompt_version text not null default 'legacy',
  add column if not exists source_version text not null default 'sin-recuperacion';

alter table public.estudios_profundos_ia
  alter column generado_por set not null;

create index if not exists idx_estudios_ia_cache_versionado
  on public.estudios_profundos_ia (
    pasaje_normalizado,
    modelo,
    prompt_version,
    source_version,
    created_at desc
  );

create index if not exists idx_estudios_ia_cuota_usuario
  on public.estudios_profundos_ia (generado_por, created_at desc);

drop policy if exists "Insertar en estudios_profundos_ia" on public.estudios_profundos_ia;

create policy "Usuarios activos insertan sus estudios IA"
on public.estudios_profundos_ia
for insert
to authenticated
with check (
  auth.role() = 'authenticated'
  and public.cuenta_activa()
  and generado_por = (select auth.uid())
);
