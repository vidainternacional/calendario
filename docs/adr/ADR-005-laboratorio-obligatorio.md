# ADR-005 — Laboratorio obligatorio para cambios importantes

Estado: ACEPTADA

Fecha: 2026-07-26

## Contexto

Los cambios visuales o transversales pueden mejorar una pantalla y provocar regresiones en otras.

## Decisión

Todo cambio importante de diseño, navegación o componente compartido debe probarse primero en un entorno aislado o bajo una activación experimental reversible.

## Consecuencias

- Producción no será el lugar inicial de experimentación.
- La comparación se hará contra una baseline identificada.
- La aprobación visual precederá a la migración por módulos.
- Debe existir rollback antes de activar el cambio de manera general.