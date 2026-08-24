alter table public.biblical_hebrew_progress_answers
  add column if not exists response_time_ms integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'biblical_hebrew_progress_answers_response_time_ms_check'
      and conrelid = 'public.biblical_hebrew_progress_answers'::regclass
  ) then
    alter table public.biblical_hebrew_progress_answers
      add constraint biblical_hebrew_progress_answers_response_time_ms_check
      check (
        response_time_ms is null
        or (
          response_time_ms >= 0
          and response_time_ms <= 300000
        )
      );
  end if;
end
$$;
