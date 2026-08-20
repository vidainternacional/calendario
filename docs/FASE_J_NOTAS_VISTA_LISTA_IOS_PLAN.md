# FASE J — Evolución de Notas: vista de lista inspirada en iOS

Estado: **PLANIFICADA — posterior a FASE I**

Fecha de registro: 2026-08-20

## Origen de la decisión

El usuario solicita que **Notas tenga una vista de listas inspirada en la experiencia de Notas de iOS**. La imagen compartida por el usuario se considera únicamente referencia visual/funcional para la futura implementación.

**Regla expresa del usuario:** no generar imágenes para este requerimiento. No debe crearse una réplica gráfica artificial ni una imagen nueva; cuando FASE J se active se trabajará directamente sobre la interfaz real de VIDA tomando la referencia aportada como guía.

## Objetivo previsto

Evolucionar el Cuaderno/Notas existente para ofrecer una vista de lista mobile-first, clara, densa y familiar, inspirada en la organización de Notas de iOS, sin sustituir ni degradar las capacidades ya aprobadas del sistema de notas de VIDA.

## Garantías que deben preservarse

1. Mantener un único cuaderno canónico por usuario; no crear un segundo sistema de notas.
2. Conservar privacidad por defecto, aislamiento por usuario y RLS vigente.
3. Conservar sincronización entre dispositivos, cola offline, apertura en frío offline y recuperación al reconectar.
4. Mantener origen/contexto bíblico, filtros existentes, metadatos de predicación, correlativo, exportación y editor WYSIWYG.
5. Conservar el historial global Deshacer/Rehacer para contenido y metadatos reversibles.
6. Mantener paridad funcional entre experiencia online y offline.
7. No modificar estructuras sensibles de Supabase, RLS, grants o datos productivos sin propuesta exacta, impacto, reversión y aprobación explícita.

## Vista de lista prevista

Cuando FASE J se active, la interfaz deberá incorporar una vista de lista de Notas inspirada en iOS y adaptada a la identidad visual de VIDA. La implementación deberá priorizar:

- filas de nota compactas y táctiles;
- jerarquía clara entre título, fragmento de contenido y metadatos útiles;
- separación visual ligera en lugar de tarjetas anidadas innecesarias;
- desplazamiento fluido y superficie útil amplia en iPhone;
- acceso rápido desde la lista a la nota real, sin duplicar contenido;
- búsqueda, filtros y organización existentes integrados en la misma experiencia cuando correspondan;
- estados vacíos, carga y sincronización coherentes con el Cuaderno actual;
- accesibilidad y áreas táctiles cómodas;
- coherencia con el principio visual global y la navegación móvil aprobada de VIDA.

La referencia de Notas de iOS debe tratarse como inspiración de interacción, jerarquía y densidad, **no como una obligación de copiar exactamente la interfaz de Apple**.

## Regla de ejecución

Esta fase queda únicamente **documentada y planificada**. No debe abrirse, implementarse ni desplazar la prioridad activa mientras `__VIDA_INTERNACIONAL.md` mantenga FASE H como activa. Su ejecución comenzará solo después del cierre formal de FASE I o cuando el documento maestro cambie explícitamente el orden.
