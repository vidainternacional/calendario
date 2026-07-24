# FASE B — Optimización de UX

Estado: EN PROGRESO — REVISIÓN TRANSVERSAL

Objetivo: mejorar la percepción de fluidez, claridad y respuesta del sistema después del cierre de la FASE A.

## Alcance

- Animaciones discretas y funcionales.
- Transiciones consistentes.
- Retroalimentación visual de acciones.
- Estados vacíos claros y útiles.
- Estados de carga coherentes.
- Manejo visual y recuperable de errores.

## Reglas

- No reabrir la auditoría general de pulido móvil salvo regresión directa.
- Evitar animaciones decorativas que retrasen tareas.
- Respetar `prefers-reduced-motion`.
- Mantener lenguaje humano y orientado a la iglesia.
- Aplicar cambios pequeños, verificables y reversibles.

## Orden de trabajo

1. Estados globales de carga y error. — COMPLETADO
2. Retroalimentación de acciones principales. — COMPLETADO
3. Estados vacíos de módulos principales. — COMPLETADO
4. Transiciones de navegación y paneles. — COMPLETADO
5. Revisión transversal de consistencia. — EN PROGRESO

## Estado actual

| Área | Carga | Error | Estado vacío | Retroalimentación | Estado |
|---|---|---|---|---|---|
| Área autenticada global | Skeleton alineado con layout y áreas seguras | Recuperable con reintento e Inicio | No aplica | Toasts globales | Completado |
| Inicio | Carga global disponible | Cobertura global | Orientado y útil | Acciones con respuesta | Completado |
| Calendario | Carga global disponible | Cobertura global | Orientado y útil | Acciones con respuesta | Completado |
| Avisos | Carga y envío visibles | Cobertura global y reporte de push | Orientado y útil | Toasts y estado de envío | Completado |
| Biblia / Estudios | Cargas locales visibles | Global y errores locales | Favoritos y recursos orientados | Favoritos, voz y lectura con respuesta | En revisión transversal |
| Perfil | Carga global disponible | Cobertura global | Ministerios con salida útil | Acciones con respuesta | Completado |
| Ministerios | Carga global disponible | Cobertura global | Primer ingreso y ausencia orientados | Solicitud con respuesta | Completado |
| Administración | Carga global disponible | Cobertura global | Pendientes, usuarios y ministerios orientados | Formularios y membresías con respuesta | En revisión transversal |

## Bloques completados

- Error global recuperable.
- Retroalimentación global de acciones.
- Corrección y validación de notificaciones push de Avisos.
- Estados vacíos de Inicio, Calendario, Avisos, Biblia, Perfil, Ministerios y Administración.
- Jerarquía visual de fichas de Avisos.
- Claridad de recursos disponibles y próximos en Estudios.
- Modos de lectura, selector de voz y estilos de entonación en Biblia.
- Transición de navegación inferior, diálogos, paneles y hojas móviles.
- Alineación del skeleton global con el layout autenticado.
- Coherencia temática de controles y selección en el lector bíblico.

## Pendiente antes de cerrar la fase

- Completar la revisión transversal de errores locales y acciones de reintento.
- Revisar consistencia final de botones primarios, secundarios y destructivos.
- Confirmar en producción los últimos ajustes del lector bíblico.
- Registrar la evidencia final y proponer el cierre en `__VIDA_INTERNACIONAL.md` únicamente cuando estos puntos estén completados.
