-- Reversión operativa conservadora. Ejecutar solo con autorización.
-- Detiene la configuración, grupos nuevos, invitaciones y ediciones multisede.
-- No se borran columnas, grupos, membresías, publicaciones ni historial.
-- Se conservan las guardas de lectura, GPS y RPC: restaurar acceso general
-- expondría material privado publicado después de esta migración.
begin;
update vida_privado.config set activa=false, exigir_sedes_legacy=false where id=true;
commit;
-- Reactivar, después de revisar permisos y con aprobación:
-- update vida_privado.config set activa=true where id=true;
-- El corte definitivo exige aprobación separada de producción:
-- update vida_privado.config set exigir_sedes_legacy=true where id=true;
