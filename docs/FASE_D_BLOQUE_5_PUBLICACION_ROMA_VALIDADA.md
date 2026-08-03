# FASE D · Bloque 5 — Publicación controlada de Roma validada

Fecha: 2026-08-03

## Aprobación editorial

El usuario aprobó sin cambios los títulos, resúmenes, referencias, coordenada aproximada, niveles de certeza y atribución del paquete `rome-pilot-v1`.

## Validación técnica

El PR #160 validó fuera de producción:

- aprobación y habilitación de exactamente 6 filas;
- 1 lugar, 1 periodo, 2 eventos y 2 relaciones;
- coincidencia de hashes fijados;
- ausencia de cambios sobre filas ajenas al paquete;
- recuperación completa al estado `pending` y deshabilitado;
- ejecución en PostgreSQL 17;
- CI general aprobada.

## Estado de producción

Las seis filas permanecen `pending` y con `enabled = false`. No se ejecutó el candidato de publicación, no se conectó la interfaz y no se avanzó al Bloque 6.

## Siguiente control

Preparar una migración activa revisable y una recuperación operativa equivalente. Ambas deben permanecer sin aplicar hasta completar preflight de producción y recibir una autorización explícita posterior.
