# FASE E — Cierre técnico

Fecha: 2026-08-13

Estado propuesto: **COMPLETADA**, sujeto a la actualización y fusión del documento maestro `__VIDA_INTERNACIONAL.md`.

## Alcance cerrado

FASE E cubrió rendimiento, seguridad, escalabilidad, regresiones, recuperación de red, latencia transversal de Avisos/push y documentación, preservando las interfaces y flujos aprobados de fases anteriores.

## 1. Línea base y rendimiento

- Línea base documentada en `docs/FASE_E_LINEA_BASE_TECNICA_2026-08-12.md`.
- Stack validado: Next.js 16.2.10, React 19.2.4 y Node 24 en CI.
- Build reproducible con `npm ci` y generación completa de 34/34 páginas.
- Navegación móvil optimizada sin precarga masiva: BottomNav mantiene `prefetch={false}` y precarga únicamente por intención del usuario.
- Se eliminó la consulta duplicada del próximo elemento de calendario.
- Los loaders de cliente usan sesión local cuando corresponde, conservando validación de servidor con `getUser()` y guardia de estado de cuenta.
- No se añadieron índices especulativos: la evidencia actual no los justifica.

## 2. Seguridad Supabase

Se revisaron grants, funciones SECURITY DEFINER y exposición RPC relevante.

### Cambios aplicados y verificados

- Concordancias bíblicas: acceso de lectura autenticado conservado; sin apertura de escritura.
- `sincronizar_calendarios_publicos_usuario(uuid)`: ejecución directa retirada de PUBLIC/anon/authenticated; uso interno preservado.
- `aceptar_solicitud_contacto(uuid)`: ejecución pública/anónima retirada; authenticated y service_role preservados.
- Cuatro funciones usadas exclusivamente como triggers internos de calendario: ejecución directa retirada de PUBLIC/anon/authenticated, sin deshabilitar triggers.
- `trg_sincronizar_calendarios_publicos_profile()`: función SECURITY DEFINER sin trigger activo ni referencias de aplicación; ejecución directa retirada de PUBLIC/anon/authenticated, conservando service_role y postgres.

Las migraciones finales están versionadas en:

- `supabase/migrations/20260813163657_fase_e_restringir_aceptar_solicitud_contacto.sql`
- `supabase/migrations/20260813164312_fase_e_restringir_exec_triggers_calendario.sql`
- `supabase/migrations/20260813224907_fase_e_restringir_exec_trigger_profile_huerfano.sql`

Commit de sincronización documental de estas tres migraciones: `5718db3dd4da671ea36ecbad15f486f7e79f479f`.

## 3. Escalabilidad

Revisión actual de tamaños y consultas:

- `biblical_word_occurrences`: ~610,933 filas, ~914 MB.
- `biblical_verse_texts`: ~124,504 filas, ~181 MB.
- `biblical_timeline_event_references`: ~17,570 filas, ~28 MB.
- `biblical_lexical_entries`: ~16,946 filas, ~22 MB.
- Tablas operativas siguen pequeñas: `publicaciones` ~34 filas, `publicacion_lecturas` ~43, `eventos` ~10, `ministerios` ~10, `profiles` ~7 y `push_subscriptions` ~5.

Consultas operativas principales observadas en `pg_stat_statements`:

- `get_unread_publications_count()`: ~3,990 llamadas acumuladas, media ~11.5 ms.
- `get_next_visible_calendar_item()`: media ~16.6 ms.
- `get_visible_pastoral_packages()`: media ~6.1 ms.
- Consultas habituales de publicaciones, ministerios y asignaciones: medias aproximadas de 1–3 ms.

Conclusión: no existe evidencia para añadir índices nuevos en tablas operativas en este momento. El crecimiento debe vigilarse por latencia y volumen real antes de introducir complejidad adicional.

## 4. Regresiones y CI

- Suite `tests/regression/fase-e-contracts.test.mjs` ejecutada con `node:test`.
- Script `npm run test:regression` integrado al proyecto.
- Workflow CI ejecuta regresiones antes de lint/build.
- Contratos cubren autenticación/guardias, navegación, refresco de badges, recuperación de red y reanudación de la PWA.
- PRs de FASE E relevantes pasaron CI antes de fusionarse.

## 5. Red, reanudación y Avisos

Se cerró el problema transversal de sincronización sin introducir polling agresivo ni rediseñar pantallas.

Secuencia de mejoras:

- Badge de Avisos refrescado por push y con cola de refresco forzado para evitar carreras.
- Recuperación al volver `online` para badge, indicadores y suscripción push.
- Inicio y Avisos refrescan su contenido visible al recuperar conexión.
- `Avisos para ti` se desacopló del refresco completo de Inicio para consultar publicaciones de forma independiente.
- El aumento confirmado del badge dispara también el refresco de contenido visible.
- iPhone/PWA ya no depende únicamente del evento `online`: Inicio y Avisos reaccionan además a `focus` y `visibilitychange`, con un único reintento corto a los 2 segundos.

Validación funcional real del 2026-08-13: tras recuperar conectividad/reanudar VIDA, el badge de Avisos y `Avisos para ti` actualizaron rápido y prácticamente al mismo tiempo, sin recarga manual ni cambio de pantalla.

Commit final validado para recuperación/reanudación: `2927f18ecb2a69ea44e720a2895a4b52cc046796`.

## 6. Push

- El servidor entrega las solicitudes Web Push inmediatamente al proveedor y se observaron respuestas de aceptación exitosas.
- VIDA utiliza TTL de 24 horas y urgencia `high`.
- La UI ya no depende de la llegada del push para refrescar contenido cuando la PWA vuelve a estar activa.
- La latencia de entrega final después de recuperar red puede depender de iOS/Web Push y queda fuera del control directo del cliente una vez aceptada la entrega por el proveedor.

## 7. Runtime

No se detectaron errores funcionales nuevos de producción al cierre.

Permanece un warning no bloqueante de Node `DEP0169` (`url.parse()`) asociado al flujo `/avisos`. El repositorio no usa `url.parse()` directamente; el flujo servidor utiliza `web-push` 3.6.7. Se documenta como deuda de dependencia y no se modifica durante el cierre porque el envío push está validado y funcional.

## 8. Producción y evidencia de commits

Hitos principales de FASE E:

- Línea base: `54f793a58627cf46470e29509f2984e50e3bc3bb`.
- Seguridad de sincronización: `d88ebf3bcfd94b88be7153c74e98769b635b8149`.
- Acceso público/autenticado: `46e77d...`.
- Navegación/rendimiento: `3dad560...`.
- Badge/push inicial: `2e40dafedee6f7a52e5c2249aa2221a8b52e792d`.
- Corrección de carrera de badge: `17e5fa51249687c637e8c3ef596059f7cac69a16`.
- Regresiones CI: `fb7e1b715e158e0f09d95f4b2405c753de6c47c3`.
- Recuperación de red: `b9356ea4b0a975e56a8eb041a235daad8c6452e9`.
- Refresco visible al reconectar: `85a5ec98bb39f3f8b17ea9b2ded2e752164ac635`.
- Sincronización contenido/badge: `fa5d00919d114e5a0c28d8d16756e532f3ed951e`.
- Reintento de reconexión: `187b20659b98465b567126bf06fbbe372573bd1a`.
- Avisos de Inicio independientes: `9cde0c16dc19965b766a8b4ba046418a323e3eb5`.
- Badge confirmado → contenido: `5019e3147e4a09f474203c8c7ed9244694ea1406`.
- Reanudación resiliente PWA: `2927f18ecb2a69ea44e720a2895a4b52cc046796`.
- Seguridad final versionada: `5718db3dd4da671ea36ecbad15f486f7e79f479f`.

## Conclusión

Los objetivos documentados de FASE E cuentan con evidencia técnica, CI, producción y validación funcional real. No quedan cambios obligatorios de rendimiento, seguridad, escalabilidad, regresión o recuperación de red que bloqueen el cierre.

El warning de dependencia `DEP0169` queda documentado como deuda no bloqueante. El Piloto Operativo permanece pausado.

FASE F no debe comenzar hasta que `__VIDA_INTERNACIONAL.md` refleje formalmente FASE E como **COMPLETADA**.
