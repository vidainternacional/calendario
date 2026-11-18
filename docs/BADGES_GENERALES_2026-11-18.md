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
