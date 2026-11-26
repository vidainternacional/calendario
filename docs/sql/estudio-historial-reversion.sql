-- PROPUESTA DE DESHABILITACIÓN REVERSIBLE; no ejecutar sin autorización.
-- Primero retirar la integración de código o volver al commit anterior probado.
-- Conserva todas las filas para poder recuperar el historial después.
begin;
revoke all on public.estudio_historial_privado from authenticated, anon, public;
commit;

-- Para rehabilitar con las mismas políticas por propietario:
-- grant select, insert, update, delete on public.estudio_historial_privado to authenticated;
-- No DROP TABLE, borrado de datos ni cambios de políticas ajenas.
