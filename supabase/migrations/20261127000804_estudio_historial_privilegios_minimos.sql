-- Limitar la tabla nueva al CRUD autorizado; no modificar privilegios predeterminados.
begin;
revoke truncate, references, trigger on public.estudio_historial_privado from authenticated;
commit;
