# Migración ccvida — checkpoint 2026-11-16

Supabase destino: `lnkrojvyiwnlcoponxud`, organización Ccvida, correo marketingccvida@gmail.com.
Origen preservado: `atjtjpchslxbseayzflz`. Producción conserva su conexión anterior. Planes gratuitos sin cambios.

## Datos y esquema comprobados

- 105 tablas public/internal y 192405 registros coinciden por cantidad y huella MD5 del JSON canónico de PostgreSQL, ordenado por clave. Incluye app_settings, perfiles, notas, progreso, suscripciones push y tablas editoriales que aún permanecen en el origen. No se repoblaron las 611398 ocurrencias bíblicas: las consultas editoriales continúan en Neon.
- 25 usuarios Auth y 25 identidades de correo copiados con mismos UUID y hashes de contraseña; huellas completas coinciden. No se copiaron sesiones activas. El usuario debe iniciar sesión de nuevo.
- 105 estructuras de tabla, tipos de columna, valores por defecto e indicadores RLS coinciden.
- 682 restricciones coinciden; las 206 claves foráneas están validadas.
- 137 índices secundarios, 28 disparadores y 236 políticas coinciden.
- 92 funciones migradas coinciden en definición completa. Sus 277 permisos y los 2254 permisos de tablas coinciden exactamente.
- Se retiraron 625 permisos adicionales concedidos por defecto al crear tablas nuevas.
- El proyecto nuevo incluye además public.rls_auto_enable(), función de evento administrada por Supabase para ensure_rls. La revisión automática rechazó devolverle permisos amplios no incluidos en la copia; quedó accesible solo por postgres, con el evento habilitado. No forma parte de las 92 funciones migradas.
- Secuencia pilot_usage_events_id_seq ajustada a 431.
- Tamaño del destino observado tras la copia: 250009267 bytes. Auth health y settings responden HTTP 200; correo habilitado. No equivale a validar login en la aplicación.
- Dos tareas cron copiadas e inactivas en destino. Las dos del origen siguen activas. No activar ambas copias simultáneamente. Verificar alias de calendario-six-orpin.vercel.app y autorización antes del cambio coordinado.
- Tres buckets copiados. Los siete archivos reales no se pudieron descargar del origen por HTTP 402; destino tiene cero objetos. La metadata no se presentó como si fueran archivos copiados.
- Siete Edge Functions históricas de importación bíblica permanecen en origen. No se ejecutaron ni desplegaron en destino.

## Conexión del Preview

Rama: `agent/migracion-supabase-ccvida-20261116`.
En esa rama están configuradas la URL y clave pública de ccvida y las dos conexiones Neon, con VIDA_BIBLE_READ_BACKEND=neon.
El usuario guardó `CCVIDA_SUPABASE_SERVICE_ROLE_KEY` como secreto en Preview y también en Production; se conserva intacto. Existe además una variable estándar de servidor específica de la rama. No se leyeron ni imprimieron los valores secretos.

Los clientes administrativos seleccionan la clave alternativa únicamente cuando NEXT_PUBLIC_SUPABASE_URL corresponde a ccvida. Con la URL original, siguen leyendo SUPABASE_SERVICE_ROLE_KEY. Ambas claves quedan solo en módulos del servidor, protegidos por server-only.

Cinco pruebas del selector y sus dos clientes administrativos, más seis pruebas de lectura segura Neon, pasan. TypeScript, ESLint de los archivos cambiados y el build estándar Turbopack también pasan. La compilación alternativa Webpack falla por tres selectores globales CSS preexistentes; no se modificaron estilos. Falta la comprobación del único Preview con la clave real y el usuario autenticado. Los metadatos de Vercel demostrarán el head y URL de ese Preview.

## Pendiente antes de producción

1. Validar clave nueva en el Preview sin revelar su valor; probar login con una cuenta real, AT/NT, notas, progreso, calendario, ministerios, discipulado y archivos.
2. Revisar en Dashboard Auth Site URL, redirecciones y correo: no están disponibles en el conector. Las 25 identidades son de correo.
3. Recuperar siete archivos reales del origen; preservar paths/propietarios y resolver las URLs absolutas antiguas de avatares con una transformación documentada.
4. Activación coordinada del cron tras verificar URL y autorización, evitando notificaciones duplicadas.
5. No cambiar producción mientras estas comprobaciones no estén resueltas. No borrar ni alterar datos del origen, RLS ni permisos.
6. Las dos bases coinciden al cerrar esta copia; no existe sincronización continua para los cambios futuros.
7. Documento maestro intacto. Manifest JSON adyacente contiene cantidades, huellas y resultados de las comparaciones; no contiene filas personales ni claves.
