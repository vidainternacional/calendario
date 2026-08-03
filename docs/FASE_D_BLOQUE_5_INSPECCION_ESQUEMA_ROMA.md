# FASE D · Bloque 5 — Inspección de esquema para el piloto de Roma

Fecha: 2026-08-03
Estado: inspección de solo lectura
Proyecto observado: `calendariovida`
PostgreSQL: 17.6

## Alcance

Se inspeccionaron únicamente catálogos de PostgreSQL e `information_schema` para confirmar los tipos, claves y mecanismos reutilizables requeridos por el diseño del piloto de Roma. No se ejecutó DDL, no se insertaron datos y no se modificó Supabase ni producción.

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

## Consecuencias para el DDL del piloto

1. Las referencias del diseño son compatibles:
   - `source_id uuid references public.biblical_sources(id)`;
   - `start_book_code text references public.biblical_books(code)`;
   - `end_book_code text references public.biblical_books(code)`.
2. PostgreSQL 17 admite `unique nulls not distinct`; la sintaxis propuesta para identidad externa es compatible con el motor observado.
3. Para mantener consistencia con las tablas bíblicas existentes, el valor inicial de `review_status` debe ser `pending`, no `draft`, salvo que se apruebe expresamente ampliar el vocabulario.
4. `provider_version` debería ser nullable en las nuevas tablas, porque la fuente canónica ya permite versiones no informadas.
5. La publicación debe validar simultáneamente:
   - fila aprobada;
   - fila habilitada;
   - fuente con `license_status` aprobado;
   - fuente con `review_status` aprobado;
   - fuente habilitada.
6. No debe asumirse que `content_hash` de la fuente esté siempre presente, aunque los registros de lugares, periodos, eventos y relaciones sí deben exigir su propio hash.
7. El diseño puede referenciar directamente códigos de libros, pero la validación del capítulo debe comparar también con `biblical_books.chapter_count` durante la importación, ya que una restricción `check` no puede consultar otra tabla.

## Funciones y triggers reutilizables

No se encontró en el esquema `public` una función cuyo nombre indique manejo uniforme de `updated_at`, fuentes o entidades bíblicas.

Existe al menos un trigger de otra tabla que usa la función de extensión:

```sql
moddatetime('updated_at')
```

Por tanto, una migración candidata debe confirmar primero que la extensión que aporta `moddatetime` está instalada en el entorno de validación. No se diseñará una función duplicada mientras ese mecanismo pueda reutilizarse.

## Ajustes obligatorios al diseño documental

Antes de convertir el DDL en migración candidata:

- sustituir el vocabulario de revisión por el ya existente en las tablas bíblicas;
- hacer `provider_version` nullable;
- conservar `content_hash` obligatorio para las nuevas entidades;
- validar capítulos contra `chapter_count` en el importador transaccional;
- usar `moddatetime('updated_at')` solo tras confirmar la extensión;
- definir políticas RLS según los patrones reales del corpus bíblico, sin copiar automáticamente `force row level security`;
- verificar políticas y privilegios actuales de tablas equivalentes antes de cerrar el contrato.

## Siguiente inspección segura

Leer en modo de solo lectura:

- las políticas RLS efectivas de `biblical_sources`, `biblical_books`, `biblical_context_units` y `biblical_context_fragments`;
- los privilegios concedidos a `anon`, `authenticated` y `service_role`;
- la extensión que proporciona `moddatetime`;
- los valores `check` exactos de `review_status` y `license_status`.

Con esos datos podrá generarse una migración candidata alineada con producción y probarse en PostgreSQL 17 fuera de producción, sin aplicarla todavía al proyecto activo.
