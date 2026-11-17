# Centro Pastoral — Galería y edición de mensajes · 2026-11-17

## Pedido y alcance

El usuario validó lo demás del bloque previo y pidió ver los mensajes anteriores en una galería dentro del Centro Pastoral, corregir título/descripcion/video y poder eliminarlos. Implementado en la misma rama de revisión `agent/avisos-devocionales-20261117`, PR #317. No se publicó producción ni se modificó el maestro.

## Resultado preparado

- Centro Pastoral → Devocionales y mensajes muestra galería propia con miniaturas, estado Publicado/Borrador, búsqueda y filtros. Los formularios de Nuevo/Editar permanecen cerrados inicialmente; tocar la miniatura abre la edición.
- Se reutiliza el guardado existente para título, descripción, YouTube, categoría/serie y audiencia. Corregir una publicación existente conserva su estado y no envía otro aviso automáticamente.
- Editar, ver publicación, publicar/despublicar y reenviar pendientes permanecen disponibles. Nueva eliminación con confirmación explícita y alternativa Despublicar.
- Eliminar requiere sesión pastoral activa, UUID válido, autoría y revisión exacta. El formato legado valida además que sea un mensaje de video sin bosquejo/colección/recursos antes de borrar; no permite eliminar otros paquetes desde esta ficha.
- No usa service role ni cambia autorías/roles/audiencias. Cada pastor administra sus propios mensajes; no se concede gestión sobre publicaciones de otros autores.
- Límites existentes de carga conservados: hasta 100 mensajes dirigidos y 50 del formato legado por autor. Los filtros operan sobre esa carga; no declarar paginación ilimitada implementada.

## Bloqueo comprobado y propuesta pendiente de aprobación

Consulta de catálogo en ccvida, sin leer contenido personal: `authenticated` tiene privilegio DELETE en ambas tablas. `pastoral_paquetes` ya posee política DELETE propia con acceso pastoral; `vida_devocionales` solo posee SELECT/INSERT/UPDATE y ninguna política DELETE. Por ello, su RLS actualmente impide eliminar devocionales incluso desde la nueva action.

Preparado, **NO APLICADO**: `supabase/migrations/20261118000100_vida_devocionales_eliminacion_autor.sql`.

Cambio exacto propuesto: una política `vida_devocionales_eliminar_autor`, solo DELETE para `authenticated`, únicamente cuando `autor_id = auth.uid()` y el perfil tiene `activo=true`, `estado_cuenta='activo'` y rol pastor/administrador. No amplía SELECT/INSERT/UPDATE ni gestión de publicaciones ajenas. No agrega grants, tablas ni campos y no elimina filas al aplicarla.

Impacto: un autor pastoral activo podrá borrar definitivamente sus propios videos desde VIDA, después de confirmar; el video original en YouTube no se borra. La eliminación no tiene Deshacer. Antes de borrar contenido importante, optar por Despublicar o conservar copia editorial.

Reversión del permiso: `drop policy if exists vida_devocionales_eliminar_autor on public.vida_devocionales;`. Esto vuelve a bloquear nuevas eliminaciones, pero no recupera filas ya eliminadas por un autor. Se conservan registros de avisos; no se limpian publicaciones ni historiales desde esta sesión.

La regla vigente del maestro, Reglas de ejecución 9 y FASE G alcance 9, exige presentar alcance, impacto y reversión antes de modificar RLS en producción. Solicitar aprobación específica **al finalizar** la preparación; no ejecutar automáticamente esta migración por existir en Git.

## Evidencia y pendientes

- 40 pruebas pertinentes pasan: 35 anteriores de publicación/reenvío/badges/recordatorio y 5 adicionales de eliminación (sesión/rol/estado, autor/revisión, fallo RLS/concurrencia, protección de paquetes legados y alcance del SQL propuesto).
- TypeScript, lint del editor y ambas actions, compilación local completa correctos. Sin afirmar CI general verde; fallos heredados permanecen fuera de alcance.
- Browser aislado a 390 px con componente real y acciones simuladas: búsqueda, edición de título y video conservando publicado, cancelar sin borrar y confirmación única; sin desbordamiento. No equivale a prueba autenticada con datos reales.
- Ningún video, publicación, usuario o registro de envío se modificó; ningún push real enviado. No se aplicó SQL.
- Recibo del único Preview de esta ampliación en PR #317: verificar SHA y READY antes de retomar. Misma rama/alias, sin crear una segunda aplicación.
- Pendiente: validación visual del usuario; autorización específica y aplicación/cotejo de política DELETE para devocionales; autorización nueva de merge/producción. PR #313 y #316 siguen separados.
