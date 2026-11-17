# Avisos de Devocionales — 17 de noviembre de 2026

## Incidencia confirmada

El usuario informó que una publicación reciente del pastor Romy no produjo avisos. Se verificó en ccvida (`lnkrojvyiwnlcoponxud`), sin leer contraseñas, endpoints/llaves push ni notas privadas:

- Publicación dirigida `e82350cb-ac7f-4a0f-9e20-fc0d3fd07bef`, publicada el 17-11-2026 a las 22:05 UTC.
- Selección de cinco ministerios; sin audiencia congregacional ni roles globales añadidos.
- 17 destinatarios activos por pertenencia; 10 con suscripciones push registradas, 16 dispositivos. Son registros de suscripción, no confirmación de entrega o permiso actual del teléfono.
- Cero registros en `notificaciones_enviadas` para esa referencia. No hay triggers de envío en `vida_devocionales`.
- Main y producción confirmados en `76f28ff8da4a1f4ee19bbc2c682e281fd71ef309`; producción READY `dpl_BcmYyxoCZihqM9z5Zjxa5TS5GJMK`.
- Causa en código: `guardarMensajeDirigido` y `cambiarPublicacionDirigida` solo guardaban y revalidaban páginas. No llamaban al sistema push existente. No se atribuye la incidencia a cuota ni a un fallo de dispositivos sin evidencia.

## Corrección preparada

Rama independiente `agent/avisos-devocionales-20261117`, basada en main. No incorpora el PR musical #316 ni el PR #313.

- Al crear publicado o publicar un borrador, se invoca el envío deduplicado existente. Editar una publicación ya publicada y guardar un borrador no dispara otro aviso.
- Resolución de audiencia conforme a la política de lectura: unión de congregación, roles seleccionados, integrantes de ministerios activos y líderes contextuales. Solo cuentas activas, sin agregar pastores/administradores ajenos por defecto.
- Respeta las preferencias de avisos desactivadas; pertenecer a dos grupos no duplica el destinatario. Consulta paginada para no perder destinatarios por el límite de mil filas.
- Se vuelve a comprobar publicación/autor/revisión antes de enviar. Si se despublicó o cambió su audiencia, cancela ese intento.
- Reutiliza `notifyUsersOnceByReference` y la unicidad existente de tipo/referencia/persona. El resultado distingue personas con envío aceptado de un guardado sin aviso confirmado. Los registros previos se conservan; reintentar no repite los ya registrados.
- El autor dispone de **Enviar aviso pendiente** en sus publicaciones dirigidas publicadas. Requiere sesión pastoral activa y propiedad, no modifica contenido/audiencia/fecha de publicación y no permite enviar borradores o publicaciones de otro autor.
- Enlace push a `/estudios/mensajes/<id>`; RLS sigue protegiendo la lectura. Solo se incluye el título autorizado en el aviso.

## Verificación

- 24 pruebas pertinentes pasan: audiencias, pertenencias superpuestas, líderes contextuales, bajas, autoría, borrador, cambios concurrentes, errores de consulta, deduplicación/reintento, falta de dispositivos y paginación de 1001 perfiles; acciones de publicación y protección Web Push existentes.
- TypeScript, lint de los tres archivos de aplicación modificados y build completo locales correctos.
- Solo se comprobó la presencia de las tres variables VAPID en production/preview, sin descifrarlas ni leer sus valores. No se rotaron ni trasladaron claves de servidor.
- Preview con configuración pública ccvida limitada a esta rama; las claves de servidor existentes no se leyeron ni copiaron.
- **No se enviaron avisos reales ni se crearon publicaciones ficticias.** No se ha validado entrega en un teléfono. No declarar entregado el aviso de la publicación afectada por estas pruebas.
- Guardrails/PR/Preview exacto se verifican al publicar la rama; recibo en el PR sin otro despliegue documental. Persisten los fallos históricos de CI fuera del alcance.

## Publicación y recuperación

Falta autorización nueva para integrar/publicar este arreglo en producción. El documento maestro no se modifica. Una vez disponible el código, el autor puede usar **Enviar aviso pendiente** para la publicación existente; ese botón envía un aviso real a destinatarios elegibles y no es una prueba inocua. No debe pulsarse automáticamente desde esta sesión ni enviar mensajes de prueba a la congregación.

Quienes no tienen push habilitado pueden acceder al contenido autorizado, pero esta corrección no concede permisos del navegador ni garantiza un aviso visible en sus teléfonos.

## Reversión y continuidad

Volver al código anterior detiene el nuevo disparo de avisos. No borrar publicaciones, suscripciones ni registros de envíos para revertirlo: los registros evitan duplicados y preservan historial. Sin RLS, roles, esquema, cron, planes, gastos ni datos personales modificados.

El trabajo musical sigue separado en PR #316, SHA `039283b278801ce1af4113d46dd758fab13903de`. Último recuento de Alabanza en este diagnóstico: 23 fichas activas; no asumir que las 66 candidatas comprobadas del build ya se incorporaron todas. Retomar su cotejo y validación visual después de esta incidencia, sin sobrescribir ediciones nuevas.
