# Catálogo de canciones VIDA · 17 de noviembre de 2026

## Transposición persistente y ficha integrada · preparado 2026-11-17

- Solicitud nueva del usuario: transportar dentro de la ficha y guardar el último tono/acordes; practicidad desde setlist; campos integrados al fondo, sin cajas; ampliar canciones y completar referencias. La carga anterior de 20 nuevas/22 totales fue confirmada por el usuario.
- Ficha: controles ±½ tono transportan tono base y cifrado juntos. En canciones existentes guardan automáticamente solo esos dos campos mediante la action oficial ya autorizada para administración/líderes. Cola serial/coalescida evita que un guardado antiguo sustituya al último; Guardar completo queda bloqueado durante ese guardado para no pisar cambios. En canción nueva, la transposición se incluye al guardar la ficha. Letras/notas/enlaces no se transportan ni se sobrescriben por esa operación.
- Setlist conserva transposición personal sin alterar la versión oficial; los gestores tienen «Guardar este tono en biblioteca». Comparte el transportador con la ficha: inversiones, extensiones y bemoles/sostenidos; preserva letras y espacios. No cambia tonos ya asignados a eventos ni historial de servicios.
- Editor sin superficie blanca ni recuadros: fondo transparente y separadores inferiores. Se conserva el formulario completo y el guardado de los paneles ocultos. Sin CSS global, roles ni RLS modificados.
- Ampliación: 82 candidatas, ahora 77 con video y 29 con ambos enlaces por la investigación disponible. La carga admite video confirmado aunque falte Spotify; si Spotify está presente también debe comprobarse. Ausencias se conservan como null y pendientes, nunca se inventan pistas. Se mantiene identidad/intérprete y estado OK del video, certificado de catálogo reciente e idempotencia. Los recuentos guardados posteriores se confirman en ccvida, no por cantidad de candidatos.
- Letras: el usuario pidió buscarlas en sitios de letras/acordes. No se copiaron letras completas protegidas ni se eludió el bloqueo anterior. Permanecen editables y pendientes; no declarar las 82 fichas completas. Los cifrados de esta carga proceden de los apuntes aportados.
- Verificado localmente: 28 regresiones pertinentes, TypeScript, lint de archivos nuevos y build. Chromium móvil con CSS compilado comprueba transposición +2, cola de guardado, conservación de campos/FormData y ausencia de desbordamiento con datos simulados. Falta validar la interacción autenticada de transposición y contabilizar la ampliación real.
- Un Preview nuevo para este bloque; recibo SHA/deployment y cotejo real se registran en PR #316 sin otro despliegue documental. No hacer merge, producción, actualizar maestro ni asignar personas adicionales sin autorización. Los cortes siguientes son históricos.

## Carga real comprobada — 2026-11-17

- **20 canciones nuevas guardadas, 22 totales en ccvida.** Cotejo de 20/20 por UUID, título, artista, tono, acordes, notas y enlaces frente al catálogo y comprobación positiva; activas y letras pendientes. Datos reales compartidos con la aplicación habitual, incorporados mediante server action y sesión autorizada; sin SQL de escritura ni suplantación.
- Preview READY `dpl_44U9twcumi5FxvPLb8wxxbH7JhX7`, SHA `456b7a6357469dec5c72c719d6df03d4244b9982`. Enlace estable: https://calendario-git-agent-catalogo-cancion-2d423b-vida-internacional.vercel.app/ministerios/335daa03-4b5a-4ff5-8958-851de6b641ed/biblioteca-alabanza . Ficha nueva solo en Preview, pendiente aprobación visual/producción; datos ya visibles en app habitual.
- Quedan 213 entradas fuera de esta carga: 151 dudas/cifrado incompleto, 57 candidatas sin ambos enlaces y 5 que no pasaron todos los controles. No declarar catálogo completo ni letras cargadas. Dos fichas originales conservadas; sin roles/RLS, eventos o maestro modificados.
- Recibo remoto completo en PR #316. Este registro documental posterior se guarda localmente sin push para no crear otro Preview; incorporarlo con el siguiente cambio autorizado. No confundir el commit documental local posterior con el HEAD de código desplegado.

## Carga cero y ficha solicitada — corrección posterior 2026-11-17

Este corte sustituye las instrucciones anteriores de volver a consultar a los proveedores durante cada inserción.

- **Problema confirmado por el usuario:** cero canciones incorporadas, 82 candidatas pendientes. El build había admitido 20, pero la carga repetía las solicitudes externas dentro de cada server action y descartaba cualquier respuesta distinta o fallida. Los errores se convertían en el mismo resultado neutro, sin evidencia para atribuirlos todos a videos retirados. No se declara identificada la causa de red/proveedor exacta de aquella ejecución.
- **Corrección:** el build guarda el resultado completo de las referencias positivas en un artefacto editorial de servidor, con fecha y SHA-256 del catálogo exacto. La action mantiene sesión/rol y conservación de existentes, pero lee ese certificado en lugar de depender de nuevas solicitudes a YouTube/Spotify al insertar. Se rechazan certificados ausentes, vencidos (24 horas), futuros, de otro catálogo, IDs ajenos y URLs fuera de las referencias originales. No se convierte una respuesta negativa en positiva.
- **Trazabilidad:** logs separados por ficha, evitando el recorte del informe largo del conector. El archivo versionado inicial está vacío y no autoriza importaciones; se genera antes de Next build en la rama del Preview. La página no inicia carga automática si no hay certificado vigente.
- **Ficha de edición solicitada:** nombre arriba; artista/versión y tono base juntos; secciones Letra, Acordes y estructura, Notas; enlaces desplegables inicialmente cerrados. Tipografía monoespaciada para alinear acordes con texto; campos montados aunque una sección esté oculta, por lo que FormData conserva todo al guardar. La edición existente usa el mismo formulario. Sin cambios de roles, RLS, Programación, transposición ni letras externas.
- **Verificación:** 20 pruebas pertinentes pasan (incluyen rechazo de certificados vencidos/manipulados), TypeScript/build local completos y lint de archivos nuevos. Prueba aislada en Chromium móvil con CSS compilado comprueba edición/pestañas/persistencia de todos los campos y ausencia de desbordamiento. La ficha requiere la validación del usuario dentro de la aplicación autenticada.
- **Importación real:** no afirmar que las fichas están guardadas hasta leer ccvida después de la ejecución autenticada. El usuario quiere verlas como canciones reales, no como una lista para importación manual. No fabricar una sesión ni escribir SQL directo como sustituto del control de acceso.

## Ajuste solicitado después de la revisión — 2026-11-17

Este apartado sustituye el flujo de selección manual descrito más abajo; los recuentos previos son metadatos candidatos, no videos comprobados.

- El usuario reportó «Not Available» y pidió cargar las canciones confirmadas sin que él o los líderes seleccionen/importen cada una. Se retiró el desplegable de selección: la biblioteca conserva su editor habitual.
- La carga preparada se inicia al abrir la biblioteca con la sesión real de administración. Verifica lotes de dos, conserva existentes/archivadas y solo incorpora fichas con ambos enlaces comprobados. Líderes no reciben una tarea manual de importación. No se suplantan usuarios ni se leen claves de servidor.
- Para YouTube se requiere coincidencia de título e intérprete en oEmbed y estado `OK` del reproductor con el mismo ID/título. Spotify debe responder con la pista correspondiente. Si hay bloqueo, consentimiento, login obligatorio, video retirado, URL inválida, error de red o respuesta incompleta, no se certifica la referencia ni se importa esa ficha. No se ejecutan scripts de los proveedores ni se descarga audio, video o letras.
- Es una comprobación desde el servidor en ese momento: no garantiza disponibilidad futura ni en todas las regiones/dispositivos. La identidad musical y el arreglo siguen requiriendo cautela; no se elevan las 82 candidatas a canciones certificadas por una búsqueda.
- En el entorno de trabajo, YouTube devolvió bloqueo del proxy HTTP 403 y la consulta web directa falló. Eso impide comprobar reproducción desde aquí y **no prueba que todos los videos estén retirados**. El build del Preview realiza una comprobación independiente de solo lectura de las 25 candidatas con ambos enlaces. Su informe editorial queda en los logs de build accesibles desde la cuenta Vercel, sin datos personales ni claves; no ejecuta consultas de escritura.
- La comprobación de build corre exclusivamente en la rama de este Preview bajo Vercel. En main/desarrollo el paso sale sin solicitudes. No cambia cron, planes, RLS, roles ni producción.
- **Permisos finales aclarados:** edición solo para líderes de Alabanza y personas que el propietario autorice. Se conserva el acceso existente de administración/líderes; no se habilita a todos los músicos ni se asigna nadie adicional sin identificarlo y autorizarlo. No se cambia el rol de ninguna cuenta.
- **Programación ya implementada:** `RepertorioServicioEditor.tsx` es el componente activo; cada fila tiene icono circular y una pulsación incorpora la canción. Conserva indicadores «Agregada», bloqueo durante el envío, comprobación de duplicados en servidor y edición del tono del servicio. No sustituirlo por el picker histórico de selección + formulario ni rediseñarlo.
- **Pruebas del ajuste:** 17 regresiones pertinentes pasan, TypeScript y build completos; lint de archivos nuevos correcto. Prueba Chromium con datos simulados valida carga automática/refresco sin selección manual. No equivale a importación real ni reproducción de medios en un teléfono.
- Sin merge ni publicación de producción autorizados para este ajuste. El recibo del único Preview y el resultado real de disponibilidad se registran en el PR sin crear otro build documental. No afirmar que se importó hasta cotejar filas en ccvida.

## Alcance y estado real — corte anterior

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


## Continuación — 2026-11-18

Recuento real ccvida confirmado: 23 activas; 22 con acordes y video, 20 Spotify, cero letras. Actualizada rama desde main a7bcf097, conservando modificaciones musicales sin publicarlas. La ficha manual Nombre no hay y todas las correcciones existentes se preservan.

Cinco referencias recuperadas/corregidas: Pon aceite en mi vida (Jaime Murrell), De los montes (Marco Barrientos), Los muros caerán (Miel San Marcos), Quiero entender (extensión Em7(add4) soportada) y Renuévame (A9sus4 soportada). 87 candidatas antes de verificación; 21 ya coinciden con DB, 66 aún no guardadas. Se mantiene estado pendiente en 146 entradas/variantes, no se inventan identidades ni acordes.

Fuentes públicas de identidad: https://www.youtube.com/watch?v=mFOJZdJMGcU ; compositor https://www.youtube.com/watch?v=JctR6g0a39E ; https://www.youtube.com/watch?v=432KddN2yiY ; https://www.youtube.com/watch?v=nyrMayW_8oo . No se copiaron sus letras ni grabaciones. Spotify de Ricardo Rodríguez eliminado de la candidata Pon aceite por corresponder a un canto distinto; no se sustituyó por un enlace inventado.

El catálogo requiere comprobación renovada en build (metadatos/estado del reproductor) y sesión real de administrador para insertar mediante action existente. No se usa SQL de escritura ni se simula sesión. La entrada de prueba acordada se mantiene; recibo exacto del único Preview, verificación de enlaces y carga real se registran en PR #316. No declarar completado hasta cotejar registros y pendientes. No publicar producción ni modificar maestro sin aprobación nueva.
