create index if not exists solicitudes_ayuda_solidaria_revisado_por_idx
  on public.solicitudes_ayuda_solidaria(revisado_por)
  where revisado_por is not null;

create index if not exists aportes_ayuda_solidaria_revisado_por_idx
  on public.aportes_ayuda_solidaria(revisado_por)
  where revisado_por is not null;

drop policy if exists "solidarity requests own or managers read" on public.solicitudes_ayuda_solidaria;
drop policy if exists "solidarity requests own insert" on public.solicitudes_ayuda_solidaria;
drop policy if exists "solidarity contributions own or managers read" on public.aportes_ayuda_solidaria;
drop policy if exists "solidarity contributions own insert" on public.aportes_ayuda_solidaria;

create policy "solidarity requests own or managers read"
on public.solicitudes_ayuda_solidaria
for select
to authenticated
using (profile_id = (select auth.uid()) or public.is_solidarity_manager());

create policy "solidarity requests own insert"
on public.solicitudes_ayuda_solidaria
for insert
to authenticated
with check (profile_id = (select auth.uid()));

create policy "solidarity contributions own or managers read"
on public.aportes_ayuda_solidaria
for select
to authenticated
using (profile_id = (select auth.uid()) or public.is_solidarity_manager());

create policy "solidarity contributions own insert"
on public.aportes_ayuda_solidaria
for insert
to authenticated
with check (profile_id = (select auth.uid()));
