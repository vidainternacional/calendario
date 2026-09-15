alter table public.publicaciones
  drop constraint if exists publicaciones_estado_check;

alter table public.publicaciones
  add constraint publicaciones_estado_check
  check (
    estado = any (
      array[
        'pendiente'::text,
        'aprobado'::text,
        'rechazado'::text,
        'oculto'::text
      ]
    )
  );
