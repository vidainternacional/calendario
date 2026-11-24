# VIDA Internacional — Bitácora de continuidad

Último corte: 24 de noviembre de 2026. Leer primero al retomar este repositorio.




## Recibo posterior de recuperación real — 24-11-2026

Se comprobó directamente ccvida: siete objetos avatars,2028295 bytes; seis recuperadas suman1581601 bytes, descargadas de destino y cotejadas SHA256 íntegramente contra sus huellas certificadas. Cinco perfiles apuntan a recuperadas; cero perfiles con referencia al Supabase anterior. La foto nueva previa de446694 bytes permanece. Origen: cero objetos avatars. Por tanto la recuperación/retirada autorizada YA ocurrió; no solicitar repetirla ni seguir marcándola pendiente por falta de sesión en esta ejecución técnica. No se atribuye la acción a una sesión suplantada: se certifica estado final observado. Archivo pastoral excluido; no copiado. La validación visual del avatar en cuenta real sigue siendo del usuario.

## Revisión integrada solicitada — 24-11-2026 · PR321

- Usuario no encontraba fotos en Analytics y retorno sin historial no funcionaba. Acceso propio /admin/fotos, enlaces fijos a Administración/Inicio y accesos directos en /admin y Analytics; recuperación real ahora antes de estadísticas.
- Mismo PR321/rama y alias fijo. Se incorporan solo recursos de PR320, no sus otros cambios ni se fusiona PR319. Maestro intacto.
- /admin/sedes permite revisar Santa Ana/Chalchuapa, futura sede, audiencias, alcance por responsabilidad, grupos de prueba y PDF dentro de la página. PERSONAS DE EJEMPLO; no hay envío, sedes reales ni grupos persistentes. Cambios de tablas/RLS siguen sin aplicar y requieren alcance exacto aprobado. No decir sistema multisede productivo.
- Biblia: consultas editoriales iguales reutilizables300s con autorización antes de consultar. No guarda datos personales en esa caché. Respaldo automático de textos origen NO implementado, análisis léxico continúa en Neon. No duplicar corpus completo en Free.
-22 pruebas pertinentes, TypeScript/lint/build local y Chromium aislado320/390/820px correctos, sin sesión real. Recibo de Preview exacto en PR321. Fotos todavía requieren ejecución real y cotejo de Storage; no declarar copiadas/eliminadas por compilar. No activar R2 ni producción.
- Detalle y checklist: docs/REVISION_INTEGRADA_2026-11-24.md. La revisión contiene simulación explícita, sin alterar permisos/datos de sedes. Recursos con credenciales pendientes muestra Sin datos, no cero.

## Recuperación de seis fotos — 24-11-2026

- Usuario autoriza copiar las seis fotos a ccvida y eliminar únicamente originales ya verificados; excluye expresamente el archivo pastoral de prueba «La fe». No borrar usuarios ni otros datos todavía.
- Rama `agent/recuperar-fotos-20261124` basada en main `bd7aa236`; action con sesión real y administrador activo, fuente antigua fija, destino ccvida fijo y secretos existentes SOLO en servidor. Recuperación desde Analytics para evitar extraer secretos mediante herramientas (estas devolvieron valores vacíos). No cambiar claves ni RLS.
- Inventario avatars acotado, seis huellas SHA256 autorizadas, ruta nueva determinista sin sobrescribir fotos nuevas, encuadre conservado, cambio de URL condicional por concurrencia. Tras verificar todas las copias/referencias, vuelve a cotejar contenido antes de retirar cada original; reanudable. Nunca toca pastoral-library.
- Cinco regresiones pertinentes, TypeScript y lint específico; compilación y Preview se registran en recibo de entrega. No se ejecutó con sesión falsa ni se afirma fotos subidas/eliminadas antes del recibo real. Producción intacta.
- Sedes: Santa Ana central y Chalchuapa sede, más futuras sedes; grupos guardados, públicos compartidos y permisos por responsabilidad siguen en propuesta documental separada, sin SQL aplicado. Analytics PR320 y badges PR319 continúan separados; no fusionarlos para esta recuperación.
- Biblia origen: textos124504 cotejados con NeonB por huella59509f9ff3a909960256da649ba5a213; cero ocurrencias de análisis. No activar sustitución integral de Neon, ni volver a cargar611398 ocurrencias en Free. Caché, medición y respaldo textual se evalúan sin superar cuotas.

## Publicación musical autorizada — 2026-11-18 · PR #316

- Usuario validó la presentación («Perfecto me parece») y autorizó «pasa a la producción». Publicar únicamente PR #316; no integrar otros Draft ni modificar maestro.
- Código aprobado `b82a51df868172f943fe6554660e7315745ac324`, Preview READY `dpl_9C6GUqMRqt72YmugxCEyamy9E1yf`, alias único cotejado. Cabecera editable única, Letra/Cifrado, transporte compacto, ficha grande, lectura y orden del servicio aprobados.
- 37 pruebas pertinentes, TypeScript/lint específico/build y Guardrails correctos; Chromium aislado móvil/iPad/escritorio. CI general conserva exactamente tres fallos históricos de middleware/Inicio/Avisos. Validación visual del usuario recibida; no afirmar pruebas autenticadas de terceros.
- Datos previamente cotejados: 73 canciones activas, 50 nuevas/23 previas intactas; letras y referencias pendientes, catálogo no terminado. No reimportar ni modificar datos para publicar. RPC de orden ya autorizada/aplicada; no repetir migración ni probar con servicios reales.
- Este commit registra aprobación, sin cambios funcionales. Recibo final de merge SHA/deployment READY/dominio y revisión inicial de errores se registra en cuerpo del PR #316 para evitar otro despliegue documental. Confirmar dicho recibo antes de afirmar publicación.

## Cabecera editable sin duplicación — 2026-11-18 · PR #316

- Usuario aprueba aspecto contraído y cifrado; solicita editar nombre/artista/tono en esa misma cabecera, eliminando repetición de Información general. La fila cerrada permanece; abierta se sustituye por cabecera editable dentro del formulario, seguida de Letra/Cifrado. Formulario de canción nueva conserva etiquetas completas.
- Transporte compacto − tono +, nombres accesibles indican medio tono; biblioteca, programación y pantalla grande mantienen comportamiento de persistencia anterior. Controles personales del lector con objetivos táctiles de 44px, sin nuevas escrituras ni permisos; navegación Anterior/Siguiente y vista grande conservadas.
- Misma rama/PR y único Preview, sin producción, SQL, RLS ni maestro. 37 regresiones pertinentes; controles de navegador aislados con datos simulados y compilación antes de push. Pendiente validación visual autenticada; recibo SHA/READY/alias final en PR #316.

## Ajuste solicitado de márgenes y cifrado — 2026-11-18 · PR #316

- Usuario reportó ficha desalineada en Repertorio/Biblioteca y falta de aire incluso en icono/encabezado de Biblioteca. Márgenes internos explícitos en el panel completo y en Repertorio, sin modificar CSS global. Letra/Cifrado son desplegables inicialmente cerrados en ficha; selección evidente también en lector.
- Cifrado de Programación parte del tono oficial y muestra el tono del servicio. Controles ±½ y campo de tono actualizan la lectura; Guardar conserva tono/indicaciones del servicio mediante action existente con sesión/rol/evento. `solo_servicio` evita escribir en biblioteca; músicos conservan transporte personal sin guardado oficial.
- Sin SQL nuevo, RLS, roles, datos reales, maestro ni producción. 37 pruebas pertinentes; validaciones Chromium con datos/acciones simulados y compilación del bloque antes de push. Falta validación visual autenticada del usuario. Recibo final de SHA/READY/alias en PR #316; conservar único enlace de prueba.

## Ficha musical centrada y uso en vivo — 2026-11-18 · PR #316

- **Datos confirmados:** 50 nuevas guardadas mediante sesión real; 73 activas en ccvida/producción. Cotejo 50/50 completo, 23 previas intactas. El antiguo corte de 23 de abajo es histórico. Letras pendientes, catálogo no terminado.
- Usuario pidió información general arriba, hoja de acordes/letra amplia y centrada, transposición junto a acordes, vista grande y control del orden. Implementado en la misma rama musical, sin modificar CSS global ni roles.
- Pantalla grande editable en ficha y de lectura/navegación en Setlist; transposición personal sin escritura, guardado oficial restringido. Flechas Subir/Bajar de Programación/Setlist usan permiso existente de administración/liderazgo.
- **SQL autorizado y aplicado:** respuesta «Autorizar guardado del orden». Función `vida_reordenar_repertorio`, migración `orden_repertorio_atomico_20261118`, ejecución solo service_role desde action con comprobación de sesión/rol/evento. RLS intacta; tres filas de repertorio con la misma huella antes/después. No reordenar servicios reales como prueba.
- 34 pruebas pertinentes, TypeScript/lint específico/build local y pruebas Chromium aisladas de ficha/lector/orden con datos simulados. Falta validación autenticada/visual del usuario. No se declara CI global verde ni publicación de código.
- **Fuente de continuidad del bloque:** `docs/FICHA_MUSICAL_EN_VIVO_2026-11-18.md`. Maestro intacto. Entrada única de pruebas conservada; asignar al nuevo deployment al verificar READY. Recibo final de SHA/alias y cotejo en PR #316, sin otro despliegue documental.
- Falta aprobación nueva de merge/producción del código musical; los datos ya son compartidos con producción. Conservar pendientes de identificación y letras sin copiar material protegido.

## Retomar catálogo musical — 2026-11-18 · PR #316

- Usuario solicita continuar hasta completar canciones. Recuento directo actual ccvida: 23 activas, 22 con acordes, 22 YouTube, 20 Spotify, ninguna letra. No confundir candidatas/controles del build con filas importadas.
- Rama musical actualizada mediante merge de main `a7bcf097` (#317 y #318 publicados), conservando cambios musicales pendientes. No reabrir ni perder avisos, gestión pastoral o ministerio reciente. No se integró música a main.
- Catálogo: 235 entradas/variantes; 87 candidatas identificadas, 146 pendientes de identidad/datos, 2 referencias existentes. De las 87, 21 coinciden con fichas actuales por UUID o título normalizado: 66 posibles nuevas antes de comprobación de enlaces (no equivale a 66 importables).
- Corregida referencia de Pon aceite en mi vida a Jaime Murrell/Juan Salinas; retirado Spotify de Ricardo Rodríguez, que correspondía a otro canto. Añadidos videos oficiales para De los montes y Los muros caerán. Quiero entender/Renuévame ya son compatibles con el transportador vigente y vuelven a candidatas. No se cambia ningún registro guardado ni se copia letra protegida.
- Renovar certificado de enlaces en el único build Preview del bloque. Ejecutar importación idempotente exclusivamente con sesión real autorizada de la aplicación, conservando fichas existentes. No escribir SQL de carga, suplantar sesiones ni leer claves para evitar la autenticación.
- Entrada única conservada `https://calendario-git-agent-avisos-devociona-15ceac-vida-internacional.vercel.app/inicio`; al quedar READY, asignarla al Preview musical y cotejar. El usuario abre Alabanza → Biblioteca con cuenta administradora; la carga autorizada se ejecuta automáticamente sin seleccionar canciones.
- Falta contabilizar carga efectiva y resolver referencias ambiguas; todas las letras siguen pendientes salvo aportación/licencia autorizada. Sin autorización nueva de merge/producción ni maestro. Recibo exacto y pendientes de datos en PR #316, sin despliegue documental adicional.

## Publicación autorizada — último ministerio · 2026-11-18 · PR #318

- Usuario aprobó el resultado del Preview y autorizó «Perfecto pásalo a producción». Publicar únicamente #318, sin mezclar otras ramas ni modificar el maestro.
- Código aprobado `31092c6a60b4fdbd8447e3d84d4cd07643bf0130`, Preview READY `dpl_FExVtnkrgL3MDaiUsJYemMZk8X6R`. Cinco pruebas pertinentes y build correctos; Guardrails pasa. Tres fallos históricos de CI general siguen pendientes.
- Este registro solo incorpora aprobación/continuidad. Recibo final de merge, deployment READY y alias oficial en PR #318 para evitar otra publicación documental. No afirmar publicado sin cotejar ese recibo.

## Inicio — último ministerio visitado y ficha del líder · 2026-11-18

- Solicitud nueva: el último ministerio abierto debe encabezar Inicio al regresar. Rama `agent/ministerio-reciente-20261118`, basada en main publicado `a117e24b` (#317). No mezclar #313/#316.
- Implementado: preferencia por usuario/dispositivo al montar un ministerio autorizado con membresía; ordena Inicio/selector, conserva demás equipos y badges; ignora ministerios ajenos o retirados. Sin cambios de DB, RLS, membresías o permisos.
- Cinco pruebas pertinentes, TypeScript/build local correctos. Falta validación autenticada y autorización de producción. Recibo de PR/Preview/SHA final en el PR de esta rama.
- Presentación ya existe: líder asignado → su ministerio → lápiz superior Personalizar ministerio → Personalizar dashboard → descripción/portada/avatar/colores → Guardar cambios. No se construye otra ficha ni se otorgan permisos globales.
- Entrada de prueba única conservada: `https://calendario-git-agent-avisos-devociona-15ceac-vida-internacional.vercel.app/inicio`. No enviar enlaces de deployments distintos. Detalle/límites/reversión: `docs/MINISTERIO_RECIENTE_2026-11-18.md`.
- Producción del bloque anterior ya confirmada en PR #317: merge `a117e24b`, deployment `dpl_CQntRW1Z4tVszbDtyn272dXX9zyx` READY y dominio habitual correcto. Maestro intacto.

## Publicación autorizada — 2026-11-18 · PR #317

- Usuario validó el resultado y autorizó expresamente: «Perfecto pásalo a producción». Integra únicamente el bloque de avisos, galería y administración de mensajes del PR #317; no integra #313/#316 completos ni modifica el maestro.
- Código validado: `2513bd3ace5ee7d2091cb0858c778d4b6e257cc8`, Preview READY `dpl_Dhz2BV37YNc9WrhCWY3Czf5UzmgJ`. Este registro solo incorpora aprobación/continuidad; no cambia funciones.
- 45 pruebas pertinentes, TypeScript/lint específico y build correctos. Guardrails GitHub pasó. Cotejados logs de CI temporal: persisten exactamente los tres fallos históricos de middleware/Inicio/Avisos; no declararlos corregidos ni CI general verde.
- Migración de administración activa ya aplicada y cotejada; no volver a ejecutarla ni borrar contenido. Ningún aviso real enviado desde esta sesión.
- Proceder a integrar/publicar en `https://calendario-vida-internacional.vercel.app`. Recibo final de merge SHA, deployment READY y dominio se registra en el cuerpo del PR #317 para evitar otra publicación solo documental. Antes de afirmar publicación, verificar ese recibo y estado real.

## Gestión general de mensajes — 2026-11-18 · PR #317

- Autorización expresa recibida: «Si solo administradores activos podrán hacerlo». Solo Administrador activo puede gestionar publicaciones dirigidas de otros autores, incluidos borradores. Pastor conserva gestión propia; no se cambian roles.
- RLS **aplicada** en ccvida: `vida_devocionales_gestion_administrador_20261118`, tres políticas SELECT/UPDATE/DELETE exclusivas de administrador activo. Trigger impide cambiar UUID/autoría. Una publicación y misma huella antes/después; ningún contenido ni envío real modificado.
- Código de galería/actions amplía consulta y gestión al administrador con JWT/RLS, mantiene autor original y revisión concurrente. Eliminar solo administrador. Borradores aclaran acceso del autor y administración. Estudios sigue como biblioteca publicada.
- Propuesta anterior `20261118000100_vida_devocionales_eliminacion_autor.sql` nunca aplicada y retirada: NO restaurar ni conceder DELETE a pastores. Antecedentes de bloqueo inferiores superados por este registro, no por una aprobación de producción.
- 45 pruebas pertinentes, TypeScript/lint específico/build locales correctos; browser aislado a 390 px con acciones simuladas. Falta validación autenticada del usuario. Sin merge ni despliegue de producción; maestro intacto.
- Mantener entrada única `https://calendario-git-agent-avisos-devociona-15ceac-vida-internacional.vercel.app/inicio`, misma rama `agent/avisos-devocionales-20261117`. Recibo de Preview final/SHA en PR #317. No usar alias de #313 para probar este bloque.
- Alcance, evidencia y reversión: `docs/GALERIA_MENSAJES_PASTORALES_2026-11-17.md`. Gestión general aplica a `vida_devocionales`; no ampliar permisos de paquetes históricos.

## Centro Pastoral — Galería y edición · 2026-11-17 · PR #317

- Usuario indicó «lo demás está bien» y pidió galería de mensajes anteriores, edición de título/video y eliminación desde Centro Pastoral. Preparado en la misma rama/alias del PR #317, aún sin producción.
- Galería propia con miniaturas, búsqueda, filtros Publicados/Borradores, edición existente y confirmación de eliminación. Se conservan autoría/audiencia, reenvío pendiente y publicar/despublicar.
- 40 pruebas pertinentes, TypeScript/lint del editor/actions y build local correctos; browser aislado a 390 px con acciones simuladas. Falta validación visual autenticada; no se alteraron publicaciones reales ni se enviaron avisos.
- **Bloqueo:** ccvida no tiene política DELETE en `vida_devocionales`; no afirmar que los devocionales ya se pueden borrar. Preparada migración `20261118000100_vida_devocionales_eliminacion_autor.sql`, NO APLICADA, limitada a autor pastor/admin activo. Requiere aprobación específica de RLS; no aplicarla automáticamente.
- Alcance, impacto, reversión y límites de carga: `docs/GALERIA_MENSAJES_PASTORALES_2026-11-17.md`. Recibo del nuevo HEAD/Preview READY en PR #317. Maestro intacto; merge/producción requieren autorización nueva.

## Ampliación de avisos — 2026-11-17 · PR #317

- Pedido actual: reenvío para destinatarios pendientes aun publicado; aviso de video nuevo en Inicio/Avisos y badge hasta abrirlo; recordatorio de activar push.
- Implementado en `agent/avisos-devocionales-20261117`, no en producción. Consulta con JWT/RLS del lector, marcadores locales por usuario/dispositivo (sin sincronización entre teléfonos), enlaces directos y renovación al reconectar/volver. Solo apertura del detalle retira ese video.
- Reutiliza únicamente recordatorio push de #313; no integra su Estudio/Cuaderno. No mezclar #316 musical. Maestro, permisos, tablas, publicaciones y registros de envío intactos.
- 35 comprobaciones pertinentes; compilación y TypeScript correctos; pruebas móviles aisladas con datos/acciones simuladas. Falta validación autenticada del usuario y aprobación nueva para merge/producción. No se enviaron notificaciones reales.
- Detalles/limitaciones/reversión: `docs/AVISOS_DEVOCIONALES_2026-11-17.md`. Preview y SHA final en PR #317; verificar recibo antes de retomar.

## Incidencia prioritaria — avisos de Devocionales · 2026-11-17

- Usuario reportó que el pastor Romy publicó para cinco ministerios y nadie recibió aviso. Verificados: publicación dirigida publicada, 17 destinatarios activos por pertenencia, 10 con push registrado (16 dispositivos), cero registros de envío para esa referencia. Sin trigger de envío en la tabla.
- Causa comprobada: acciones de mensajes dirigidos guardan/publican y revalidan pantallas sin invocar Web Push. Producción/main siguen en `76f28ff8da4a1f4ee19bbc2c682e281fd71ef309`, deployment READY `dpl_BcmYyxoCZihqM9z5Zjxa5TS5GJMK`.
- Preparada rama separada `agent/avisos-devocionales-20261117`: aviso deduplicado al publicar, audiencia conforme a RLS y preferencias, protección de autor/publicación/revisión y botón explícito **Enviar aviso pendiente** para el autor. Borradores/ediciones de contenido no reavisan; no se ampliaron destinatarios ni permisos.
- 24 pruebas pertinentes, TypeScript/lint/build locales correctos. No se enviaron avisos reales, no se modificó la publicación afectada ni se probaron teléfonos. Falta autorización de producción y recuperación real por el autor; el botón del Preview enviaría un aviso real, no pulsarlo como prueba.
- [Checkpoint de la incidencia](AVISOS_DEVOCIONALES_2026-11-17.md). Recibo de PR/Preview exacto se añade al PR sin otro build documental. Maestro, RLS, roles, cron y planes intactos.
- No mezclar: PR musical #316 sigue Draft en `agent/catalogo-canciones-vida-20261117`, SHA `039283b278801ce1af4113d46dd758fab13903de`; último conteo verificado aquí: 23 canciones activas. Las candidatas comprobadas del build no equivalen a filas importadas. PR #313 también permanece separado.



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

## Ficha musical y corrección de carga cero · 2026-11-17

- Usuario confirmó «0 canciones incorporadas» y pidió ver canciones guardadas como creadas con +, además de ordenar su ficha de letra/acordes/tono/enlaces. Rama y PR #316 continúan sin merge.
- Corrección: certificado completo generado por el build, ligado por SHA-256 al catálogo y vigente 24 horas; la action conserva sesión/rol e idempotencia, sin repetir solicitudes a proveedores durante cada inserción. La ejecución anterior descartaba fichas al fallar esa segunda comprobación. No atribuir aquellos fallos a una causa de red específica sin evidencia.
- Nueva ficha compartida de creación/edición: nombre, artista/versión, tono base, Letra, Acordes y estructura, Notas y enlaces cerrados; campos ocultos permanecen montados para no perder datos al guardar. Permisos finales se conservan: administración/líderes y futuras personas expresamente autorizadas; nadie adicional asignado.
- 20 pruebas pertinentes, build/TypeScript y lint local verificados. Flujo aislado Chromium móvil con CSS compilado verifica edición de campos y pestañas sin pérdida de datos ni desbordamiento. Recibo del único Preview del nuevo bloque, certificado real e importación observada se registran en PR #316; no declarar carga realizada sin cotejo de ccvida.
- Pendiente concreto: verificar cuántas referencias admite el build nuevo, comprobar filas efectivamente incorporadas con sesión autorizada y validar la ficha real. Sin producción, cambios de RLS/roles ni cierre de fase. Los cortes siguientes son históricos.

## Catálogo musical — corrección de disponibilidad y carga solicitada · 2026-11-17

- El usuario rechazó importar manualmente y reportó videos «Not Available». PR #316 sigue Draft en `agent/catalogo-canciones-vida-20261117`; no está en main ni producción.
- Se reemplazó la selección manual por carga automática preparada al abrir Biblioteca con sesión real de administración. Lotes de dos; título/intérprete/estado `OK` de YouTube y pista Spotify deben comprobarse antes de incorporar. Existentes y archivadas permanecen intactas. Las 82 referencias anteriores eran candidatas; solo 25 tienen ambos enlaces para intentar esta comprobación. No declarar 82 canciones verificadas.
- El acceso a YouTube desde el entorno está bloqueado (proxy 403); falla también el acceso web directo. El Preview comprueba metadatos desde Vercel durante su build y genera un informe exclusivamente editorial en sus logs de build, sin usuarios/claves. El estado real de ese informe, importación y deployment queda en el recibo del PR. No afirmar filas importadas sin consulta posterior de ccvida.
- **Aclaración final del propietario:** solo líderes de Alabanza y personas que él autorice pueden editar. Corrige su respuesta anterior «todos los integrantes». No se abrió el acceso a todos ni se otorgó rol/liderazgo a nadie; faltan identidades concretas para cualquier autorización adicional.
- **Agregado con un toque ya existente:** componente activo `RepertorioServicioEditor.tsx`, con círculos, agregado directo e indicador de duplicado. Se conserva; el picker antiguo no es la superficie activa.
- Verificado localmente: 17 pruebas, TypeScript, build, lint de archivos nuevos y flujo Chromium automático con datos simulados. Falta validación autenticada/medios reales; sin publicación ni cierre de fase. El historial siguiente del importador manual está sustituido por este corte.

## Catálogo de canciones VIDA · preparado 2026-11-17

- **Tarea actual:** organizar e incorporar el listado musical del usuario. Rama `agent/catalogo-canciones-vida-20261117`, base main `76f28ff8da4a1f4ee19bbc2c682e281fd71ef309`. [Checkpoint del catálogo](CATALOGO_CANCIONES_VIDA_2026-11-17.md).
- **Preparado:** 235 entradas/variantes; 82 referencias candidatas con tono y cifrado aportados, 151 pendientes, 2 fichas existentes conservadas. Solo 25 candidatas tienen ambos enlaces. Todas las letras siguen pendientes; hubo bloqueo automático de la copia masiva de letras, sin reintentos para eludirlo. No afirmar catálogo completo ni coincidencia musical certificada.
- **Implementado:** revisión e importación seleccionable en la biblioteca existente de Alabanza, por server action con sesión y permisos de administración/líder. Lotes de hasta 20; no sobrescribe ni reactiva fichas, admite reintentos. Las pendientes se pueden completar en el editor existente.
- **Probado:** TypeScript, build completo, diez pruebas pertinentes y lint de archivos nuevos. Guardrails y recibo del único Preview se verifican al publicar la rama y se registran en el PR. No se certifican fallos históricos de CI ni pruebas visuales autenticadas.
- **Datos/publicación:** no se escribió en Supabase ni se cambió RLS, roles, esquema, maestro o producción. El Preview comparte ccvida real: importar allí guarda contenido editorial visible para la biblioteca habitual. No enviar importaciones ficticias. Sin merge autorizado.
- **Conservar trabajo anterior:** PR #313 Draft permanece separado en `agent/devocionales-centro-pastoral-20261116`, SHA `155c7614fe74b0f9c75046331f37820969a467fe`; Preview `https://calendario-git-agent-devocionales-cen-bd65af-vida-internacional.vercel.app`, READY `dpl_ButgTu9NgUSVFGLPhXAaiB1NXZnR`. Incluye continuidad Estudio/Cuaderno, paginación de videos y recordatorio de notificaciones; pendiente aprobación visual, no integrar automáticamente con el catálogo.
- **Siguiente paso:** revisar el catálogo en el Preview de esta rama con la cuenta propia y confirmar las referencias elegidas; importar contenido real y resolver dudas. Falta aprobación nueva para integrar/publicar código. Maestro y Bloque 4 permanecen sin cambios. El registro que sigue conserva contexto histórico; el estado de este corte prevalece para esta tarea.

## Discipulado — Biblioteca de cursos y edición integral · preparado 2026-11-16

- **Solicitud aprobada:** el usuario pidió sustituir la ficha visible permanentemente por una biblioteca de carpetas; abrir cada curso y editar Información, Lecciones y Examen final; permitir cursos temáticos propios, editor de respuestas tipo formulario, y eliminar cursos de forma protegida.
- **Rama y Preview fijo:** trabajar en `agent/devocionales-centro-pastoral-20261116` para conservar `https://calendario-git-agent-devocionales-cen-bd65af-vida-internacional.vercel.app`. Crear exactamente un Preview del bloque al finalizar los cambios.
- **Cambios preparados en el código:** biblioteca separando Discipulado principal y cursos temáticos; cada curso abre sus 3 secciones; preguntas con añadir/quitar hasta seis respuestas, elección de la correcta y vista previa; gestor puede eliminar cursos sin alumnos, o archivar cursos con historial; los alumnos pueden comenzar cursos temáticos sin sustituir el Discipulado principal.
- **Autorización de datos:** el usuario aprobó expresamente separar tipos de curso y la asignación automática, así como el borrado seguro sin historial y archivado preservando registros. Migración localizada `20261116220700_discipulado_biblioteca_tematica.sql`, sin cambiar RLS y sin eliminar datos existentes.
- **Seguridad:** las aprobaciones temáticas no deben otorgar el distintivo del Discipulado principal. La inscripción automática sigue reservada al principal. Las políticas y ministerios de otras áreas no se modifican.
- **Reversión:** volver a la versión anterior de UI y RPC de inscripción/prioridad en una migración de reversión, manteniendo `tipo` y datos creados; no borrar temáticos o progreso durante una reversión. La función segura de retiro preserva historiales.
- **Aprobación y merge:** el usuario validó visualmente el Preview fijo el 2026-11-16 y autorizó integrar a producción y actualizar el maestro. PR #312 fusionado a `main` en SHA `0e2aa35c149d9b5cb3d4585dd502ffc04edd78ae`; Preview READY del SHA `cc7d73761f72e9055e47feff00ead973cf4e7eb7`. El cambio de código compiló; pruebas generales de CI heredadas siguen fallando fuera del alcance. Verificar el último deployment READY de Vercel correspondiente a `main` antes del cierre de publicación.
- **Fuera del alcance:** PR #297 sigue Draft; no integrar su función de borrado irreversible. Issue #309 privacidad interministerial sigue pendiente.

## Discipulado — Producción confirmada y cierre del ajuste móvil · 2026-11-16

- **Aprobación:** el usuario confirmó que el ajuste «Nota mínima» se ve bien en Preview y posteriormente validó el comportamiento en producción. Autorizó expresamente la integración del PR #311 y luego el registro oficial de ese estado en el maestro.
- **Publicado:** PR #311 integrado a `main` (merge SHA `59017b57852b4f9b7d270f07d171de8300732292`), Vercel producción READY en `dpl_DBzdoTamh5aiUJ8zmra3gaGLdhbs`. No se alteraron funciones ni datos al realizar esta actualización documental.
- **Preview fijo:** `https://calendario-git-agent-devocionales-cen-bd65af-vida-internacional.vercel.app` permanece como URL única de pruebas.
- **Pendiente:** validación de privacidad entre ministerios, [issue #309](https://github.com/vidainternacional/calendario/issues/309), esperando retroalimentación del usuario. No afirmar aprobada ni cerrar.
- **Prioridad oficial:** Bloque 4 — Discipulado; FASE I diferida. PR #297 permanece separado y sin autorización para eliminación de cursos.
- **Nota de proceso:** el registro de esta aprobación actualiza únicamente documentación maestra, bitácora y alcance; no incorpora ninguna nueva funcionalidad.

## Validación visual Discipulado recibida y actualización del maestro — 2026-11-16

- El usuario confirmó en el Preview fijo que el modal de nota mínima en Discipulado **ya está bien**; ajuste visual aprobado.
- Al recibir esa aprobación, el usuario autorizó registrar en `__VIDA_INTERNACIONAL.md` el ajuste de Discipulado y el estado REAL del PR #308: integrado a `main` y producción READY.
- Desarrollo del ajuste: PR [#311](https://github.com/vidainternacional/calendario/pull/311) trabajó en la rama `agent/devocionales-centro-pastoral-20261116`, se validó con el Preview fijo y se integró a `main` tras autorización expresa. PR #310 duplicado cerrado sin merge.
- La retroalimentación de privacidad entre ministerios continúa pendiente en [Issue #309](https://github.com/vidainternacional/calendario/issues/309). No se modificaron permisos ni se realizaron publicaciones de prueba.

## Continuación 16-11-2026 · Privacidad pendiente y Discipulado

- La persona que colabora en la prueba de visibilidad de publicaciones entre distintos ministerios responderá **esta noche del 16-11-2026**. El usuario dará entonces su retroalimentación; **no cerrar ni afirmar privacidad validada antes**. Seguimiento persistente: [GitHub Issue #309](https://github.com/vidainternacional/calendario/issues/309).
- La rama de Devocionales ya fue **integrada** mediante PR #308, merge SHA `e20c8504c84dc041571ccdc2f37cf698789247b3` y Vercel producción READY deployment `dpl_89khTdozTZohhMicbWYnXkGnueZA` en `calendario-vida-internacional.vercel.app`. No conservar como estado vigente la nota anterior de PR #308 Draft: esa nota fue escrita antes del merge.
- Siguiente área oficial según maestro: **Bloque 4 — Discipulado**. Se examinó PR #297 (OPEN/Draft): combina un ajuste de modal cortado en móvil con la **eliminación irreversible de cursos y datos relacionados**. No aprobar ni integrar la eliminación sin autorización específica de impacto y reversión.
- Para avanzar sin esperar la prueba ni tocar datos, se prepara una rama nueva **solo visual**, `agent/discipulado-criterio-movil-20261116`, que permite desplazar verticalmente el modal de nota mínima y mantiene accesible «Guardar criterio» en móvil. No modifica servidor, tablas, RLS, permisos, valores, guardado ni lógica de Discipulado. PR #297 permanece intacto.
- Pendiente de validar en el teléfono: abrir Nota mínima, comprobar desplazamiento en pantalla pequeña y teclado, guardar un valor válido, cerrar y volver a abrir; conservar aspecto en escritorio. No fusionar ni publicar hasta aprobación.

## Producción de Devocionales y mensajes — aprobación 2026-11-16

- **Implementado y aprobado visualmente:** Editor de Centro Pastoral, publicación o borrador privado, combinación de destinatarios entre congregación/roles/líderes/ministerios reales, nueve categorías, series con episodios, biblioteca de Estudios con filtros/lista/cuadrícula y retorno contextual. El usuario comprobó y aprobó el Preview.
- **Autorización de producción:** el usuario solicitó expresamente integrar este bloque a producción el 16 de noviembre de 2026. Incluye la base del PR #306 y la extensión del PR #308; la integración definitiva será vía #308 con base `main`, sin incorporar otros PR Draft.
- **Datos:** dos migraciones aditivas específicas de `vida_devocionales` aplicadas a ccvida; RLS activo; borradores solo propios; no se migraron paquetes pastorales históricos ni se alteraron roles o políticas de otras tablas. No se crearon publicaciones ficticias.
- **Verificación previa:** Vercel Preview en rama `agent/devocionales-centro-pastoral-20261116` READY (SHA `70185fc81fed69c9b5cfcbaf0b7ab971c01c4346`); usuario validó la UI en su celular. La verificación autenticada cruzada de destinatarios de ministerios distintos sigue pendiente.
- **Integración:** este registro fue preparado antes de la fusión. Confirmar en el PR #308 el SHA finalmente integrado a `main` y en Vercel la publicación **production READY** del mismo SHA antes de afirmar que quedó publicado. La bitácora no sustituye esa comprobación.
- **Conservación:** mantener todos los cambios de continuidad del PR #307 (`AGENTS.md` y esta bitácora), sin sobrescribirlos al combinar ramas antiguas. Mantener las funciones pastorales existentes, menús, navegación, guardado, Biblia y Discipulado sin cambios.
- **Reversión:** regresar a último deployment READY anterior en Vercel y revertir la integración Git si hubiera un error grave; no borrar tablas ni publicaciones al revertir la interfaz. No eliminar datos de usuarios para solucionar incidencias.
- **Siguiente prueba:** tras publicar, comprobar menú inferior, biblioteca, categorías, series, carga, login y permisos con dos cuentas reales, sin enviar mensajes de prueba a la congregación.

## Cómo usar este registro

Esta es la entrada operativa para continuar sin reconstruir conversaciones. `AGENTS.md` exige leerla al iniciar y actualizarla al cerrar un bloque con cambios relevantes. Funciona en conversaciones que tengan acceso a este repositorio; no sincroniza el contenido completo de otros chats.

El maestro `__VIDA_INTERNACIONAL.md` conserva las decisiones y diseños aprobados. Su última actualización es del 7 de septiembre y su bloque formal de Discipulado no refleja todas las integraciones posteriores. No modificarlo sin presentar la actualización y recibir aprobación expresa. Esta bitácora no autoriza cambios nuevos ni certifica pruebas pendientes.

Al retomar: revisar estado Git, referencias remotas, esta bitácora en main y el checkpoint de la rama pendiente. Comprobar las evidencias pertinentes antes de actuar. No reiniciar migraciones ni reabrir módulos aprobados por la antigüedad de otro documento. `docs/MEMORIA_TECNICA_Y_VISUAL.md` y los checkpoints de fases anteriores conservan contexto histórico, no el estado operativo actual.

## Siguiente paso concreto

**Terminar la recuperación de contraseña.** El usuario informó que el enlace del correo vuelve al login en lugar de mostrar el formulario de contraseña nueva.

- Ya existe `/restablecer`, con dos campos para crear una contraseña nueva; no se puede revelar la anterior.
- Ya existe `/auth/confirm`, que verifica el token y dirige la recuperación a `/restablecer`.
- La solicitud actual de recuperación no especifica `redirectTo`. No se cambió código ni contraseñas para este diagnóstico.
- Se propuso ajustar la plantilla **Reset Password** de ccvida en <https://supabase.com/dashboard/project/lnkrojvyiwnlcoponxud/auth/templates> para usar el callback existente.
- **Pendiente:** confirmar que se guardó la plantilla y probar un correo nuevo. No afirmar que está resuelto ni pedir al usuario su contraseña o el enlace con token.

Enlace propuesto dentro de la plantilla HTML (variables literales de Supabase):

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=recovery&amp;next=/restablecer">Crear nueva contraseña</a>
```

Después de guardar, solicitar un correo nuevo; los correos anteriores no cambian. Verificar que abre el formulario y permite iniciar sesión con la contraseña nueva. No enviar correos reales ni restablecer contraseñas ajenas como prueba automática.

## Producción y datos

- Repositorio: `vidainternacional/calendario`.
- Aplicación habitual: <https://calendario-vida-internacional.vercel.app>.
- Alias conservado: <https://calendario-six-orpin.vercel.app>.
- El usuario confirmó acceso en producción después de migrar a ccvida. No requiere reinstalar la aplicación. Esto no certifica todos los recorridos autenticados.
- Base de producción: **ccvida**, Supabase `lnkrojvyiwnlcoponxud`. Conserva autenticación, perfiles, permisos, notas, progreso y datos de la aplicación.
- Origen anterior: **calendariovida**, `atjtjpchslxbseayzflz`; sigue con bloqueo de API por cuota según la última comprobación. Ticket de soporte `SU-554053`. No confundirlo con la base activa.
- Neon A `rough-glitter-04635242`: 469,302 ocurrencias del Antiguo Testamento.
- Neon B `curly-scene-97670657`: 142,096 ocurrencias del Nuevo Testamento y 124,504 textos bíblicos. Conserva además 9,133 ocurrencias AT redundantes, excluidas del recuento y de la selección por testamento.
- Las 611,398 ocurrencias fueron cotejadas por libro, cantidad y huella; también los textos y 21 tablas editoriales auxiliares. No volver a copiar el corpus a Supabase.
- La limpieza editorial anterior fue autorizada y ejecutada; no implica autorización para nuevas eliminaciones.
- Certificado de migración ccvida: 105 tablas, 192,405 filas y 25 usuarios en el corte de copia, con verificaciones de contenido y estructuras/permisos. Es una fotografía histórica: la actividad posterior cambia los conteos. No sobrescribir datos nuevos para igualar el origen.
- Solo ccvida mantiene activos los dos cron de recordatorios/resumen; los equivalentes del origen quedaron inactivos. No activar ambos ni enviar avisos de prueba a la congregación.
- Producción antes de este bloque documental: `d15049df4bb63af394d9c522bff7bddaa35fda27`, despliegue `dpl_FLYLGth6NSv4ohE5T1AN6Yq1xj86`, READY. No tratar ese SHA como el main más reciente después de nuevas integraciones.

Referencias: [Neon PR #304](https://github.com/vidainternacional/calendario/pull/304), [ccvida PR #305](https://github.com/vidainternacional/calendario/pull/305), [checkpoint bíblico](NEON_BIBLIA_CHECKPOINT_2026-11-14.md).

## Pendientes que deben conservarse

1. **Storage anterior:** siete archivos sin recuperar (seis fotos y un archivo pastoral). Buckets copiados, objetos no recuperados por el bloqueo del origen. No cambiar URLs a archivos inexistentes ni declarar migración de archivos completa. Se pueden volver a subir fotos propias desde la aplicación.
2. **Mensajes semanales por YouTube:** [PR #306](https://github.com/vidainternacional/calendario/pull/306), OPEN y Draft comprobado en este corte. Rama `agent/mensajes-semanales-20261116`, commit `d9a3279d5d0e0dc156601ba24d89aac434ad19f9`. No está en producción.
   - Preview: <https://calendario-gjj6hoogh-vida-internacional.vercel.app>.
   - Checkpoint y checklist están **en esa rama**, no necesariamente en main: [mensajes](https://github.com/vidainternacional/calendario/blob/d9a3279d5d0e0dc156601ba24d89aac434ad19f9/docs/MENSAJES_SEMANALES_2026-11-16.md), [verificación](https://github.com/vidainternacional/calendario/blob/d9a3279d5d0e0dc156601ba24d89aac434ad19f9/docs/VERIFICACION_VIDA_2026-11-16.md).
   - Usa enlaces YouTube y permisos pastorales existentes, sin almacenar videos ni cambiar esquema/RLS. Se comprobó que Romy tiene rol pastoral activo; no se modificó su rol.
   - 37 pruebas pertinentes, TypeScript y build pasaron en ese bloque. Falta validación visual y autenticada como pastor y miembro, y autorización expresa para integrar esta función nueva.
   - El Preview utiliza ccvida real: publicar contenido allí puede hacerlo visible en las superficies pastorales existentes de producción. No crear ni publicar mensajes ficticios como prueba.
3. **Discipulado:** [PR #295](https://github.com/vidainternacional/calendario/pull/295) integrado el 8 de septiembre. [PR #297](https://github.com/vidainternacional/calendario/pull/297) permanece OPEN/Draft según comprobación del 16 de noviembre. No confundirlo con lo ya aprobado ni integrarlo automáticamente.
4. **Pruebas tras la migración:** faltan recorridos reales específicos de perfiles/permisos, notas, progreso, Biblia y calendario. Aprovechar las confirmaciones recibidas; no exigir repetir toda la aplicación por cada corrección pequeña.
5. Persisten fallos heredados de regresión/CI. No declarar todo el CI en verde por un build correcto. No arreglarlos fuera del alcance solicitado.
6. Prueba manual Android del Centro de Hebreo pendiente, sin invalidar su cierre anterior.
7. Siete funciones históricas de importación bíblica permanecen en el origen. Su traslado o retiro requiere decisión separada; no ejecutarlas automáticamente.

## Vigilancia del espacio

Ya se creó y habilitó la tarea **Espacio Supabase VIDA**; no duplicarla sin comprobar su existencia. Revisión diaria de ccvida en modo lectura, con alertas al usuario en ChatGPT si aparece riesgo nuevo o no se puede comprobar el proyecto.

Referencia del 16 de noviembre: **250,148,531 bytes de base de datos y 0 bytes de Storage**. Umbrales de base: 350 MB aviso, 425 MB urgente, 475 MB crítico, usando 500 MB como referencia conservadora del plan gratuito. Storage: aviso preventivo separado desde 700 MB; verificar su límite vigente en el panel. Revisar crecimiento hacia 350 MB si se proyecta en menos de 14 días.

No certifica cuotas de tráfico, Auth ni WAL, ni garantiza impedir incrementos bruscos entre revisiones. No borra datos, cambia planes ni genera gastos automáticamente.

## Funciones y decisiones protegidas

Conservar los cierres históricos de Inicio/Calendario, Ministerios/Programación, Biblia/Estudio Profundo, Cuaderno personal, Centro de Hebreo, Centro Pastoral, avisos/push, Ayuda Solidaria, planes de lectura, experiencia musical y Discipulado. Las aprobaciones históricas no equivalen a una nueva certificación integral después de la migración.

Preservar el diseño minimalista móvil, rojo VIDA como acento, sin tarjetas anidadas ni cambios visuales globales. Mantener Fondos/Texto/Capas, edición y presentación pastoral, orientación horizontal/vertical, guardado/autoguardado y contenido editable. Conservar barra inferior estable en iPhone con teclado, desplegables nuevos cerrados, badges hacia pendientes reales, Deshacer/Rehacer de contenido y metadatos y privacidad por usuario.

La Fase I de ayuda por rol sigue diferida hasta el cierre funcional. Alertas pastorales urgentes siguen pausadas por privacidad/permisos. La cabecera dinámica de clima/hora fue descartada. Herramientas externas sugeridas no son implementaciones aprobadas.

## Autorizaciones y límites

- El usuario pide explicaciones fáciles, prácticas y concisas, preservar lo validado y evitar pedir instrucciones básicas repetidamente.
- Autorizó resolver, probar y publicar correcciones pequeñas y reversibles para probarlas en la aplicación habitual. Esta autorización no se extiende a funciones nuevas importantes, roles, RLS, datos sensibles, eliminaciones ni gastos.
- Las autorizaciones anteriores de migración/publicación/limpieza fueron concretas y ya se ejecutaron; no reutilizarlas como permiso general.
- Para nuevas funciones importantes: alcance acotado, diferencias revisadas, pruebas y máximo un Preview por bloque; no integrar ni publicar sin aprobación expresa.
- No modificar el maestro sin aprobación expresa. No cambiar planes ni generar gastos. No publicar claves, tokens, contraseñas o datos privados en GitHub/chat.
- No borrar almacenamiento local para solucionar acceso sin considerar notas sin sincronizar. No restaurar una copia antigua sobre actividad nueva.

## Registro reciente y mantenimiento

- 15 de noviembre: lector bíblico Neon integrado; limpieza editorial autorizada realizada. Persistió restricción externa del Supabase anterior.
- 16 de noviembre: ccvida integrado; usuario confirmó acceso habitual. Archivos antiguos siguen pendientes.
- 16 de noviembre: mensajes YouTube preparados en PR #306 Draft; vigilancia de espacio habilitada. Recuperación de contraseña pendiente de configuración/prueba.
- 16 de noviembre, este bloque: creada esta entrada operativa e instrucciones de lectura/mantenimiento en `AGENTS.md`. El usuario aprobó expresamente integrar el [PR #307](https://github.com/vidainternacional/calendario/pull/307) a main y exigió mantener la bitácora al terminar y aprobar cada proceso. Sin cambios de aplicación, maestro o bases de datos. El estado efectivo de integración se comprueba en ese PR.

La actualización es obligatoria al terminar cada proceso y al recibir la aprobación del usuario; también antes de una pausa prolongada o de cerrar un bloque con cambios relevantes. Es parte del trabajo del agente, no un recordatorio que deba dar el usuario. No depende de un temporizador: registrar por separado lo implementado, probado, aprobado y publicado.

En cada actualización, registrar en esta misma bitácora: fecha; resultado y evidencia; rama/PR y estado de publicación; pruebas realizadas y límites; pendiente concreto; próximo paso; autorización necesaria si existe. No acumular checkpoints contradictorios ni marcar como realizado lo que solo se propuso. Publicar según las autorizaciones vigentes; si queda solo local o en una rama, indicarlo explícitamente al usuario.
