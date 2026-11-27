# Historial privado de Estudio Profundo — autorizado y aplicado el 27-11-2026

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

**Estado: autorizado y aplicado el 27-11-2026.** El propietario aprobó ejecutarlo si la evaluación de espacio era razonable. Se midieron251950771bytes antes y252008115bytes después; tabla inicial32768bytes/0filas. No hay promesa de capacidad ilimitada. CLI oficial2.81.3 generó las migraciones locales; el conector asigna sus propias versiones remotas al aplicar los mismos paquetes.

Migraciones: `20261127000637_estudio_historial_privado.sql` y `20261127000804_estudio_historial_privilegios_minimos.sql`. La primera crea el paquete preparado. La segunda retira tres privilegios que los defaults del proyecto habían heredado en la tabla nueva. El SQL consolidado de docs incluye esa limitación desde la creación. Verificado: RLS activa, cuatro políticas, anon sin acceso y authenticated sin TRUNCATE/REFERENCES/TRIGGER. No se cambian defaults ni otras tablas. Advisor sin hallazgos nuevos para esta tabla.

La rama de revisión incorpora el historial al único Preview del bloque. No se hace merge ni producción. La sesión autenticada real queda pendiente del propietario.

## Espacio y reversión

Usa espacio de Supabase para conservar la respuesta. No contrata planes ni duplica todo el corpus bíblico; guarda el resultado consultado y sus fuentes, con compresión automática normal de PostgreSQL. El listado obtiene metadatos y la respuesta completa se carga al abrirla.

Una respuesta de ejemplo editorial controlado midió 6,041 bytes antes de compresión. Es un ejemplo, no un promedio real ni una predicción de capacidad. Preguntas/estudios largos pueden ocupar más. Límite técnico por snapshot: 512 KiB, con aviso y sin guardado parcial; no hay un límite oculto de diez consultas ni borrado por antigüedad. El monitor existente debe seguir midiendo el espacio real. La lectura de una respuesta guardada no consume tokens de Gemini, aunque sí consultas/tráfico de la aplicación.

Reversión preparada en `docs/sql/estudio-historial-reversion.sql`: retirar primero la integración de código y revocar acceso de la tabla nueva conservando todas las filas. No DROP TABLE ni borrado de registros. Se puede rehabilitar con los mismos permisos de propietario. La vuelta al código anterior conserva las notas y herramientas existentes.

## Verificación local

- Trece pruebas nuevas de aplicación (incluida conservación de contexto histórico, geografía, mapas y análisis textual): primera consulta genera una vez, repetición recupera el mismo resultado, aislamiento de cuenta, ausencia de sesión, fallo de lectura sin consumir IA, estados que no deben cachearse, fallo al guardar sin perder respuesta, tamaño máximo, restauración directa, borrado propio, paginación y snapshot sin metadatos de otro guardado.
- Trece comprobaciones SQL mediante PostgreSQL local/PGlite y usuarios ficticios: RLS real, propietario, otra cuenta, administración sin acceso ajeno, cuenta inactiva, anon, transferencia de propietario bloqueada, unicidad, tamaño, eliminación y reversión conservadora. Los casos con usuarios ficticios se ejecutaron localmente; la verificación remota consultó solo metadatos/recuentos.
- Noventa y siete pruebas relacionadas correctas. TypeScript y compilación local correctos, lint de módulos nuevos sin errores.
- Chromium con React real y servidor controlado a 320/390/820: historial cerrado, apertura sin llamada al generador, paginación, conservación del resultado ante error, eliminación confirmada y sin desbordes. No representa una sesión real autenticada ni la activación remota del historial.
- La deuda histórica del conjunto general sigue documentada; no declarar CI global verde ni cerrar pruebas con personas por estos resultados locales.
- Comprobación general final: 798 pruebas, 789 pasan y permanecen los mismos nueve fallos anteriores. No apareció un fallo nuevo del historial. Las trece comprobaciones de SQL local se ejecutan aparte.

## Preservación y siguiente paso

La explicación breve conserva el acceso al estudio completo existente desde cada pasaje citado. El historial guarda el snapshot íntegro de las capas disponibles: contexto histórico, geografía, cronología/mapas, texto original y análisis. No se inventan ubicaciones ni se promete mapa en todo pasaje. Notas y corpus intactos.

Validar con la cuenta real en el mismo Preview: consultar, abrir la respuesta desde historial sin regenerar, entrar al estudio completo de una fuente y revisar sus capas. Solo después de revisión y autorización nueva se considera producción. No repetir el SQL ni el despliegue para documentar un recibo.
