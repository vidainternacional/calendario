# Continuidad de estudio, biblioteca y recordatorio de notificaciones

Solicitud del usuario: «Ok hazlas», después de confirmar los tres pendientes en main `76f28ff8da4a1f4ee19bbc2c682e281fd71ef309`. No incluye rediseñar áreas cerradas ni publicar producción.

## Alcance implementado

1. **Biblioteca de videos:** se retoma el arreglo del PR #313. Se reúnen los primeros resultados necesarios de ambos orígenes autorizados, se ordena el conjunto y se pagina una vez. Las pruebas cubren 13+1, 7+7 y 1+13 videos, sin publicaciones ficticias.
2. **Estudio → Cuaderno → Estudio:** el enlace lleva consulta, sección y origen. El Cuaderno abre el filtro Estudio Profundo y ofrece retorno explícito. Se conserva también la consulta en la entrada de historial del navegador para el gesto Atrás. El resultado editorial se guarda temporalmente en sessionStorage separado por usuario, hasta cuatro horas; sin copia disponible se repite la consulta. Los apuntes no se incluyen en ese cache: se cargan de la misma nota canónica y siguen necesitando Guardar nota.
3. **Consultas recientes:** se conserva el historial remoto existente y se añaden hasta doce consultas recientes locales por usuario. No se guarda el texto de notas ni se transmite este historial a telemetría. No equivale a historial sincronizado entre dispositivos.
4. **Notificaciones:** recordatorio discreto en Inicio, sin overlay ni bloqueo. Lleva a `/perfil#notificaciones`, distingue permiso bloqueado, falta de suscripción y orientación de instalación en iPhone. Una suscripción activa no muestra aviso. Se puede posponer una semana, con preferencia separada por cuenta. No llama a `requestPermission` ni crea suscripciones por sí mismo. La activación conserva el control existente del Perfil.

## Preservación

- Se parte del main publicado con lectura y recuperación aprobadas. No se incorporan cambios antiguos de Auth ni del plan diario.
- No se modifican Supabase, SQL, RLS, roles, datos, planes de pago, configuración de notificaciones del servidor, service worker ni documento maestro.
- No se mandan correos ni push de prueba, no se crean usuarios ni se publican videos ficticios.
- Se conservan los borradores locales anteriores en `/workspace/calendario` sin sobrescribirlos. Este bloque se prepara en el worktree `/workspace/vida-continuidad-20261117`.
- Rama remota de revisión: `agent/devocionales-centro-pastoral-20261116`, ya conectada a ccvida. Se reutiliza el Preview fijo; no se copian secretos a otra rama.

## Verificación realizada antes de Preview

- TypeScript y build estándar Turbopack correctos.
- 17 regresiones del bloque y contratos pertinentes correctas.
- Ampliación dirigida: 62 pruebas, 61 correctas y un fallo heredado en `fase-f-cuaderno-offline-profesional.test.mjs`, que espera literalmente service worker `v2.4` cuando main ya tiene `v2.5`. Tanto ese test como el service worker son idénticos a main; no se alteran para ocultar el fallo.
- Lint de archivos nuevos y cargadores de biblioteca correcto. Los recuentos de avisos existentes en Inicio, Cuaderno, Estudio y PushToggle son iguales a main.
- Navegador móvil con componentes reales y dependencias simuladas: retorno por enlace y Atrás conserva consulta/resultado/sección sin otro análisis; historial accesible; recordatorio sin solicitud automática, enlace correcto, posposición persistente, distinción de bloqueo/actividad y aislamiento entre cuentas. No son pruebas autenticadas con cuentas reales de ccvida.
- Guardrails y revisión de diff antes de push. El resultado del despliegue y su SHA exacto se registran en el cuerpo del [PR #313](https://github.com/vidainternacional/calendario/pull/313) después de construir el Preview. Este registro precede ese despliegue; no dar READY por supuesto sin consultar la evidencia.

## Preview y checklist

Único enlace fijo de revisión: <https://calendario-git-agent-devocionales-cen-bd65af-vida-internacional.vercel.app>.

1. En Estudio Profundo buscar un pasaje, abrir una sección, entrar al Cuaderno y usar Volver al estudio anterior; repetir con el gesto Atrás. Debe conservar consulta y sección. Las notas guardadas siguen en el filtro Estudio Profundo.
2. En Estudios recorrer páginas y categorías de videos; no debe omitir ni repetir publicaciones. Si hay menos de doce publicaciones accesibles, ese caso real no permite validar visualmente el cambio de página; las pruebas simuladas cubren el volumen.
3. En Inicio, con notificaciones desactivadas, revisar aviso → Perfil → sección Notificaciones. Probar posponer y volver a Inicio. Con suscripción activa, no debe aparecer. No enviar pruebas de push a la congregación.

Cambio aplicado y compilado; falta validación visual tuya. Sin autorización nueva, no merge ni producción. El issue #309 y el cierre formal del Bloque 4 siguen separados.
