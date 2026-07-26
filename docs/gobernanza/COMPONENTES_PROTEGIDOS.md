# Componentes Protegidos

Estado: VIGENTE

## Biblia — PROTEGIDA

No modificar directamente:

- menú y botones circulares;
- selector de libro, capítulo y navegación;
- temas claro, sepia y oscuro;
- favoritos;
- notas;
- experiencia móvil;
- persistencia y sincronización asociadas.

Cualquier cambio debe pasar por laboratorio y pruebas de regresión.

## Autenticación — PROTEGIDA

No modificar sin pruebas explícitas de:

- inicio y cierre de sesión;
- recuperación de sesión;
- redirecciones;
- rutas protegidas;
- permisos por rol.

## Permisos y seguridad — PROTEGIDOS

No sustituir validaciones de servidor por verificaciones únicamente visuales o de cliente.

Toda modificación debe revisar políticas, acceso por rol y exposición de datos.

## Navegación inferior — ESTABLE/PROTEGIDA

No cambiar transversalmente sin validar rutas, estado activo, accesibilidad y comportamiento móvil.

## Panel Pastoral — ESTABLE, protección definitiva pendiente

Los módulos de permisos, versículos, bosquejos, biblioteca y materiales no deben recibir refactorizaciones generales mientras la Fase C continúe activa.

Al cerrarse la Fase C pasarán a estado PROTEGIDO.

## Formularios y tablas móviles — ESTABLES

Las capas de pulido móvil no deben eliminarse sin comparar el comportamiento real en pantallas pequeñas.

## Regla general

Una corrección local no puede alterar un componente protegido para ahorrar tiempo. Si el cambio lo requiere, debe documentarse el alcance, crear un punto de retorno y ejecutar el checklist completo.