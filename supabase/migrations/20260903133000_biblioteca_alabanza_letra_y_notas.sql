alter table public.ministerio_canciones
  add column if not exists letra text,
  add column if not exists notas_permanentes text;
