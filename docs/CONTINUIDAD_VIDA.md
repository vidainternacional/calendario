# VIDA Internacional — Bitácora de continuidad

Último corte: 16 de noviembre de 2026. Leer primero al retomar este repositorio.


## Incidencia prioritaria — avisos de Devocionales · 2026-11-17

- Usuario reportó que el pastor Romy publicó para cinco ministerios y nadie recibió aviso. Verificados: publicación dirigida publicada, 17 destinatarios activos por pertenencia, 10 con push registrado (16 dispositivos), cero registros de envío para esa referencia. Sin trigger de envío en la tabla.
- Causa comprobada: acciones de mensajes dirigidos guardan/publican y revalidan pantallas sin invocar Web Push. Producción/main siguen en `76f28ff8da4a1f4ee19bbc2c682e281fd71ef309`, deployment READY `dpl_BcmYyxoCZihqM9z5Zjxa5TS5GJMK`.
- Preparada rama separada `agent/avisos-devocionales-20261117`: aviso deduplicado al publicar, audiencia conforme a RLS y preferencias, protección de autor/publicación/revisión y botón explícito **Enviar aviso pendiente** para el autor. Borradores/ediciones de contenido no reavisan; no se ampliaron destinatarios ni permisos.
- 24 pruebas pertinentes, TypeScript/lint/build locales correctos. No se enviaron avisos reales, no se modificó la publicación afectada ni se probaron teléfonos. Falta autorización de producción y recuperación real por el autor; el botón del Preview enviaría un aviso real, no pulsarlo como prueba.
- [Checkpoint de la incidencia](AVISOS_DEVOCIONALES_2026-11-17.md). Recibo de PR/Preview exacto se añade al PR sin otro build documental. Maestro, RLS, roles, cron y planes intactos.
- No mezclar: PR musical #316 sigue Draft en `agent/catalogo-canciones-vida-20261117`, SHA `039283b278801ce1af4113d46dd758fab13903de`; último conteo verificado aquí: 23 canciones activas. Las candidatas comprobadas del build no equivalen a filas importadas. PR #313 también permanece separado.


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
