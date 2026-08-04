revoke execute on function public.is_pilot_manager() from anon;
revoke execute on function public.is_pilot_manager() from public;
grant execute on function public.is_pilot_manager() to authenticated;
