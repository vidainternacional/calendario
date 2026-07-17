-- ============================================================
-- SEED DE DATOS DE PRUEBA — Vida Internacional
-- Profile: Ever (550cb179-9c04-4b9b-9d36-092d47cb1fdb)
-- Ejecutar en: Supabase → SQL Editor
-- ============================================================

DO $$
DECLARE
  my_profile_id  uuid := '550cb179-9c04-4b9b-9d36-092d47cb1fdb';

  min_alabanza   uuid;
  
  evt_global     uuid;
  evt_esta_sem   uuid;
  evt_proxima    uuid;
  evt_mes        uuid;

  pub_global     uuid;
  pub_ministerio uuid;
BEGIN

-- ============================================================
-- 1. MINISTERIO — Alabanza
-- ============================================================
INSERT INTO ministerios (nombre, descripcion, emoji, color_primario, color_secundario)
VALUES (
  'Alabanza',
  'Equipo de adoración y música de Vida Internacional',
  '🎵',
  '#7c3aed',   -- violet-700
  '#a855f7'    -- purple-500
)
RETURNING id INTO min_alabanza;

RAISE NOTICE 'Ministerio Alabanza creado: %', min_alabanza;

-- ============================================================
-- 2. MEMBRESÍA — Ever como líder del ministerio
-- ============================================================
INSERT INTO ministerio_miembros (ministerio_id, profile_id, es_lider)
VALUES (min_alabanza, my_profile_id, true);

-- ============================================================
-- 3. EVENTOS
--    - evt_global    : global (ministerio_id = null), esta semana
--    - evt_esta_sem  : Alabanza, mañana
--    - evt_proxima   : Alabanza, próxima semana
--    - evt_mes       : Alabanza, próximo mes
-- ============================================================

-- Evento global (sin ministerio) — hoy + 2 días, 10:00
INSERT INTO eventos (titulo, descripcion, ubicacion, fecha_inicio, fecha_fin, todo_el_dia, ministerio_id, creado_por)
VALUES (
  'Reunión General de Servidores',
  'Reunión mensual para todos los servidores de Vida Internacional.',
  'Auditorio principal',
  (now() + interval '2 days')::date + time '10:00',
  (now() + interval '2 days')::date + time '12:00',
  false,
  null,
  my_profile_id
)
RETURNING id INTO evt_global;

-- Evento Alabanza — mañana, 18:00
INSERT INTO eventos (titulo, descripcion, ubicacion, fecha_inicio, fecha_fin, todo_el_dia, ministerio_id, creado_por)
VALUES (
  'Ensayo — Alabanza Dominical',
  'Preparación del set de alabanza para el domingo.',
  'Sala de música',
  (now() + interval '1 day')::date + time '18:00',
  (now() + interval '1 day')::date + time '20:00',
  false,
  min_alabanza,
  my_profile_id
)
RETURNING id INTO evt_esta_sem;

-- Evento Alabanza — próxima semana (domingo)
INSERT INTO eventos (titulo, descripcion, ubicacion, fecha_inicio, fecha_fin, todo_el_dia, ministerio_id, creado_por)
VALUES (
  'Servicio Dominical — Alabanza',
  'Servicio de alabanza y adoración del domingo.',
  'Santuario',
  (date_trunc('week', now()) + interval '13 days')::date + time '09:00',
  (date_trunc('week', now()) + interval '13 days')::date + time '11:30',
  false,
  min_alabanza,
  my_profile_id
)
RETURNING id INTO evt_proxima;

-- Evento Alabanza — próximo mes
INSERT INTO eventos (titulo, descripcion, ubicacion, fecha_inicio, fecha_fin, todo_el_dia, ministerio_id, creado_por)
VALUES (
  'Noche de Adoración Especial',
  'Evento especial de alabanza y adoración con invitados.',
  'Auditorio principal',
  (date_trunc('month', now()) + interval '1 month' + interval '5 days')::date + time '19:00',
  (date_trunc('month', now()) + interval '1 month' + interval '5 days')::date + time '21:30',
  false,
  min_alabanza,
  my_profile_id
)
RETURNING id INTO evt_mes;

RAISE NOTICE 'Eventos creados: global=%, esta_sem=%, proxima=%, mes=%',
  evt_global, evt_esta_sem, evt_proxima, evt_mes;

-- ============================================================
-- 4. ASIGNACIONES — Ever en todos los eventos
-- ============================================================
INSERT INTO evento_asignaciones (evento_id, profile_id, estado)
VALUES
  (evt_global,    my_profile_id, 'asignado'),
  (evt_esta_sem,  my_profile_id, 'confirmado'),
  (evt_proxima,   my_profile_id, 'confirmado'),
  (evt_mes,       my_profile_id, 'asignado');

-- ============================================================
-- 5. PUBLICACIONES
--    - Una global (ministerio_id null)
--    - Una del ministerio Alabanza
-- ============================================================
INSERT INTO publicaciones (titulo, cuerpo, tipo, ministerio_id, autor_id)
VALUES (
  '¡Bienvenidos a la app de Vida Internacional!',
  'Esta es nuestra nueva plataforma para coordinar ministerios, eventos y turnos. Cualquier pregunta, habla con tu líder.',
  'aviso',
  null,
  my_profile_id
)
RETURNING id INTO pub_global;

INSERT INTO publicaciones (titulo, cuerpo, tipo, ministerio_id, autor_id)
VALUES (
  'Recordatorio — Ensayo esta semana',
  'Recuerda que el ensayo de esta semana es mañana a las 6:00 PM en la sala de música. ¡No faltes! 🎸',
  'aviso',
  min_alabanza,
  my_profile_id
)
RETURNING id INTO pub_ministerio;

RAISE NOTICE 'Publicaciones creadas: global=%, ministerio=%', pub_global, pub_ministerio;

-- ============================================================
-- 6. SOLICITUD DE EJEMPLO — pendiente
-- ============================================================
INSERT INTO solicitudes (titulo, descripcion, tipo, estado, ministerio_id, solicitante_id)
VALUES (
  'Necesitamos un bajista para el servicio del domingo',
  'Si conoces a alguien que toque bajo y quiera servir, por favor invítalo al ministerio de Alabanza. Tenemos un cupo disponible.',
  'peticion',
  'pendiente',
  min_alabanza,
  my_profile_id
);

RAISE NOTICE '✅ Seed completado exitosamente.';

END $$;
