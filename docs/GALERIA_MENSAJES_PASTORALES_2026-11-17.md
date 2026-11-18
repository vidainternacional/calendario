# Centro Pastoral — Galería y edición de mensajes · 2026-11-17

## Estado vigente — 2026-11-18: administración general autorizada y aplicada

El usuario autorizó expresamente: «Si solo administradores activos podrán hacerlo», respondiendo a permitir que el rol Administrador activo gestione mensajes de otros autores, incluidos borradores, conservando autoría. Esta autorización aplica a RLS y a la gestión del Centro Pastoral; no autoriza merge ni publicación de la aplicación en producción.

- Aplicada en ccvida la migración `vida_devocionales_gestion_administrador_20261118`, fuente `20261118000200_vida_devocionales_gestion_administrador.sql`: tres políticas adicionales SELECT/UPDATE/DELETE, exigiendo rol administrador, activo=true y estado_cuenta=activo. Políticas previas del autor y audiencia conservadas.
- Trigger SECURITY INVOKER impide modificar UUID y autoría incluso a través de la API. No se cambian roles de usuarios ni se usa service role en las consultas de gestión.
- La galería consulta con JWT y permite al administrador cargar mensajes dirigidos de otros autores. Pastor mantiene filtro de autor propio; miembros no acceden a la gestión. Las actions comprueban nuevamente rol/estado y preservan revisión concurrente y autor original. Publicar/reintentar desde administración usa el autor original para resolver la publicación; no se envían pruebas a la congregación.
- Solo administrador activo ve y puede ejecutar Eliminar para devocionales. **La propuesta anterior de eliminación por autor/pastor nunca se aplicó y se retiró del directorio de migraciones**; no aplicarla ni recuperarla de commits anteriores.
- Borradores dirigidos indican que son visibles al autor y a administradores activos. Estudios conserva únicamente contenido publicado; la gestión permanece en Centro Pastoral.
- No se amplían permisos en `pastoral_paquetes`: formatos legados siguen sus políticas propias existentes. La gestión general nueva se limita a `vida_devocionales`.
- Verificación de catálogo tras aplicar: RLS activa, seis políticas (tres originales + tres de administrador), un trigger de identidad/autoría; una publicación, misma huella antes/después `0454e8ce55adf889b15adcfa2dc62d9c`. No se ejecutó un borrado ni modificación de contenido para probar. No se suplantaron sesiones.
- 45 pruebas pertinentes pasan, incluyendo administrador editando sin reatribuir ni avisar al corregir, reenvío con autor original, rechazo de administrador inactivo, consulta general para administrador y propia para pastor, y rechazo de eliminación por pastor. TypeScript/lint específico/build local correctos; browser aislado móvil con acciones simuladas. Falta validación visual autenticada del usuario, no se certifica entrega a teléfonos ni CI global.
- Único enlace de entrada acordado: `https://calendario-git-agent-avisos-devociona-15ceac-vida-internacional.vercel.app/inicio`. Navegar desde ahí a Centro Pastoral → Devocionales y mensajes. No alternar con alias antiguos ni enlaces únicos de deployments. Recibo de SHA/READY del bloque en PR #317.
- Reversión del permiso: DROP POLICY de `vida_devocionales_admin_leer`, `vida_devocionales_admin_editar`, `vida_devocionales_admin_eliminar`; DROP TRIGGER `vida_devocionales_autoria_inmutable`; DROP FUNCTION `vida_devocionales_conservar_autoria()`. Conservar datos y registros de avisos. No recupera publicaciones que un administrador haya eliminado voluntariamente.

**Las secciones siguientes son antecedentes del estado anterior y sus bloqueos quedan superados solo en el alcance anterior.**

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
