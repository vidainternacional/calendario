DELETE FROM evento_asignaciones WHERE evento_id IN (SELECT id FROM eventos WHERE titulo IN ('prueba2', 'quiero ocupar el sonido'));
DELETE FROM eventos WHERE titulo IN ('prueba2', 'quiero ocupar el sonido');
DELETE FROM solicitudes WHERE titulo IN ('prueba2', 'quiero ocupar el sonido');
