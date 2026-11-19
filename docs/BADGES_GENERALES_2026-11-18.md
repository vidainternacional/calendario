# Badges generales y catálogo · 18-11-2026

Base: main bd7aa236, bloque musical #316 publicado. Alcance nuevo del usuario: revisar badges/avisos/notificaciones en toda la app; conservar lo demás aprobado y continuar catálogo. No autoriza otra publicación, RLS, roles, tablas, gastos, maestro ni alertas pastorales urgentes pausadas.

## Correcciones comprobadas en código

- El badge global restaba cantidades guardadas en localStorage al visitar cualquier ruta de un módulo. Se retiró ese descarte por sección: solicitudes permanecen hasta cambiar su estado real; avisos usan RPC de lectura y videos su marcador de apertura exacta existente.
- Aislamiento de cuentas: reinicio al salir/cambiar usuario e invalidación de respuestas atrasadas en pendientes y contador de avisos. Fallos de consulta conservan el último conteo de la misma cuenta.
- Inicio/Avisos → Para ti: añade confirmación de servicio con enlace al evento real, avisos por aprobar para administración/Pastor general, revisiones de Discipulado conforme al RPC de permisos y mensajes solidarios. Ingresos llevan al ministerio pendiente; reemplazos a sus Solicitudes ministeriales, no a la bandeja global que carece de reemplazos. El getter numérico anterior conserva compatibilidad.
- Discipulado: enlace revision=1 abre Personas, elige curso con revisión y ordena revisiones primero. No modifica evaluaciones, progreso ni aprobación.
- Ayuda Solidaria: los indicadores por contexto utilizan la misma consulta compartida, sin RPC por cada badge. Un chat oculto en details cerrado/fuera de pantalla/pestaña oculta no se marca leído. Al desplegar y mostrarse, se consulta y registra lectura con la función existente y JWT/RLS.

## Cobertura y límites

| Área | Fuente/recorrido conservado o corregido |
|---|---|
| Todas las rutas autenticadas | BottomNav usa el total compartido, sin descartar pendientes por entrar al módulo; App Badge cuando el navegador lo permite |
| Avisos | RPC existentes de no leídos/lectura; aprobación con permiso existente; actualización al reanudar/conectar |
| Inicio | Para ti, servicios y ministerios pendientes; videos publicados por abrir |
| Ministerios | Ingresos propios gestionables, solicitudes/reemplazos; navegación a ministerio autorizado |
| Calendario/servicios | Asignaciones futuras pendientes; vínculo al evento que requiere confirmación |
| Contactos | Solicitudes recibidas, aceptadas/rechazadas mediante acciones existentes |
| Centro Pastoral | Preguntas pendientes; novedades ministeriales conservan audiencia/autoría y enlace al video |
| Ayuda Solidaria | Solicitudes/aportes por revisar separados de mensajes no leídos; badges por contexto y lectura visible |
| Discipulado | Revisiones según permiso RPC, sin cambiar reglas del curso ni activar fases nuevas |
| Push | Preferencias, suscripciones y recordatorios existentes conservados; no se envió ningún aviso de prueba |

No equivale a haber probado todos los roles/dispositivos ni la entrega push a teléfonos. No se añadieron avisos por cada edición/tecla, no se amplían audiencias ni se crean marcadores remotos de lectura. No hay fuente de novedades nueva para funciones sin un evento/estado pendiente; no se inventan contadores. Esta revisión no cierra Bloque 4 ni Fase I.

## Refresco inmediato al cerrar pendientes

- Contactos: aceptar/rechazar una solicitud actualiza el recuento al confirmar éxito, sin esperar 30 segundos.
- Buzón pastoral: responder o archivar una pregunta dispara la actualización tras completar la acción.
- Avisos por aprobar, solicitudes y evaluaciones de Discipulado: aprobar o rechazar dispara la actualización solo con resultado satisfactorio.
- Ayuda Solidaria: cambios de estado de solicitudes y aportes refrescan los indicadores de atención.
- Se reutiliza el evento compartido `requestPendingIndicatorsRefresh` y el contador existente; no hay nuevos sondeos, migraciones ni cambios de permisos. Los avisos de ingresos ministeriales y confirmación de servicios permanecen intactos.
- Prueba de contrato agregada al conjunto de regresión. Pendiente CI en head nuevo y validación visual autenticada; no afirmar que la entrega push en otros dispositivos sea inmediata.

## Verificación

30 pruebas pertinentes: recuentos, resolución de reemplazos al destino autorizado, salida/cambio de cuenta, respuesta atrasada, fallos de consulta y catálogo/idempotencia/referencias. TypeScript/build comprobados antes de entrega. Chromium aislado con componentes reales: Para ti a 390px sin desborde, destinos de reemplazo/servicio/revisión y retiro al resolver; chat dentro de details cerrado no marca leído, abrir/mostrar sí. Datos y RPC simulados, sin envío ni escritura real. Lint de componentes heredados señala any/setState-in-effect existentes; no declarar lint general limpio. CI conserva deuda histórica; no afirmar CI global verde.

## Catálogo: continuación, no cierre

11 referencias adicionales identificadas: Todo se lo debo, Venimos a adorarte, Quién nos separará, Ciudad de colores, El Padre que siempre soñé, Tan solo he venido, Alfarero, Soberano Dios, No nos moverán, Tú nos creaste y Hay libertad (arreglo Dm). Evidencia pública de intérprete/grabación enlazada en cada ficha. No se copiaron letras ni se cambiaron los cifrados originales aportados.

235 entradas/variantes: 98 identificadas, 135 pendientes, 2 existentes. Identificación no equivale a video reproducible ni fila incorporada. El único Preview verifica disponibilidad/identidad, genera certificado del hash exacto; solo una sesión administradora real al abrir Biblioteca puede ejecutar la importación idempotente existente. No se suplantan sesiones, no se sobrescriben fichas. Enlaces no comprobados quedan fuera, incluidos canales de terceros que no coincidan con intérprete. Spotify y letras que falten no se inventan. Las 73 canciones confirmadas del corte anterior son un dato histórico; falta cotejo de cualquier nueva incorporación.

No declarar catálogo completo: quedan títulos/versiones ambiguos, fichas sin estructura aportada y letras no autorizadas para copia. La investigación de metadatos puede continuar; cualquier carga se confirma con recuento/cotejo real posterior a la sesión autorizada.

## Entrega y reversión

Rama agent/badges-generales-20261118. Un Preview del bloque; mantener la URL única existente. Recibo SHA/READY/alias/certificado en el PR, evitando otro despliegue documental. Revertir el commit restaura comportamiento anterior sin migraciones ni pérdida de canciones/lecturas. Producción, maestro y datos reales permanecen intactos hasta autorización aplicable y acciones reales del usuario.


## Auditoría del caso reportado — 19-11-2026

El usuario administrador reporta indicador solidario permanente, dos chats sin guía de origen y Avisos que no se despejan al verlos. Revisión sin suplantar sesión ni leer contenido privado: consulta agregada de estados encontró dos solicitudes cerradas (cancelada/rechazada) y una siembra ofrecida. Las definiciones de los RPC de lectura confirman registro por usuario/contexto y autorización existente; no se alteraron funciones ni políticas.

**Causas verificadas y solución:**

1. El contador global de Ayuda Solidaria incluía aportes ofrecidos, pero las pestañas/filas solo mostraban badges de mensajes no leídos. La siembra pendiente podía quedar escondida en Quieren sembrar, mientras la página abría Necesitan ayuda. Ahora ambas pestañas muestran su atención pendiente por separado, la entrada normal prioriza la categoría que la requiere y se puede filtrar Por atender. Cada caso indica explícitamente lectura frente a atención. Comenzar revisión/contacto reutiliza las acciones existentes y solo las ejecuta el usuario; leer no cambia el estado.
2. Los accesos generales llevan a la pestaña correcta y, para mensajes, al contexto/UUID exacto con ancla. Administración selecciona solo casos presentes en sus props autorizadas; miembros abren la categoría/conversación explícitamente solicitada entre sus propios registros. Sin acceso directo, los desplegables conservan estado cerrado.
3. PublicacionCard guardaba lectura solo si unread ya era true. Si se abría antes de cargar ese indicador, no registraba nada. Ahora abrir registra siempre el UUID (RPC idempotente). Fallos de red/servidor se muestran con Reintentar lectura; no se emite leído ni se reduce contador por un fallo.
4. Una respuesta lenta de get_unread_publication_ids podía restaurar el badge después de una apertura. Se conserva el conjunto leído durante esa consulta y se invalidan respuestas de otra sesión.
5. Faltaba solicitar actualización inmediata después de algunas acciones exitosas. Se añade en contactos recibidos, aprobación global de solicitudes, responder/archivar preguntas, aprobar/rechazar avisos y revisión de Discipulado. Ayuda Solidaria refresca indicadores y datos tras éxito. Ingresos ministeriales, confirmación de servicios y solicitudes ministeriales ya avisaban; se conservaron.

**Regla funcional:** mensajes se retiran al leerse; una solicitud/siembra se retira de atención inicial al pasar de enviada/ofrecido a revisión/contacto o resolverse por su gestor. El total de Avisos reúne también esas acciones; no es exclusivamente el número de publicaciones sin leer. No cambiar casos solo para esconder un indicador.

### Matriz de comprobación

| Recorrido | Comprobación |
|---|---|
| Aviso abierto antes de cargar unread | Se registra apertura incluso con unread=false; navegador con componente real |
| Error/desconexión al guardar lectura | No emite leído, muestra error/reintento; pruebas de RPC y navegador |
| Respuesta atrasada de no leídos | No restaura UUID leído; módulo real con respuesta controlada |
| Cambio/salida de cuenta | Borra indicadores e ignora respuesta anterior; pruebas de almacenes reales |
| Siembra ofrecida sin mensajes | Sigue como acción pendiente, ruta Siembras y filtro correcto; unidad + navegador |
| Ayudas cerradas y una siembra ofrecida | Abre Quieren sembrar; pestañas legibles a 320px e iPad |
| Leer chat frente a atender | Abrir no llama acción de estado; fallo conserva pendiente; éxito actualiza y retira atención inicial |
| Chat oculto/afuera de pantalla | No registra leído; al abrir/mostrarse sí; prueba Chromium aislada |
| Contactos, solicitudes, preguntas, avisos y Discipulado | Componentes reales con acciones simuladas: fallo no avisa actualización y éxito sí |
| Ingresos, confirmación de servicios y reemplazos | Comprobados permisos/consumidores existentes y destino del ministerio/evento; pruebas de regresión |
| Push recibido | Conserva actualización de Avisos/Para ti/badges compartidos; smoke de payload sin envío |
| Catálogo | Regresiones de identidad, idempotencia y referencias conservadas; no cambió el manifiesto en esta corrección |

49 pruebas pertinentes pasan; TypeScript/build y Chromium aislado comprobados. Se actualizaron contratos de pruebas que esperaban un getter anterior, sumas escritas literalmente, una ruta antigua y panel exclusivamente de líder: verifican ahora el resumen con destino, la suma real y la gestión de paleta ya aprobada por asignación, conservando biblioteca exclusiva de liderazgo/administración. No se cambió el comportamiento ministerial para acomodar esas pruebas. El postinstall existente se ejecutó en el entorno para la prueba web-push, sin dependencias nuevas.

Los tres fallos históricos del CI general de middleware/Inicio/Avisos no se declaran corregidos. No hay certificación con la sesión real del usuario ni entrega push en teléfonos; datos y RPC de pruebas son simulados. La vista autenticada del usuario queda pendiente. Maestro, RLS, permisos, casos reales y producción intactos. Un Preview del nuevo bloque, mismo alias y PR #319; recibo final en PR sin commit documental extra. Reversión por revert del código, sin migraciones ni pérdida de lecturas.
