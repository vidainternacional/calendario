# ADR-004 — Permisos validados en servidor

Estado: ACEPTADA

Fecha: 2026-07-26

## Contexto

Ocultar botones o rutas en el cliente mejora la experiencia, pero no protege los datos por sí solo.

## Decisión

Toda operación sensible debe validar autorización en servidor y mantener las políticas de acceso de datos correspondientes.

## Consecuencias

- Las comprobaciones visuales no sustituyen seguridad real.
- No se ampliarán permisos para resolver errores de interfaz.
- Cualquier cambio de roles o políticas requiere pruebas con los perfiles afectados.
- Las regresiones de acceso se consideran críticas.