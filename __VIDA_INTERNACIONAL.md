# VIDA INTERNACIONAL — Documento maestro de fases

Última actualización: 2026-07-29

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
| FASE D | IA Bíblica Avanzada, nuevas fuentes, contexto histórico, comparaciones, cronologías, mapas y herramientas de estudio | **ACTIVA** |
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

### Bloque activo

**Bloque 1 — Diagnóstico y arquitectura.**

Revisar únicamente los archivos, rutas, datos y servicios relacionados con Biblia, Estudio Profundo, comparaciones y fuentes. Documentar el estado real, riesgos, dependencias y el primer incremento seguro antes de implementar funciones avanzadas.

No avanzar al Bloque 2 hasta que el diagnóstico y la arquitectura queden documentados.
