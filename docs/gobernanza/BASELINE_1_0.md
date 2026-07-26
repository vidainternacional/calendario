# Baseline 1.0 — Vida Internacional

Estado: CONGELADA COMO REFERENCIA

Fecha de registro: 2026-07-26

## Propósito

Esta baseline documenta el estado estable conocido antes del cierre formal de la Fase C. No representa una versión final del producto; representa un punto seguro de comparación y recuperación.

## Estado confirmado de fases

- Fase A: completada.
- Fase B: completada.
- Fase C: activa, con revisión integral y cierre documental en progreso.

## Módulos y comportamientos que forman parte de la referencia

### Biblia

- experiencia visual minimalista aprobada;
- botones circulares;
- temas claro, sepia y oscuro;
- selector y navegación funcionales;
- favoritos y notas como funciones críticas;
- comportamiento móvil prioritario.

### Panel Pastoral

Implementación funcional documentada de:

- permisos;
- colecciones de versículos;
- bosquejos;
- biblioteca pastoral;
- materiales de estudio.

Su protección definitiva queda condicionada al cierre formal de Fase C.

### Aplicación general

- autenticación existente;
- navegación inferior existente;
- permisos por rol;
- despliegue en Vercel;
- integración con Supabase;
- mejoras recientes de tablas y formularios móviles.

## Componentes críticos de comparación

Antes y después de cualquier cambio transversal se debe comprobar:

- inicio de sesión;
- navegación inferior;
- apertura y uso de Biblia;
- cambio de temas en Biblia;
- favoritos y notas;
- acceso al Panel Pastoral según rol;
- formularios en móvil;
- tablas en móvil;
- enlaces internos de materiales publicados.

## Punto de retorno

Para rollback debe identificarse el último commit estable anterior al experimento. Ningún documento debe inventar un SHA de referencia: debe verificarse en GitHub en el momento de iniciar el cambio.

## Restricción

Esta baseline no autoriza cerrar la Fase C. Para crear Baseline 1.1 todavía deben completarse las validaciones finales registradas en `docs/FASE_C_PANEL_PASTORAL.md`.