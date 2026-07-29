# FASE C — Auditoría de cierre

Fecha de revisión inicial: 2026-07-24  
Última actualización: 2026-07-29

Estado: revisión técnica completada; pendiente únicamente confirmación visual y funcional final antes de cerrar la fase en el documento maestro.

## Alcance revisado

- Centro Pastoral.
- Colecciones de versículos.
- Bosquejos pastorales.
- Biblioteca Pastoral.
- Paquetes y materiales de estudio.
- Publicación interna y distribución.
- Navegación, carga, error, vacío y recuperación.
- Acceso pastoral asignable.
- Almacenamiento e integridad de relaciones.

## Resultado funcional

- El flujo pastoral permite preparar, organizar y distribuir contenido desde una sola experiencia.
- Los paquetes relacionan bosquejos, colecciones y recursos de biblioteca.
- Las publicaciones aparecen dentro de Inicio según audiencia y permisos.
- Las rutas de materiales aceptan `public_slug` y el identificador antiguo del paquete.
- Cuando se requiere autenticación, el destino del material se conserva.
- La guía puede imprimirse o guardarse como PDF, copiarse y compartirse desde el dispositivo.
- La publicación normal permanece dentro de Vida; el enlace es una opción secundaria.
- Los estados vacíos conservan acciones para crear el primer elemento o continuar el flujo.
- Pastores y administradores activos tienen acceso automático; otras cuentas activas pueden recibir permiso explícito sin cambiar su rol global.

## Correcciones de la auditoría

### Navegación interna

Se eliminó la apertura forzada en una pestaña nueva desde Materiales de estudio.

Evidencia:

- `797eefdcfa4ecd9706b26ceeded957a725475080`

### Estado de carga transversal

Se agregó `app/(app)/pastoral/loading.tsx` con una representación visual estable del Centro Pastoral, accesible mediante `aria-busy` y texto para lectores de pantalla.

Evidencia:

- `23ef3f40ab748a146f9230dafefa81dfddaeb933`

### Alineación del skeleton con el flujo unificado

Durante la revisión final se detectó que el skeleton todavía representaba el dashboard pastoral antiguo con anchura `max-w-6xl` y tarjetas en cuadrícula, mientras la pantalla real utiliza un espacio unificado `max-w-3xl`. Esto podía producir un salto de diseño al terminar la carga.

Se actualizó el skeleton para conservar:

- la misma anchura del Centro Pastoral real;
- la misma cabecera;
- el bloque principal de espacio pastoral;
- la lista vertical de herramientas;
- los accesos secundarios a Biblia y Estudio.

Evidencia:

- `ff288bfc59291483eb1078c96aea4e5e3b824c8d`
- despliegue `dpl_9Sb2oNakGsP1b1PGUftFYp2kYKem` — `READY`.

### Recuperación ante errores

Se agregó `app/(app)/pastoral/error.tsx` para cubrir todos los módulos del segmento pastoral. Incluye:

- mensaje humano y claro;
- confirmación de que la información guardada permanece disponible;
- acción `Intentar de nuevo`;
- regreso al Centro Pastoral;
- referencia técnica mediante `digest` cuando Next.js la proporciona.

Evidencia:

- `e7c65dfb811453f3c767f15768539942d636f7cd`

### Errores reales frente a estados vacíos

La revisión integral detectó que varias consultas del servidor descartaban el error de Supabase y convertían un fallo real en una lista vacía. Esto podía mostrar mensajes como “Todavía no hay materiales” aunque el contenido no hubiera podido cargarse.

Se corrigieron las rutas:

- `/pastoral`;
- `/pastoral/bosquejos`;
- `/pastoral/colecciones`;
- `/pastoral/biblioteca`;
- `/pastoral/paquetes`;
- `/pastoral/materiales`.

Comportamiento resultante:

- una consulta correcta sin registros conserva el estado vacío correspondiente;
- un fallo al verificar el perfil o recuperar datos activa el límite de error pastoral;
- la persona puede reintentar o volver al Centro Pastoral;
- los enlaces de regreso utilizan de forma consistente el nombre `Centro Pastoral`.

Evidencia:

- `3b2b15b9c3e3e2d6569f12d93e7161b61144eb46`;
- `09a5d473ad0d5c1df4f320e16b87135422401726`;
- `1e91adbcd6865b85e644ac6b55d5c9e12bdbbd81`;
- `a6107973ed453ccd6ef94ce4ae2b994f47fe8c89`;
- `025c9a1ab5033971c0a1e78fad249dc23f6d3fd0`;
- `3ddc768f35e819527b9134e36b5dd1f9d3c791aa`;
- preview consolidado `dpl_9pgNUsoKUaAZ7CjUZZzjmEQU3PnR` — `READY`;
- compilación de Next.js y TypeScript completadas correctamente.

## Producción

- No se encontraron grupos de errores de ejecución en las rutas pastorales durante la consulta de los últimos siete días realizada el 2026-07-29.
- Las publicaciones internas fueron probadas con un paquete real.
- La corrección de navegación interna quedó desplegada en producción.
- `Materiales de estudio → Ver publicado` utiliza navegación interna mediante `/material/[slug]` y no abre una pestaña externa.
- El límite de error pastoral conserva reintento y regreso seguro al Centro Pastoral.
- El skeleton alineado con la experiencia unificada compiló correctamente y quedó `READY` en producción.
- La nueva diferenciación entre error real y estado vacío pasó preview y queda pendiente de integración final a producción.

## Almacenamiento pastoral

Bucket privado utilizado:

- `pastoral-library`.

Configuración verificada el 2026-07-29:

- bucket privado;
- límite técnico por archivo: `26,214,400` bytes, equivalentes a 25 MiB;
- enlaces firmados por una hora;
- tipos permitidos: PDF, documentos, presentaciones, texto, imágenes, audio y video compatibles;
- separación de archivos por propietario.

Uso observado el 2026-07-29:

- archivos almacenados: 1;
- registros de archivo: 1;
- enlaces externos: 0;
- espacio total: 20,272 bytes;
- tamaño aproximado total: 19.80 KiB;
- archivo más grande: 20,272 bytes;
- archivos registrados sin objeto físico: 0;
- objetos físicos sin registro pastoral: 0.

La auditoría tampoco detectó paquetes relacionados con bosquejos, colecciones, recursos o PDF de presentación pertenecientes a otra cuenta; identificadores de recursos inexistentes; ni publicaciones sin `public_slug`.

La aplicación utiliza accesos temporales firmados para archivos privados. No se aumenta el límite de 25 MiB durante la FASE C. Cualquier ampliación debe considerar el plan activo de Supabase, transferencia mensual, crecimiento de audio/video y costos antes de modificar la validación.

Documento detallado:

- `docs/FASE_C_ALMACENAMIENTO_Y_LIMITES.md`.

## Decisiones para crecimiento

- Mantener 25 MiB por archivo como límite inicial.
- Recomendar compresión de imágenes, audio, video, PDF y presentaciones antes de subirlos.
- No usar la Biblioteca Pastoral como repositorio de grabaciones extensas sin revisar capacidad y transferencia.
- Mantener videos largos en los canales oficiales y registrar el enlace en la Biblioteca.
- Revisar el uso mensual y el plan activo desde `Usage` o `Billing` de la organización en Supabase.
- Mantener archivos privados y accesos firmados.
- Tratar optimización profunda, métricas y escalabilidad como trabajo de la FASE E.

## Criterios de cierre

Estado técnico:

- acceso y permisos: cumplido técnicamente;
- acceso pastoral asignable: implementado y protegido;
- versículos y colecciones: cumplido;
- bosquejos: cumplido;
- biblioteca y recuperación de recursos: cumplido;
- materiales y distribución: cumplido;
- integración en paquetes: cumplido;
- flujo unificado del Centro Pastoral: cumplido;
- estados vacíos y retroalimentación: cumplido;
- carga transversal: implementada y alineada con la pantalla real;
- recuperación ante errores: implementada y conectada a las consultas principales;
- navegación interna del material publicado: confirmada en código;
- integridad de relaciones y archivos: confirmada;
- ausencia de errores recientes en producción: confirmada;
- evidencia y almacenamiento: documentados.

## Validación pendiente antes del cierre oficial

Confirmar visual y funcionalmente en producción:

1. Entrar al Centro Pastoral y navegar por Bosquejos, Versículos, Biblioteca, Paquetes y Materiales sin saltos graves de anchura o estructura durante la carga.
2. Conceder acceso pastoral a una cuenta activa con rol `lider` o `servidor`, entrar con esa cuenta y crear contenido propio.
3. Confirmar que esa cuenta no obtiene acceso administrativo y que, al retirar el permiso, deja de entrar al Centro Pastoral.

Después de esa confirmación se puede actualizar `docs/FASE_C_PANEL_PASTORAL.md` y `__VIDA_INTERNACIONAL.md` para declarar la FASE C como completada. No debe iniciarse la siguiente fase hasta que el documento maestro refleje ese cierre.
