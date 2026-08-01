# VIDA INTERNACIONAL — Documento maestro de fases

Última actualización: 2026-07-31

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
| FASE D | IA Bíblica Avanzada, nuevas fuentes, contexto histórico, comparaciones, cronologías, mapas y herramientas de estudio | **ACTIVA — BLOQUE 3** |
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
- Bloque 3 — Contexto histórico y cultural: **ACTIVO**.
- Bloque 4 — Comparaciones y herramientas ampliadas: PENDIENTE.
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

### Bloque activo

**Bloque 3 — Contexto histórico y cultural.**

Crear una capa verificable de fragmentos históricos y culturales vinculados a fuentes aprobadas, con referencia canónica, atribución, licencia, revisión y recuperación exclusivamente en servidor.

El primer incremento debe implementar el modelo mínimo y el servicio de recuperación sin conectar todavía esos fragmentos a la IA, sin importar comentarios completos y sin modificar la Biblia general.

No avanzar al Bloque 4 hasta que el modelo de contexto, sus políticas, el servicio de recuperación y una visualización inicial estén documentados y validados en producción.
