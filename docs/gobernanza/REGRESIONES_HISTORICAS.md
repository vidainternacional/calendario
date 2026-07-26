# Regresiones Históricas

Estado: VIVO

Este archivo registra errores que ya ocurrieron para evitar repetirlos.

## RH-001 — Cambios globales que corrigen una pantalla y rompen otras

Patrón observado:

- estilos o componentes transversales aplicados con alcance demasiado amplio;
- la pantalla objetivo mejora, pero otras rutas cambian sin revisión.

Prevención:

- limitar selectores y componentes por módulo;
- probar rutas críticas;
- usar laboratorio para cambios globales;
- comparar con la baseline.

## RH-002 — Desajustes de hidratación

Patrón observado:

- HTML generado en servidor distinto al primer render del cliente;
- uso de valores variables, formato dependiente del navegador o extensiones que alteran el DOM.

Prevención:

- mantener determinista el primer render;
- evitar `Date.now()`, `Math.random()` o ramas de `window` en contenido SSR;
- mover diferencias del navegador a efectos posteriores cuando proceda;
- revisar anidamiento HTML.

## RH-003 — Caché de Next/Turbopack después de cambios

Patrón observado:

- errores persistentes o compilación incoherente por artefactos en `.next` o directorios de build.

Solución aplicada históricamente:

- detener el servidor;
- eliminar artefactos de compilación;
- reconstruir desde cero.

Prevención:

- no asumir que todo error posterior a una actualización es del código;
- comprobar caché cuando el comportamiento contradice el estado del repositorio.

## RH-004 — Permisos de instalación global en macOS

Patrón observado:

- `EACCES` al instalar herramientas globales porque directorios o archivos pertenecen a `root`.

Prevención:

- evitar ejecutar instalaciones de npm con `sudo` sin necesidad;
- revisar propietario de rutas globales;
- usar un administrador de versiones de Node o prefijo de usuario.

## RH-005 — Pulido móvil con CSS demasiado genérico

Riesgo:

- una corrección de tablas o formularios puede afectar componentes que no compartían el mismo problema.

Prevención:

- encapsular el pulido móvil;
- revisar formularios, tablas, modales y navegación por separado;
- no eliminar las capas recientes sin evidencia.

## Formato para nuevas entradas

Cada regresión nueva debe registrar:

- síntoma;
- causa confirmada o hipótesis;
- solución aplicada;
- módulos afectados;
- prueba que confirma la corrección;
- regla preventiva.