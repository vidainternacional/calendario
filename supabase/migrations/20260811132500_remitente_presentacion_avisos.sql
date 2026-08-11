-- Permite definir cómo se presenta públicamente el remitente de un aviso.
-- No modifica RLS ni permisos existentes.

alter table public.publicaciones
  add column if not exists remitente_tipo text not null default 'autor';

alter table public.publicaciones
  drop constraint if exists publicaciones_remitente_tipo_check;

alter table public.publicaciones
  add constraint publicaciones_remitente_tipo_check
  check (remitente_tipo in ('autor', 'ministerio', 'vida'));
