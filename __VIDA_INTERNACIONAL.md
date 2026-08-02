# VIDA INTERNACIONAL — Documento maestro de fases

Última actualización: 2026-08-01

Fase activa: **FASE D — IA Bíblica Avanzada**

Este archivo es el control oficial y versionado del proyecto. Antes de trabajar debe leerse este estado y continuar únicamente con la fase marcada como activa.

## Reglas de ejecución

1. Trabajar exclusivamente sobre los objetivos de la fase activa.
2. No iniciar una fase posterior mientras la actual no figure como completada aquí.
3. Cada cierre debe incluir evidencia técnica, validación funcional y documentación.
4. Los hallazgos fuera de alcance se documentan para una fase posterior, sin ampliar la fase actual.
5. Los detalles históricos y técnicos permanecen en los documentos de `docs/` y en el historial de Git.

## Estado de fases

| Fase | Objetivo principal | Estado |
|---|---|---|
| FASE A | Experiencia profesional mobile first | COMPLETADA |
| FASE B | Optimización de UX, transiciones, carga, errores y retroalimentación | COMPLETADA |
| FASE C | Panel Pastoral, versículos, bosquejos, biblioteca y materiales | **COMPLETADA — 2026-07-29** |
| FASE D | IA Bíblica Avanzada, nuevas fuentes, contexto histórico, comparaciones, cronologías, mapas y herramientas de estudio | **ACTIVA — BLOQUE 4** |
| FASE E | Optimización General: rendimiento, seguridad, escalabilidad, pruebas y documentación | PENDIENTE |
| FASE F | Cuaderno correlativo de prédicas y notas | PENDIENTE |

## Cierre confirmado de FASE C

La Fase C fue cerrada después de confirmar:

- recorrido funcional completo del Centro Pastoral;
- acceso asignable y revocación inmediata;
- aislamiento de contenido por propietario;
- Biblia general completa dentro del proyecto pastoral;
- experiencia móvil de las herramientas;
- materiales publicados y navegación interna;
- estados de carga, error y vacío;
- integridad de relaciones, archivos y Storage;
- ausencia de errores recientes en producción.

Documentos de cierre:

- `docs/FASE_C_PANEL_PASTORAL.md`
- `docs/FASE_C_AUDITORIA_CIERRE.md`
- `docs/FASE_C_VALIDACION_ACCESO_2026-07-29.md`
- `docs/FASE_C_ALMACENAMIENTO_Y_LIMITES.md`

La auditoría detallada de textos, fuentes, alineaciones y espacios de toda la aplicación queda reservada para la Fase E.

## FASE D — Objetivo activo

Construir herramientas avanzadas de estudio bíblico apoyadas por fuentes verificables y una arquitectura segura, sin deteriorar la Biblia general ni las funciones pastorales terminadas.

### Alcance autorizado

- Diagnóstico del sistema actual de Biblia y Estudio Profundo.
- Inventario y evaluación de fuentes bíblicas e históricas.
- Contexto histórico y cultural con atribución clara.
- Comparaciones bíblicas y herramientas de estudio ampliadas.
- Cronologías y mapas.
- IA bíblica avanzada con controles de privacidad, costo y calidad.

### Fuera de alcance durante esta fase

- Auditoría visual y editorial global de la aplicación.
- Optimización general de rendimiento, seguridad y escalabilidad de la Fase E.
- Cuaderno correlativo de prédicas de la Fase F.
- Cambios amplios en la Biblia estable sin una necesidad demostrada y una validación aislada.

### Bloques

- Bloque 1 — Diagnóstico y arquitectura: **COMPLETADO**.
- Bloque 2 — Fuentes, atribución y privacidad: **COMPLETADO — 2026-07-31**.
- Bloque 3 — Contexto histórico y cultural: **COMPLETADO — 2026-08-01**.
- Bloque 4 — Comparaciones y herramientas ampliadas: **ACTIVO**.
- Bloque 5 — Cronologías y mapas: PENDIENTE.
- Bloque 6 — IA bíblica avanzada y proveedores: PENDIENTE.
- Bloque 7 — Pruebas, documentación y cierre: PENDIENTE.

### Evidencia del Bloque 1

- `docs/FASE_D_DIAGNOSTICO_Y_ARQUITECTURA.md`
- modelo de IA configurable y actualizado;
- esquema y validación de respuesta;
- caché versionado;
- RLS de propiedad corregida;
- preview `dpl_9Mfawd7aiUCvCtjqD2cQR4TRPMZZ` — `READY`.

### Evidencia del Bloque 2

- `docs/FASE_D_REGISTRO_FUENTES.md`;
- tabla `public.biblical_sources` y migración `registro_fuentes_biblicas`;
- matriz de seguridad 4 de 4;
- servicio de lectura exclusivamente en servidor;
- atribución y licencia visibles en Estudio Profundo;
- preview `dpl_BHyb9dnF9UGFvcsq3N9BLRgUmdGq` — `READY`;
- producción `dpl_DN5g5tLwJdhNLbkMngMsjUJJcn5V` — `READY`;
- commit `d33daca536549b912a4f9a9fb246e1060fb0ee77`;
- confirmación visual recibida el 2026-07-31.

### Evidencia del Bloque 3

- `docs/FASE_D_CONTEXTO_HISTORICO.md`;
- tabla `public.biblical_context_fragments` y relación obligatoria con fuentes aprobadas;
- RLS de solo lectura y recuperación exclusiva en servidor;
- fuente Pleiades aprobada con atribución y licencia CC BY 3.0;
- fragmentos iniciales de Roma para Romanos y Hechos 28;
- visualización en `/estudios/profundo` y en **Biblia → Estudio**;
- PR #22 y commit `307388550a9aa8ca1c50f2d75e664dc4906ef074`;
- producción inicial `dpl_s4hkspuCczLhsZPVMHmkPvrLjXnB` — `READY`;
- estado final validado en producción: commit `73f8458e316f1e0d4931456ccad02ef45cabc23e`, deployment `dpl_9iHrXP25gb2MG16DeTRNKiohmE6P` — `READY`;
- confirmación visual y funcional recibida el 2026-08-01.

### Bloque activo

**Bloque 4 — Comparaciones y herramientas ampliadas.**

Ampliar la experiencia de estudio dentro de la Biblia unificada con comparaciones estables y herramientas lingüísticas verificables, sin duplicar secciones ni presentar significados generados sin fuente.

El primer incremento debe:

- inventariar las comparaciones y herramientas ya existentes;
- definir el modelo mínimo para palabras originales, transliteración, significado contextual, referencias y fuente;
- evaluar fuentes léxicas y de concordancia compatibles con las reglas de atribución, licencia y privacidad del Bloque 2;
- mantener las herramientas dentro de **Biblia → Estudio**;
- no conectar todavía estos datos a la IA;
- no importar léxicos completos ni material con licencia incompatible.

No avanzar al Bloque 5 hasta que el modelo, la fuente inicial, la recuperación segura y una visualización funcional de las herramientas ampliadas estén documentados y validados en producción.
