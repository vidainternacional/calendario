alter table public.publicaciones
  add column if not exists remitente_nombre text;

alter table public.publicaciones
  drop constraint if exists publicaciones_remitente_nombre_longitud;

alter table public.publicaciones
  add constraint publicaciones_remitente_nombre_longitud
  check (
    remitente_nombre is null
    or char_length(btrim(remitente_nombre)) between 1 and 60
  );
