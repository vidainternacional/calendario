# FASE F — Offline-first para Biblia → Notas

Fecha: 2026-08-13

## Requisito confirmado

VIDA debe permitir utilizar determinadas funciones sin conexión a Internet. Dentro de FASE F, `Biblia → Notas` se implementará con comportamiento **offline-first**.

## Objetivo para Notas

1. Crear notas sin Internet.
2. Editar notas sin Internet.
3. Eliminar notas sin Internet conservando una operación pendiente de sincronización.
4. Mantener los cambios localmente de forma inmediata.
5. Sincronizar con Supabase cuando vuelva la conexión.
6. Evitar duplicados mediante identificadores estables e importaciones idempotentes.
7. Resolver conflictos de forma predecible sin perder silenciosamente el contenido local.
8. Conservar privacidad por usuario mediante las políticas RLS del cuaderno canónico.

## Estado técnico actual

- El cuaderno visible usa actualmente la clave local histórica `vida-biblia-notas-v2`.
- Esa clave debe conservarse durante la transición para no perder notas existentes en dispositivos.
- `notas_estudio` es la base del cuaderno canónico en Supabase y ya fue ampliada de forma aditiva en FASE F.
- La sincronización servidor todavía no está conectada al cuaderno visible.
- El service worker `public/sw.js` actualmente cachea manifest e iconos, pero ignora navegaciones, `/_next/`, `/api/` y Supabase.
- Por lo anterior, escribir Notas puede funcionar localmente mientras la aplicación ya está cargada, pero una apertura en frío de la PWA completamente sin red todavía no está soportada.

## Estrategia por capas

### Capa 1 — almacenamiento local único

Centralizar lectura/escritura de Notas detrás de una sola API cliente, conservando la clave histórica. Ninguna pantalla debe crear un segundo almacenamiento paralelo.

### Capa 2 — sincronización

Agregar una cola local de operaciones `upsert`/`delete`. La UI guarda primero localmente y luego intenta sincronizar. Al recuperar `online`, `focus` o `visibilitychange`, se vuelve a intentar la cola.

### Capa 3 — reconciliación

Al iniciar con conexión, descargar las notas del usuario desde Supabase, reconciliar por UUID/origen y conservar la versión más reciente según reglas explícitas. La sincronización debe ser idempotente.

### Capa 4 — apertura en frío offline

Evaluar una estrategia de shell offline compatible con Next.js que no reintroduzca bundles obsoletos. No se habilitará caché indiscriminada de RSC/`_next` ni respuestas autenticadas. Se implementará y validará en Preview antes de producción.

## Alcance futuro posible fuera del cuaderno

Una vez validado el patrón offline-first de Notas, el mismo enfoque puede extenderse —solo cuando la fase correspondiente lo autorice— a contenido seguro de solo lectura, por ejemplo capítulos bíblicos descargados explícitamente o la última información ya sincronizada. Funciones dependientes de servidor, IA, datos nuevos, pushes y acciones que requieren autorización online seguirán necesitando conexión.

## Regla de seguridad

No se deben guardar en caché respuestas autenticadas de forma indiscriminada ni permitir que una operación sensible se considere completada en servidor mientras siga pendiente localmente. La interfaz deberá diferenciar entre `guardado en este dispositivo` y `sincronizado` cuando la sincronización remota esté implementada.
