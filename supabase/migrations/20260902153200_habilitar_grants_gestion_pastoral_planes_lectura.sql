grant insert, update, delete on table public.planes_lectura to authenticated;
grant insert, update, delete on table public.planes_lectura_dias to authenticated;

revoke all on table public.planes_lectura from anon;
revoke all on table public.planes_lectura_dias from anon;
