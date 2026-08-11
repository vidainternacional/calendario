-- Estados operativos del dashboard de servidores.
-- Conserva asignado/declinado por compatibilidad histórica.

alter type public.estado_asignacion add value if not exists 'pendiente' before 'confirmado';
alter type public.estado_asignacion add value if not exists 'no_disponible' after 'confirmado';
