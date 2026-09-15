alter table public.profiles
  alter column estado_cuenta set default 'pendiente'::text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into public.profiles (id, nombre_completo, email, rol, estado_cuenta, created_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre_completo', new.email),
    new.email,
    'servidor',
    'pendiente',
    timezone('utc', now())
  );
  return new;
end;
$function$;
