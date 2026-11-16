# ccvida — migración y publicación, 2026-11-16

## Estado actual

La aplicación normal usa ccvida (Supabase lnkrojvyiwnlcoponxud) y conserva las dos bases bíblicas Neon. El usuario confirmó el login del Preview con su cuenta habitual y autorizó publicar en producción. No se cambiaron contraseñas.

PR [305](https://github.com/vidainternacional/calendario/pull/305) integrado en main: be6021f63d05299528efc818c0937263835a477e. La publicación del cambio fue dpl_EpefzUKRCXwVKeHd8BQfsh95LoGa, READY. Un commit posterior de documentación puede tener otro despliegue sin cambiar el código funcional.

Direcciones habituales conservadas:

- https://calendario-vida-internacional.vercel.app
- https://calendario-six-orpin.vercel.app

En ambas se comprobó login HTTP 200, formulario presente y redirección de /inicio sin sesión hacia /login. No se verificó una sesión autenticada real en producción: la confirmación del usuario corresponde al Preview cd26026117e4329606ceb3a337fed7cdc6ea56e7.

Manifest y service worker publicados coinciden exactamente con los anteriores: mismo start_url /inicio, scope / y navegación con red. La PWA instalada conserva su identidad. Puede pedir iniciar sesión de nuevo, sin reinstalar ni borrar almacenamiento local.

Site URL de Auth se cambió por el usuario y se comprobó con una solicitud de verificación inválida, sin enviar correos ni modificar usuarios: redirige a https://calendario-vida-internacional.vercel.app/ y ya no a localhost.

## Certificación de la copia

Al cerrar la copia coincidieron 105 tablas public/internal y 192405 registros por cantidad y huella del JSON canónico de PostgreSQL, ordenado por clave. Incluye perfiles, notas, progreso, app_settings, suscripciones push y tablas editoriales que todavía existían en el origen. Las nuevas sesiones y operaciones posteriores cambian legítimamente ccvida: no volver a copiar sobre ellas para forzar una huella antigua.

- 25 usuarios y 25 identidades de correo copiados con UUID y hashes de contraseña; huellas completas cotejadas. No se trasladaron sesiones activas.
- Estructura de las 105 tablas, indicadores RLS, 682 restricciones (206 FKs validadas), 137 índices secundarios, 28 disparadores y 236 políticas coinciden.
- Las 92 funciones migradas y sus 277 permisos, además de los 2254 permisos de tablas, coinciden. Se retiraron 625 permisos adicionales automáticos del destino.
- El helper de evento public.rls_auto_enable() propio del proyecto nuevo permanece habilitado para ensure_rls y accesible solo por postgres. La revisión automática rechazó devolverle permisos amplios ajenos a las 92 funciones migradas.
- Secuencia pilot_usage_events_id_seq ajustada a 431. Tamaño observado del destino: 250009267 bytes.
- Auth health y settings respondieron HTTP 200. El usuario confirmó el acceso de su cuenta en Preview.
- Las 611398 ocurrencias permanecen en Neon, no en Supabase. Las 124504 filas de textos y las tablas editoriales remanentes se copiaron para conservar el contenido del origen; el lector usa Neon.

## Conexiones y recordatorios

Production tiene URL y clave pública específicas de ccvida. Las variables públicas anteriores se conservaron en Preview; SUPABASE_SERVICE_ROLE_KEY original permanece intacta. El selector server-only usa CCVIDA_SUPABASE_SERVICE_ROLE_KEY únicamente para la URL ccvida; para el origen sigue usando la clave anterior. No se leyeron ni imprimieron secretos.

NEON_BIBLE_LEXICON_DATABASE_URL, NEON_BIBLE_TEXTS_DATABASE_URL y VIDA_BIBLE_READ_BACKEND=neon de Production se conservaron. Las lecturas editoriales siguen autorizadas mediante sesión y cuenta_activa(), con transacciones Neon de solo lectura.

Las dos tareas recordatorios-eventos y resumen-lunes tienen el mismo horario y huella del comando en ambos proyectos. Se desactivaron primero en el origen y después se activaron en ccvida. Se verificaron dos inactivas en origen y dos activas en destino, sin solapamiento. El hostname de los comandos pertenece al mismo proyecto de Vercel. No se activaron envíos de prueba.

Once pruebas dirigidas (cinco de selección de clave y seis de lectura Neon), TypeScript, ESLint de los archivos cambiados, guardrails y build estándar Turbopack pasan. Webpack alternativo falla por tres selectores CSS globales preexistentes; no se tocaron estilos. No hubo registros error/fatal del despliegue al revisar las solicitudes públicas; eso no certifica recorridos autenticados todavía no probados.

## Pendientes y recuperación

1. El usuario debe comprobar su sesión desde la aplicación instalada/dirección habitual y abrir AT/NT, notas y progreso. No solicitar su contraseña.
2. Siete archivos reales del Storage anterior continúan pendientes por HTTP 402 del origen. Se copiaron tres buckets, pero cero objetos. No confundir metadata con binarios ni borrar originales. Tras recuperarlos habrá que preservar paths/propietarios y resolver las URLs absolutas antiguas de avatares con transformación documentada.
3. Siete Edge Functions históricas de importación bíblica permanecen en el origen; no se ejecutaron ni desplegaron en destino. No repoblar el corpus en Supabase.
4. No existe sincronización continua. Las nuevas operaciones pertenecen a ccvida.
5. Origen atjtjpchslxbseayzflz y claves anteriores conservados, sin borrar ni alterar datos/RLS/permisos. Solo se desactivaron sus dos tareas cron. La restricción administrativa del origen no se levanta al revertir un despliegue.
6. Para revertir configuración, restaurar las variables públicas anteriores en Production y el despliegue dpl_DDrc9AvUC9oCMt5YMchDYqZBbmsM. Antes de reactivar cron de origen, desactivar el de ccvida. Conciliar cualquier dato nuevo antes de cambiar de base: una reversión de código no traslada escrituras posteriores.
7. No se cambiaron planes ni diseños. Documento maestro intacto. El JSON adyacente contiene certificados y metadatos, no filas personales ni secretos.
