revoke all on table public.biblical_hebrew_progress_sessions from authenticated;
revoke all on table public.biblical_hebrew_progress_answers from authenticated;

grant select, insert, update on table public.biblical_hebrew_progress_sessions to authenticated;
grant select, insert, update on table public.biblical_hebrew_progress_answers to authenticated;
