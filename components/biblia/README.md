# Arquitectura activa de la Biblia

## Fuente única de Notas

La interfaz vigente de Notas está implementada exclusivamente en:

`components/biblia/BibleNotesWorkspace.tsx`

Reglas:

- La pestaña `Notas` dentro de `BibliaClient.tsx` debe renderizar ese componente.
- La ruta `/biblia/notas` es solamente un envoltorio de compatibilidad del mismo componente.
- No se debe crear otra interfaz de Notas dentro de `BibliaClient.tsx`, en la ruta o mediante manipulación del DOM.
- No se debe recuperar la versión antigua basada en un único `textarea` por capítulo.
- Las mejoras futuras deben aplicarse primero a `BibleNotesWorkspace.tsx` para que pestaña y ruta permanezcan sincronizadas.

## Tema y primer pintado

- `BibleThemeRouteSync.tsx` sincroniza el tema durante la navegación cliente.
- El script mínimo de `app/layout.tsx` prepara el tema en cargas directas de `/biblia`.
- `app/(app)/biblia/loading.tsx` es el único skeleton específico de Biblia.
- `biblia-first-paint.css` evita que el HTML inicial claro aparezca antes de la hidratación.

No agregar loaders, overlays, recargas completas ni rutas paralelas para ocultar transiciones de tema.
