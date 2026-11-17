# Catálogo de canciones VIDA · 17 de noviembre de 2026

## Alcance y estado real

Solicitud: organizar el listado del usuario e incorporarlo a la biblioteca existente de Alabanza, conservando arreglos, tonalidades y edición. Rama `agent/catalogo-canciones-vida-20261117`, basada en main `76f28ff8da4a1f4ee19bbc2c682e281fd71ef309`. Sin merge, publicación de producción, cambios en maestro, roles, RLS, esquema o repertorios de eventos.

Preparadas **235 entradas y variantes**, no 235 canciones certificadas. Se conciliaron repeticiones reconocibles, conservando tonos alternativos en notas; los títulos ambiguos permanecen separados. Hay 202 fichas con cifrado aportado y 50 referencias aportadas por el usuario. Los fragmentos sin título no se asignaron por conjetura. No se declara transcripción íntegra de todos los fragmentos anónimos del mensaje.

- **82 referencias encontradas:** intérprete cristiano reconocido, título coincidente, al menos un enlace directo de YouTube o Spotify, tono y cifrado aportados compatibles con el transportador actual. Son candidatos para revisión; no se ha escuchado cada grabación ni certificado coincidencia de audio, composición o arreglo.
- **151 pendientes:** identidad o versión dudosa, falta de referencia, tono/cifrado ausente o tokens no admitidos por el transportador. No se importan por lotes; se pueden abrir en el editor existente para completar y revisar antes de guardar.
- **2 existentes conservadas:** Dios Imparable y Gracia sublime. No se modifican, completan ni reactivan automáticamente. La revisión vuelve a consultar la biblioteca y también preserva fichas incorporadas o editadas después de este corte.
- **25 de las 82 referencias** tienen ambos enlaces. Los campos ausentes se declaran por completar; no se usan páginas de búsqueda, álbumes o playlists como pistas.
- **Letras pendientes en las 235 entradas.** La copia masiva de letras al archivo fue bloqueada automáticamente; no se intentó eludir el bloqueo ni se descargaron letras externas para incorporarlas. Sigue disponible el campo editable existente.

No presentar este catálogo como biblioteca terminada ni decir que las 235 fichas están ya guardadas en Supabase.

## Datos y referencias

`data/canciones-vida-20261117.json` contiene UUID estable, título, intérprete de referencia, tono del arreglo, cifrado y notas suministrados, enlaces directos encontrados, referencia original, campos pendientes y motivos de revisión. `fuentes_verificacion` es evidencia de metadatos localizados, no certificación musical. No incluye perfiles, contraseñas, claves ni letras.

La investigación utilizó títulos e intérpretes de los apuntes, referencias del usuario y búsquedas de YouTube/Spotify. Las grabaciones son referencias; la tonalidad y los cortes de VIDA pueden diferir. No se inventaron acordes para canciones que solo tenían título/enlace ni se sustituyó una identidad dudosa por un homónimo secular. Se retuvieron como pendientes incluso algunos homónimos de artistas cristianos.

`scripts/vida-canciones/preparar.py` prepara el manifiesto desde un directorio editorial con `inventario.json` e `investigacion-*.json` (metadatos: índice, título, URL y canal/intérprete). No conecta a bases de datos. El manifiesto versionado conserva el resultado para continuar sin repetir la investigación; no ejecutar el preparador sin sus insumos revisados.

## Importación autorizada por sesión

Biblioteca: `/ministerios/335daa03-4b5a-4ff5-8958-851de6b641ed/biblioteca-alabanza`.

1. Entrar con la cuenta propia de administración o líder autorizado de Alabanza.
2. Abrir **Revisar catálogo de canciones VIDA**, inicialmente cerrado.
3. Revisar referencia, tono, acordes, notas y campos pendientes; seleccionar las referencias deseadas.
4. Pulsar **Importar seleccionadas**. Cada llamada procesa hasta 20 UUID del manifiesto, con verificación actual de sesión, cuenta activa y rol/responsabilidad. Las dudosas y los IDs externos se rechazan en servidor.
5. Se crean únicamente fichas nuevas. Se comprueban IDs y títulos normalizados, incluyendo fichas archivadas. Reintentos y colisiones no actualizan ni sobrescriben las fichas guardadas. El resultado separa creadas, existentes y fallidas.
6. Editar después desde la misma biblioteca. Los permisos de edición existentes se conservan; no todos los músicos reciben permiso de edición por este cambio.

El Preview usa **ccvida real**. Importar desde allí incorpora contenido editorial a la biblioteca compartida con producción. No hacerlo como prueba ficticia. En este bloque no se ejecutó ninguna escritura en la base de datos, no se suplantó una cuenta y no se leyó ni trasladó la clave de servidor.

## Verificación y límites

- TypeScript sin errores y compilación Next.js completa.
- Diez pruebas del catálogo: manifiesto, URLs, autorización, cuenta activa, ministerio, rechazo de fichas pendientes y ajenas, preservación/idempotencia, paginación, errores parciales y colisión concurrente simulada.
- ESLint de los archivos nuevos: correcto. La action existente conserva un `any` anterior en su helper de acceso, sin cambios en ese helper; el lint integral de ese archivo sigue señalándolo. Los fallos históricos de CI no se consideran solucionados por este bloque.
- Revisar Guardrails después del commit y comprobar el único Preview del bloque contra ese SHA antes de entregarlo. El recibo del deployment y PR se registra en el PR sin otro despliegue documental.
- Pendiente: validación visual y autenticada del importador; escucha y confirmación musical de las referencias, completar enlaces/letras y resolver las 151 fichas pendientes. No se probó con una sesión real de usuario ni se importó el catálogo como prueba.

## Reversión

El cambio de interfaz es reversible volviendo al código anterior; las fichas ya incorporadas siguen siendo editables en la biblioteca previa. No ejecutar borrados masivos: si hay una ficha equivocada, corregirla o archivarla con los controles existentes, preservando el historial. El retiro de esta interfaz no borra canciones ni repertorios.
