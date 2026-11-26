# Historial privado de Estudio Profundo — propuesta lista para aprobación

## Solicitud y causa comprobada

El usuario solicita volver a abrir búsquedas y respuestas sin consumir IA para generarlas otra vez. La pantalla anterior solo consultaba diez registros del generador antiguo; la nueva capa de preguntas no persistía sus resultados. Su listado se ocultaba al mostrar resultados y los botones volvían a ejecutar la búsqueda.

Inspección remota exclusivamente de estructura, políticas y recuento: la tabla antigua `estudios_profundos_ia` permite lectura a cuentas activas, sin filtro obligatorio de propietario en su política SELECT. Tiene cero filas en el recuento comprobado. No se leyeron preguntas personales ni se cambió esa tabla. No es el lugar adecuado para guardar preguntas privadas nuevas.

## Cambio preparado

1. Historial visible mediante un desplegable propio, inicialmente cerrado, también después de una búsqueda. Lista paginada de 25 entradas con pregunta, fecha y total; no descarga todas las respuestas para listar.
2. Guardado automático de respuestas completas y satisfactorias, estudios y lugares. No guarda errores, sugerencias, aclaraciones pendientes ni estados de IA desconectada.
3. Abrir un registro devuelve el snapshot de la respuesta y sus citas sin pasar por el generador. Sirve desde otro dispositivo con la misma cuenta y conexión. No es almacenamiento offline nuevo.
4. Si se vuelve a enviar exactamente una consulta ya guardada para la misma traducción/versión, el servidor la recupera antes de la lectura editorial o IA. Tolera mayúsculas y espacios; conserva tildes, puntuación y negación para no confundir preguntas distintas.
5. Una fila por persona/consulta/traducción/versión evita duplicar almacenamiento. Dos primeras solicitudes simultáneas desde dispositivos distintos todavía podrían alcanzar el proveedor antes del primer guardado; no se promete exclusión distribuida de generación.
6. Se muestra que la respuesta es guardada y su fecha. Si falla el guardado, mantiene la respuesta visible y avisa; si no puede comprobar el historial de una pregunta, no la reenvía a IA. No se ocultan fallos ni se truncan respuestas grandes.
7. Cada persona puede eliminar una respuesta propia mediante confirmación explícita. La confirmación aclara que buscarla otra vez podría consumir IA. No hay limpieza masiva ni retención/borrado automáticos.
8. El componente se identifica por el usuario autenticado para no reutilizar su estado al cambiar de cuenta. Las notas y sus metadatos/guardado/sincronización no se modifican.

Las respuestas de consultas anteriores que no se persistieron no pueden recuperarse retrospectivamente desde esta tabla nueva. El historial comenzará con las respuestas guardadas por esta versión. No se inventan ni reconstruyen respuestas antiguas como si fueran las originales.

## SQL exacto pendiente de autorización

Propuesta ejecutable: `docs/sql/estudio-historial-privado.sql`.

Único objeto de datos nuevo: `public.estudio_historial_privado`, con identificador, propietario, pregunta, clave/versionado, tipo, respuesta JSON y fecha. Incluye índice de recientes y unicidad por propietario/clave/versión.

Seguridad nueva solo para esa tabla:

- RLS habilitada.
- `anon` y `public` sin acceso.
- Cuatro políticas nuevas: leer, insertar, actualizar y eliminar únicamente si el propietario coincide con la sesión y la cuenta está activa. UPDATE incluye USING y WITH CHECK para impedir transferir propiedad.
- No concede acceso global al historial a administradores/pastores de la aplicación. Esto no elimina la autoridad operativa del propietario de la base de datos.
- Las acciones del servidor comprueban sesión y filtran por propietario; no usan service-role. Un identificador ajeno no permite leer ni borrar el registro.
- No cambia roles, políticas/grants de otras tablas, notas, autenticación, corpus ni datos ya existentes. No hay importación de filas privadas, cron, disparadores o llamadas a IA en SQL.

**Estado: no aplicado a Supabase.** No crear la tabla, migración remota, políticas o grants hasta recibir aprobación específica del propietario después de presentar esta propuesta. El documento maestro exige «No modificar Supabase/RLS/permisos/datos sensibles sin presentar antes cambio exacto, impacto y reversión y recibir aprobación explícita». El pedido funcional autoriza preparar la implementación, pero no acredita la aprobación de un alcance SQL que todavía no se había presentado.

Después de autorización: generar la migración mediante el CLI según la guía Supabase, copiar exactamente esta propuesta, aplicar únicamente en el proyecto principal, verificar metadatos y desplegar un solo Preview del bloque. No hacer merge ni producción. Hasta entonces el código del historial permanece local; publicar antes dejaría a la pantalla dependiendo de una tabla ausente.

## Espacio y reversión

Usa espacio de Supabase para conservar la respuesta. No contrata planes ni duplica todo el corpus bíblico; guarda el resultado consultado y sus fuentes, con compresión automática normal de PostgreSQL. El listado obtiene metadatos y la respuesta completa se carga al abrirla.

Una respuesta de ejemplo editorial controlado midió 6,041 bytes antes de compresión. Es un ejemplo, no un promedio real ni una predicción de capacidad. Preguntas/estudios largos pueden ocupar más. Límite técnico por snapshot: 512 KiB, con aviso y sin guardado parcial; no hay un límite oculto de diez consultas ni borrado por antigüedad. El monitor existente debe seguir midiendo el espacio real. La lectura de una respuesta guardada no consume tokens de Gemini, aunque sí consultas/tráfico de la aplicación.

Reversión preparada en `docs/sql/estudio-historial-reversion.sql`: retirar primero la integración de código y revocar acceso de la tabla nueva conservando todas las filas. No DROP TABLE ni borrado de registros. Se puede rehabilitar con los mismos permisos de propietario. La vuelta al código anterior conserva las notas y herramientas existentes.

## Verificación local

- Doce pruebas nuevas de aplicación: primera consulta genera una vez, repetición recupera el mismo resultado, aislamiento de cuenta, ausencia de sesión, fallo de lectura sin consumir IA, estados que no deben cachearse, fallo al guardar sin perder respuesta, tamaño máximo, restauración directa, borrado propio, paginación y snapshot sin metadatos de otro guardado.
- Doce comprobaciones SQL mediante PostgreSQL local/PGlite y usuarios ficticios: RLS real, propietario, otra cuenta, administración sin acceso ajeno, cuenta inactiva, anon, transferencia de propietario bloqueada, unicidad, tamaño, eliminación y reversión conservadora. No se ejecutó SQL de escritura en la base real.
- Noventa y siete pruebas relacionadas correctas. TypeScript y compilación local correctos, lint de módulos nuevos sin errores.
- Chromium con React real y servidor controlado a 320/390/820: historial cerrado, apertura sin llamada al generador, paginación, conservación del resultado ante error, eliminación confirmada y sin desbordes. No representa una sesión real autenticada ni la activación remota del historial.
- La deuda histórica del conjunto general sigue documentada; no declarar CI global verde ni cerrar pruebas con personas por estos resultados locales.
- Comprobación general final: 798 pruebas, 789 pasan y permanecen los mismos nueve fallos anteriores. No apareció un fallo nuevo del historial. Las doce comprobaciones de SQL local se ejecutan aparte.

## Siguiente paso

Presentar la solicitud concreta de autorización para una tabla privada y sus cuatro políticas nuevas. Después de aprobación se ejecuta el paquete exacto y se conecta el mismo Preview. Sin esa aprobación no se modifica la base de datos ni se publica este bloque.
