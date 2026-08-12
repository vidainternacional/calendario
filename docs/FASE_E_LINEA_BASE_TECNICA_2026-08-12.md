# FASE E — Línea base técnica — 2026-08-12

Estado: línea base inicial levantada sobre `main` después del cierre de FASE D; primer bloque seguro de confiabilidad y rendimiento en validación sobre Preview.

Esta revisión es diagnóstica. No se modificaron RLS, grants, políticas, índices ni datos sensibles de Supabase durante el levantamiento ni durante los ajustes seguros documentados aquí.

## 1. Aplicación y build

- Next.js: `16.2.10` con Turbopack.
- React / React DOM: `19.2.4`.
- TypeScript: `^5`.
- Node configurado en CI: 24.
- Producción Vercel correspondiente al cierre de FASE D/arranque de FASE E: READY.
- Build observado: compilación ~23.7 s, TypeScript ~16.6 s, 34/34 páginas generadas, build total ~46 s.
- No se observaron logs `error`, `fatal` o `warning` de runtime en Vercel durante la ventana consultada de 24 h.

## 2. Confiabilidad de dependencias y CI

### Hallazgo inicial — prioridad alta

GitHub Actions no podía ejecutar una instalación reproducible con `npm ci`.

Causa comprobada:

- `package.json` incluye `framer-motion@^12.43.0`.
- `package-lock.json` no fue actualizado cuando se añadió esa dependencia.
- CI reportaba faltantes `framer-motion@12.43.0`, `motion-dom@12.43.0` y `motion-utils@12.39.0`.
- `framer-motion` sí es dependencia funcional del Calendario aprobado; no debía retirarse como atajo para reparar CI.

### Resolución aplicada en Preview

El lockfile fue regenerado mediante npm en un runner limpio de GitHub con Node 24, sin editar manualmente las resoluciones del árbol de dependencias.

Validación ejecutada antes de guardar el resultado:

- `npm install --package-lock-only --ignore-scripts`: **OK**;
- `npm ci --ignore-scripts`: **OK**;
- commit resultante: `90c01fc2a70c49f45b1d6fc5a2ff05a72259f58e`;
- el workflow temporal usado únicamente para regenerar y verificar el lockfile se eliminó a sí mismo antes de guardar el commit final, por lo que no permanece como infraestructura del proyecto.

Con esto queda resuelta la desincronización de `package.json` / `package-lock.json`. La validación final del workflow general `ci-temporal.yml` se ejecuta sobre el mismo lockfile mediante el siguiente commit normal de la rama.

## 3. Pruebas automatizadas

- `package.json` no define script `test`.
- El directorio `tests/` contiene actualmente un fixture SQL histórico de Abdías.
- El workflow general `ci-temporal.yml` valida instalación, lint informativo y build.
- La barrera previa de `npm ci` quedó corregida en Preview; el siguiente nivel de FASE E es convertir el CI recuperado en una base de regresión gradual sin rediseñar módulos ya aprobados.

## 4. Supabase — tamaño y actividad

Tablas de mayor tamaño observadas:

- `biblical_word_occurrences`: ~914 MB / ~610k filas.
- `biblical_verse_texts`: ~181 MB / ~124k filas.
- `biblical_timeline_event_references`: ~28 MB.
- `biblical_lexical_entries`: ~22 MB.
- `biblical_place_references`: ~13 MB.
- `biblical_textual_variants`: ~12 MB.

Las consultas bíblicas de referencia presentan un uso fuerte de índices frente a escaneos secuenciales. No se añadirán índices de forma indiscriminada; cada ajuste deberá justificarse con consulta/ruta caliente y plan de medición.

`pg_stat_statements` está habilitado y se utilizó únicamente para lectura de métricas.

## 5. Consultas de producción observadas

Entre las consultas PostgREST con mayor carga acumulada:

- `get_unread_publications_count()`: ~3,673 llamadas, ~42.5 s acumulados, ~11.6 ms de media.
- `get_next_visible_calendar_item()`: ~525 llamadas, ~8.9 s acumulados, ~17 ms de media.
- `get_visible_pastoral_packages()`: ~1,051 llamadas, ~6.3 s acumulados, ~6 ms de media.
- consulta simple de estado de `profiles`: ~43,931 llamadas, ~0.07 ms de media; barata individualmente, pero evidencia amplificación de solicitudes.

Los logs API del iPhone mostraron varias llamadas idénticas a `get_unread_publications_count()` en el mismo instante. El primer cambio seguro de FASE E deduplica esa lectura a nivel de cliente sin cambiar la semántica del badge.

## 6. Seguridad — hallazgos sin aplicar cambios

Supabase Advisor señaló funciones `SECURITY DEFINER`, políticas RLS costosas, grants amplios heredados y otras advertencias. Se verificaron los privilegios efectivos antes de clasificarlos.

### Prioridad alta — requiere plan sensible y aprobación antes de cambiar

`sincronizar_calendarios_publicos_usuario(p_user_id uuid)` es `SECURITY DEFINER`, aparece ejecutable por `anon` y realiza escrituras de suscripciones de calendario usando el identificador recibido. Debe revisarse el contrato real de llamadas y después presentar una migración de endurecimiento con reversión. **No se modificó en esta línea base.**

### Otros hallazgos a revisar

- funciones `SECURITY DEFINER` con grants más amplios de lo necesario;
- `pg_net` instalado en esquema `public`;
- protección de contraseñas filtradas de Supabase Auth deshabilitada;
- tablas con RLS y sin políticas, que por defecto permanecen cerradas al cliente;
- muchas políticas con `auth.uid()` evaluable por fila (`auth_rls_initplan`);
- múltiples políticas permisivas sobre varias tablas;
- foreign keys sin índice que deberán priorizarse según tráfico real.

No se revocaron permisos ni se reescribieron políticas durante este bloque.

## 7. Clasificación inicial

| Impacto | Hallazgo | Tipo | Acción |
|---|---|---|---|
| Alto | función de sincronización de calendarios con privilegio amplio | Seguridad sensible | presentar plan + reversión antes de tocar |
| Alto | `package-lock.json` desincronizado; CI bloqueado en `npm ci` | Confiabilidad | **resuelto en Preview; validar CI general** |
| Medio | tormenta de llamadas duplicadas al contador de Avisos | Rendimiento seguro | **deduplicado en Preview; volver a medir tras promoción** |
| Medio | RLS `auth_rls_initplan` / políticas permisivas múltiples | Seguridad/rendimiento sensible | analizar por tabla y migrar solo con plan |
| Medio | `get_next_visible_calendar_item()` ~17 ms medio | Rendimiento | revisar frecuencia y plan de ejecución antes de optimizar |
| Medio | falta de suite general de regresión | Pruebas | construir cobertura gradual en FASE E |
| Bajo/por validar | índices reportados como no usados | Escalabilidad | no eliminar con una muestra pequeña |

## 8. Primer bloque seguro

El primer bloque seguro agrupa dos correcciones sin cambios de permisos ni datos:

1. Deduplicación compartida del contador de Avisos:
   - una sola solicitud en vuelo para `get_unread_publications_count()`;
   - un único ciclo global de polling por documento;
   - colapso de ráfagas mount/focus/visibility mediante ventana corta de deduplicación;
   - actualización forzada después de marcar una publicación como leída;
   - sin cambiar el significado ni la apariencia del badge.

2. Recuperación de instalación reproducible:
   - `package-lock.json` regenerado por npm conservando Framer Motion;
   - instalación congelada con `npm ci --ignore-scripts` verificada en runner limpio;
   - sin reducir ni sustituir la funcionalidad de transiciones del Calendario;
   - sin dejar workflows temporales en el árbol final.

Las modificaciones de seguridad/RLS/grants permanecen bloqueadas hasta presentar alcance, impacto y reversión.
