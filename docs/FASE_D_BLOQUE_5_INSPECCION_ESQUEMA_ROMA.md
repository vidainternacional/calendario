# FASE D · Bloque 5 — Inspección de esquema para el piloto de Roma

Fecha: 2026-08-03
Estado: inspección de solo lectura completada
Proyecto observado: `calendariovida`
PostgreSQL: 17.6

## Alcance

Se inspeccionaron únicamente catálogos de PostgreSQL e `information_schema` para confirmar los tipos, claves, políticas, privilegios, restricciones y mecanismos reutilizables requeridos por el diseño del piloto de Roma. No se ejecutó DDL, no se insertaron datos y no se modificó Supabase ni producción.

## Claves confirmadas

### `public.biblical_sources`

- clave primaria: `id uuid`;
- `id` usa `gen_random_uuid()`;
- `slug text` es único;
- identidad del proveedor: combinación única de `provider` y `provider_ref`;
- `provider_version text` es nullable;
- `content_hash text` es nullable en la fuente;
- `attribution text` es obligatoria;
- `license_status text`, `review_status text` y `enabled boolean` controlan aprobación y publicación;
- `approved_by uuid` referencia `public.profiles(id)`;
- RLS está habilitada, pero no forzada.

### `public.biblical_books`

- clave primaria: `code text`;
- `canonical_order smallint` es único;
- `chapter_count smallint`;
- `source_id uuid` referencia `public.biblical_sources(id)`;
- `provider_version text` es nullable;
- `content_hash text` es obligatorio;
- `review_status text` usa por defecto `pending`;
- `enabled boolean` usa por defecto `false`;
- RLS está habilitada, pero no forzada.

## Políticas RLS efectivas

### `biblical_sources`

La política `Usuarios activos leen fuentes bíblicas aprobadas` concede únicamente `SELECT` a `authenticated` cuando se cumplen simultáneamente:

- `enabled = true`;
- `review_status = 'approved'`;
- `cuenta_activa()` devuelve verdadero.

### `biblical_books`

La política `Usuarios activos leen libros bíblicos aprobados` concede únicamente `SELECT` a `authenticated` cuando se cumplen simultáneamente:

- el libro está habilitado;
- el libro está aprobado;
- `cuenta_activa()` devuelve verdadero;
- la fuente relacionada está habilitada;
- la fuente relacionada está aprobada.

El patrón del piloto debe mantener esta doble validación de la entidad y de su fuente.

## Privilegios efectivos

- `anon`: sin privilegios de tabla observados sobre `biblical_sources` y `biblical_books`;
- `authenticated`: únicamente `SELECT`;
- `service_role`: privilegios completos de administración de tabla.

Las nuevas tablas no deben conceder escritura a `anon` ni a `authenticated`. La recuperación para usuarios activos debe limitarse a `SELECT` y permanecer protegida por RLS.

## Vocabularios exactos

### `review_status`

Valores permitidos:

- `pending`;
- `approved`;
- `rejected`.

### `license_status`

Valores permitidos en `biblical_sources`:

- `verified`;
- `varies_by_item`;
- `pending`;
- `restricted`.

### `source_type`

Valores permitidos:

- `provider_catalog`;
- `translation`;
- `commentary`;
- `cross_reference`;
- `profile`;
- `historical`.

Pleiades y cualquier fuente cronológica del piloto deben reutilizar `historical` mientras no se apruebe una ampliación explícita.

## Funciones y extensiones reutilizables

- `public.cuenta_activa()` existe y es el control usado por las políticas bíblicas actuales;
- `extensions.moddatetime()` existe y es el mecanismo reutilizable para mantener `updated_at`;
- `gen_random_uuid()` ya se usa en el esquema bíblico.

La migración candidata debe referenciar `extensions.moddatetime()` de forma explícita o garantizar un `search_path` seguro. No debe crear una función duplicada para `updated_at`.

## Consecuencias para el DDL del piloto

1. Las referencias del diseño son compatibles:
   - `source_id uuid references public.biblical_sources(id)`;
   - códigos de libros como `text references public.biblical_books(code)`.
2. PostgreSQL 17 admite `unique nulls not distinct`.
3. El valor inicial de `review_status` debe ser `pending`.
4. `provider_version` debe ser nullable.
5. Cada política de lectura debe exigir entidad aprobada y habilitada, fuente aprobada y habilitada, y cuenta activa.
6. Para fuentes geográficas o cronológicas, la publicación debe exigir además `license_status in ('verified', 'varies_by_item')`; una fuente `pending` o `restricted` no debe alimentar resultados visibles.
7. `content_hash` propio debe ser obligatorio para lugares, periodos, eventos y relaciones.
8. La validación de capítulos debe comparar con `biblical_books.chapter_count` en el importador transaccional.
9. `anon` no debe recibir privilegios.
10. `authenticated` debe recibir únicamente `SELECT`.
11. `service_role` conservará la capacidad de importación y administración.
12. Los triggers `updated_at` deben usar `extensions.moddatetime('updated_at')`.

## Contrato RLS propuesto

Para cada tabla principal del piloto, la política de lectura autenticada debe exigir:

```sql
enabled
and review_status = 'approved'
and (select public.cuenta_activa())
and exists (
  select 1
  from public.biblical_sources source
  where source.id = source_id
    and source.enabled
    and source.review_status = 'approved'
    and source.license_status in ('verified', 'varies_by_item')
)
```

Las tablas de relación deben comprobar también que sus entidades padre sean visibles. No se crearán políticas de inserción, actualización o eliminación para clientes.

## Resultado

La inspección requerida quedó cerrada. El diseño puede avanzar a una migración candidata fuera de producción, siempre que:

- no se aplique al proyecto activo;
- se valide en PostgreSQL 17;
- incluya pruebas de rollback, RLS, privilegios, restricciones, hashes e idempotencia;
- no importe datos de Roma todavía;
- no conecte cronologías o mapas a IA.

## Siguiente incremento seguro

Construir una migración candidata versionada y una matriz automatizada de pruebas para PostgreSQL 17 fuera de producción. La migración debe crear únicamente la estructura vacía del piloto y permanecer sin aplicar a Supabase productivo hasta superar la auditoría técnica y quedar registrada en `__VIDA_INTERNACIONAL.md`.
