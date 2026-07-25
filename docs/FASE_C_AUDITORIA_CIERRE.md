# FASE C — Auditoría de cierre

Fecha de revisión: 2026-07-24

Estado: revisión técnica completada; pendiente confirmación visual final antes de cerrar la fase en el documento maestro.

## Alcance revisado

- Centro Pastoral.
- Colecciones de versículos.
- Bosquejos pastorales.
- Biblioteca Pastoral.
- Paquetes y materiales de estudio.
- Publicación interna y distribución.
- Navegación, carga, error, vacío y recuperación.

## Resultado funcional

- El flujo pastoral permite preparar, organizar y distribuir contenido desde una sola experiencia.
- Los paquetes relacionan bosquejos, colecciones y recursos de biblioteca.
- Las publicaciones aparecen dentro de Inicio según audiencia y permisos.
- Las rutas de materiales aceptan `public_slug` y el identificador antiguo del paquete.
- Cuando se requiere autenticación, el destino del material se conserva.
- La guía puede imprimirse o guardarse como PDF, copiarse y compartirse desde el dispositivo.
- La publicación normal permanece dentro de Vida; el enlace es una opción secundaria.
- Los estados vacíos conservan acciones para crear el primer elemento o continuar el flujo.

## Correcciones de la auditoría

### Navegación interna

Se eliminó la apertura forzada en una pestaña nueva desde Materiales de estudio.

Evidencia:

- `797eefdcfa4ecd9706b26ceeded957a725475080`

### Estado de carga transversal

Se agregó `app/(app)/pastoral/loading.tsx` con una representación visual estable del Centro Pastoral, accesible mediante `aria-busy` y texto para lectores de pantalla.

Evidencia:

- `23ef3f40ab748a146f9230dafefa81dfddaeb933`

### Recuperación ante errores

Se agregó `app/(app)/pastoral/error.tsx` para cubrir todos los módulos del segmento pastoral. Incluye:

- mensaje humano y claro;
- confirmación de que la información guardada permanece disponible;
- acción `Intentar de nuevo`;
- regreso al Centro Pastoral;
- referencia técnica mediante `digest` cuando Next.js la proporciona.

Evidencia:

- `e7c65dfb811453f3c767f15768539942d636f7cd`

## Producción

- No se encontraron grupos de errores de ejecución en Vercel durante la revisión.
- Las publicaciones internas fueron probadas con un paquete real.
- La corrección de navegación interna quedó desplegada en producción.
- El deploy del estado de carga quedó `READY`.
- Este documento genera un despliegue consolidado que incluye también el límite de error pastoral.

## Almacenamiento pastoral

Bucket privado utilizado:

- `pastoral-library`

Límite funcional configurado por archivo:

- 25 MB.

Uso observado el 2026-07-24:

- archivos almacenados: 1;
- espacio total: 20,272 bytes;
- tamaño aproximado total: 19.8 KB;
- archivo más grande: 20,272 bytes.

La aplicación utiliza accesos temporales firmados para archivos privados. No se aumenta el límite de 25 MB durante la FASE C. Cualquier ampliación debe considerar el plan activo de Supabase, transferencia mensual, crecimiento de audio/video y costos antes de modificar la validación.

## Decisiones para crecimiento

- Mantener 25 MB por archivo como límite inicial.
- Recomendar compresión de imágenes, audio y video antes de subirlos.
- No usar la Biblioteca Pastoral como repositorio de grabaciones extensas sin revisar capacidad y transferencia.
- Revisar uso del bucket desde administración antes de ampliar límites.
- Mantener archivos privados y accesos firmados.
- Tratar optimización profunda, métricas y escalabilidad como trabajo de la FASE E.

## Criterios de cierre

Estado técnico:

- acceso y permisos: cumplido;
- versículos y colecciones: cumplido;
- bosquejos: cumplido;
- biblioteca y recuperación de recursos: cumplido;
- materiales y distribución: cumplido;
- integración en paquetes: cumplido;
- flujo unificado del Centro Pastoral: cumplido;
- estados vacíos y retroalimentación: cumplido;
- carga transversal: implementada;
- recuperación ante errores: implementada;
- evidencia y almacenamiento: documentados.

## Validación pendiente antes del cierre oficial

Confirmar visualmente en producción:

1. Que al navegar entre módulos pastorales aparece el estado de carga sin saltos graves de diseño.
2. Que las pantallas habituales siguen abriendo correctamente después de agregar los límites de carga y error.
3. Que el flujo Materiales de estudio → Ver publicado permanece dentro de la aplicación.

Después de esa confirmación se puede actualizar `docs/FASE_C_PANEL_PASTORAL.md` y `__VIDA_INTERNACIONAL.md` para declarar la FASE C como completada. No debe iniciarse la siguiente fase hasta que el documento maestro refleje ese cierre.
