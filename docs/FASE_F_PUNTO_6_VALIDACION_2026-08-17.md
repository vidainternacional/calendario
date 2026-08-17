# FASE F — Validación final del punto 6

Fecha: 2026-08-17

## Alcance validado

Este documento registra la validación funcional y técnica del punto 6 de FASE F: conservar y aprovechar origen y contexto bíblico de cada nota para organización y filtrado sin duplicación.

La validación se realizó sobre el Preview de PR #284 antes de fusionar a `main`.

## Resultado funcional

- `Biblia → Notas` y Estudio Profundo alimentan un único cuaderno canónico.
- Una misma nota no se duplica para representar categorías, filtros u orígenes.
- Se conserva el origen canónico (`biblia_notas` o `estudio_profundo`) y el contexto disponible de referencia, pasaje normalizado, paquete y metadatos de predicación.
- Los filtros por tipo y origen operan sobre la misma fila canónica.
- Estudio Profundo puede guardar/abrir la nota correspondiente sin crear sistemas paralelos.
- La navegación exacta desde resultados bíblicos conserva libro, capítulo y versículo.
- El editor actual mantiene historial global Deshacer/Rehacer, formato, metadatos y exportación aprobados.

## Paridad online/offline validada

La experiencia offline dejó de depender de la réplica histórica `public/offline/notas.html` como fallback activo.

El service worker utiliza `/biblia/notas-offline`, que monta el mismo `BibleNotesWorkspace` React utilizado por el Cuaderno online. Por tanto, online y offline comparten literalmente:

- layout del Cuaderno;
- notas y selección;
- búsqueda;
- filtros por tipo y origen;
- editor y herramientas;
- historial reversible;
- datos de predicación;
- estilos y jerarquía visual.

El service worker `vida-shell-v2.3-cuaderno-react-real` precachea el shell público y los recursos `/_next/static/` necesarios para hidratarlo. No cachea contenido privado de notas, respuestas de Supabase, API ni HTML autenticado del usuario.

La identidad offline continúa ligada al UUID validado del usuario. Si falta el marcador activo, la recuperación solo puede inferir un dueño cuando existe exactamente un único cuaderno local con UUID válido.

La capa de sincronización evita consultas remotas cuando `navigator.onLine === false` y utiliza la misma caché/cola local canónica ya validada.

## Validación real en iPhone

El usuario confirmó en iPhone que, después de abrir el Cuaderno con conexión y actualizar el service worker, al activar modo avión y volver a cargar el Cuaderno la interfaz offline se ve y funciona como la experiencia online actual, eliminando la apariencia de la versión antigua.

Validación del usuario: **APROBADA**.

## Evidencia técnica

Head validado antes de este documento: `53ecb57988df1f0dd3558141a45e190483fd6d41`.

CI asociado:

- 122 regresiones: OK;
- lint: OK;
- build Next.js: OK;
- validación del documento maestro: OK;
- validaciones TAHOT relacionadas: OK.

Preview estable utilizado para la validación:

`calendario-git-agent-fase-f-cuaderno-094b58-vida-internacional.vercel.app`

## Seguridad y datos

Este cierre no requiere cambios de:

- esquema de Supabase;
- RLS;
- grants;
- funciones SQL;
- datos de producción.

No se persisten prompts, texto de notas ni contenido privado dentro del service worker.

## Estado del punto 6

**VALIDADO EN PREVIEW — listo para integración a `main`.**

PR #284 permanece abierto y sin fusionar. No se desplegó manualmente a producción.

## Actualización propuesta para `__VIDA_INTERNACIONAL.md`

Al integrar PR #284, el documento maestro debe dejar de señalar el punto 6 como pendiente y registrar:

1. el cuaderno único entre Biblia y Estudio Profundo;
2. conservación de origen/contexto sin duplicación;
3. filtros canónicos online/offline;
4. paridad offline mediante el mismo `BibleNotesWorkspace` React;
5. validación funcional real en iPhone;
6. CI/build verde;
7. ausencia de cambios adicionales de Supabase/RLS/grants.

Después de que `main` refleje formalmente este cierre y producción sea validada, se podrá evaluar el cierre completo de FASE F. Hasta entonces FASE F permanece ACTIVA y no se debe iniciar una fase posterior.