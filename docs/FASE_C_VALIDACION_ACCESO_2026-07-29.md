# FASE C — Validación final de acceso pastoral

Fecha: 2026-07-29

Estado: COMPLETADA

## Objetivo

Comprobar en la base de datos de producción que una cuenta activa con rol no pastoral puede recibir acceso al Centro Pastoral sin cambiar su rol, trabajar bajo las políticas RLS y perder nuevamente ese acceso al ser revocada.

## Condiciones de la prueba

- Proyecto Supabase: `calendariovida`.
- Se utilizó una cuenta administradora activa y una cuenta servidora activa existentes.
- No se registraron nombres, correos ni identificadores personales en este documento.
- La colección creada durante la prueba utilizó un nombre técnico temporal.
- Al terminar se eliminó el contenido temporal y se restauró el valor original del permiso.

## Resultados

1. La cuenta servidora no pudo concederse acceso a sí misma.
2. La cuenta administradora pudo conceder acceso temporalmente.
3. `tiene_acceso_pastoral()` devolvió verdadero para la cuenta autorizada.
4. La cuenta conservó el rol `servidor`.
5. La cuenta autorizada pudo crear una colección propia bajo RLS.
6. La colección temporal fue eliminada correctamente.
7. La cuenta administradora pudo revocar el permiso.
8. `tiene_acceso_pastoral()` devolvió falso después de la revocación.
9. La cuenta revocada no pudo crear contenido pastoral; PostgreSQL bloqueó la inserción mediante RLS.
10. El valor original de `acceso_centro_pastoral` quedó restaurado.

## Resultado consolidado

- Comprobaciones ejecutadas: 9.
- Comprobaciones correctas: 9.
- Cambios permanentes en permisos: ninguno.
- Registros pastorales temporales restantes: ninguno.

## Conclusión

El modelo de concesión y revocación funciona conforme al alcance de la FASE C:

- solo una cuenta administradora activa puede modificar el permiso especial;
- el permiso no cambia el rol general ni concede funciones administrativas;
- las políticas RLS habilitan el contenido propio únicamente mientras existe acceso pastoral;
- la revocación surte efecto inmediatamente en la función de autorización y en las operaciones de base de datos.