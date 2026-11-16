# VIDA Internacional — Bitácora de continuidad

Último corte: 16 de noviembre de 2026. Leer primero al retomar este repositorio.

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
