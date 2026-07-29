# FASE C — Acceso pastoral asignable

Fecha de implementación: 2026-07-29

Estado: IMPLEMENTADO EN PRODUCCIÓN — PENDIENTE VALIDACIÓN FUNCIONAL CON DOS CUENTAS REALES.

## Necesidad pastoral

En Vida Internacional la preparación y enseñanza bíblica no corresponde únicamente a quienes tienen el rol global de pastor. Líderes y otras personas autorizadas también pueden predicar o impartir estudios.

El Centro Pastoral debe poder habilitarse desde Administración sin cambiar el rol real de la persona dentro de la aplicación.

## Decisión de arquitectura

Se separó el rol global del permiso funcional mediante el campo:

- `profiles.acceso_centro_pastoral`.

La regla efectiva es:

- `pastor` y `administrador` activos conservan acceso automático por su rol;
- cualquier otra cuenta activa puede recibir acceso explícito desde Administración;
- conceder el permiso no transforma a la persona en pastor ni administrador;
- una cuenta inactiva no puede usar el Centro Pastoral aunque el permiso permanezca guardado;
- retirar el permiso corta el acceso a rutas, acciones, datos y archivos pastorales privados.

## Administración

Ruta incorporada:

- `/admin/accesos-pastorales`.

Funciones disponibles:

- buscar personas por nombre o correo;
- filtrar cuentas con acceso o sin acceso;
- conceder o retirar el acceso mediante un control individual;
- distinguir acceso automático por rol de acceso asignado;
- mostrar cuándo el permiso está guardado pero la cuenta no está activa.

Solo un `administrador` activo puede modificar este permiso.

## Experiencia de la persona autorizada

La persona mantiene su rol global y recibe en su Perfil el acceso al Centro Pastoral.

Puede utilizar con contenido propio:

- bosquejos;
- colecciones y versículos;
- Biblioteca Pastoral;
- paquetes pastorales;
- materiales de estudio y distribución.

Cada cuenta ve únicamente los recursos cuyo `profile_id` coincide con su identidad.

## Seguridad

La misma autorización se aplica en cuatro capas:

1. páginas y navegación en servidor;
2. acciones de creación, edición, eliminación y publicación;
3. políticas RLS de las tablas pastorales;
4. políticas de Storage del bucket privado `pastoral-library`.

Protecciones añadidas:

- disparador en `profiles` que impide cambiar el permiso sin ser administrador activo;
- función central `tiene_acceso_pastoral()`;
- propiedad obligatoria por `profile_id`;
- archivos privados dentro de la carpeta del usuario;
- funciones internas sin exposición anónima;
- evaluación optimizada de identidad y autorización una vez por consulta.

## Migraciones

- `20260729162000_acceso_centro_pastoral_asignable.sql`.
- `20260729164500_endurecer_funciones_acceso_pastoral.sql`.
- `20260729165500_optimizar_politicas_acceso_pastoral.sql`.

Las migraciones fueron aplicadas y verificadas en el proyecto Supabase de producción.

## Evidencia técnica

- Integración consolidada en `main`: `9f3918d5673926f4f45f6df6323c37367922c169`.
- Preview de la implementación: `dpl_F1zK7cj8qsjYENWNwEnppMyawnUT` — `READY`.
- Despliegue de producción: `dpl_28siKGg7ic5a327nVHBhQNGNfouK` — `READY`.
- Build de Next.js: correcto.
- TypeScript: correcto.
- Ruta `/admin/accesos-pastorales`: incluida en el build de producción.
- Asesores de seguridad: sin advertencias nuevas para las funciones incorporadas.
- Asesores de rendimiento: eliminadas las advertencias nuevas de evaluación por fila en las políticas pastorales.

## Validación pendiente

Antes de cerrar oficialmente la FASE C, confirmar en producción:

1. Un administrador concede acceso a una cuenta activa con rol `lider` o `servidor`.
2. Esa persona entra a Perfil y abre el Centro Pastoral.
3. Puede crear y guardar un bosquejo o una colección propia.
4. No obtiene acceso al Panel de Administración.
5. El administrador retira el permiso.
6. La persona deja de poder entrar al Centro Pastoral y de operar sobre sus datos pastorales.

La FASE C permanece activa hasta completar esta validación y reflejar su cierre en `__VIDA_INTERNACIONAL.md`.
