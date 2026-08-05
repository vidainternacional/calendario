# Calendario — base limpia para reconstrucción iOS

Fecha: 2026-08-05

## Decisión

Se restaura como base técnica el estado funcional inmediatamente anterior al pulido visual acumulativo del PR #198.

Esta restauración no declara que la interfaz ya sea equivalente a Apple Calendar. Su propósito es retirar estilos superpuestos, animaciones genéricas y ajustes globales que introdujeron inconsistencias, para volver a una base verificable antes de reconstruir las interacciones por bloques.

## Se conserva

- fuentes y suscripciones de calendario;
- calendarios por ministerio;
- eventos y recordatorios;
- vistas Año, Mes, varios días y Lista;
- feed de cambios;
- edición y eliminación según permisos existentes;
- asignaciones e intercambios;
- roles, RLS, `ministerio_id` y persistencia.

## Se retira

- la capa visual acumulativa añadida en el PR #198;
- módulos de apariencia creados únicamente por ese pulido;
- reglas globales frágiles basadas en coincidencias parciales de nombres de clase;
- la combinación de estilos superpuestos que dificultaba depuración y validación.

## Método a partir de esta base

1. validar que la base compile y conserve la lógica de iglesia;
2. estabilizar Año → Mes → Día → regreso;
3. implementar una sola transición a la vez;
4. validar en iPhone antes de continuar;
5. evitar cambios de schema, RLS, roles o asignaciones dentro del trabajo visual.
