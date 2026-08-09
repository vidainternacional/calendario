update public.member_profile_details
set sexo = null
where sexo is not null
  and sexo not in ('masculino', 'femenino');

alter table public.member_profile_details
  drop constraint if exists member_profile_details_sexo_check;

alter table public.member_profile_details
  add constraint member_profile_details_sexo_check
  check (sexo is null or sexo in ('masculino', 'femenino'));
