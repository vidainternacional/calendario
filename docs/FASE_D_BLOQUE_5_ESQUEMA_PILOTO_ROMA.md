# FASE D · Bloque 5 — Diseño del esquema piloto de Roma

Fecha: 2026-08-03
Estado: diseño fuera de producción

## Alcance

Este documento define el contrato técnico mínimo para el piloto geográfico y cronológico de Roma relacionado con Romanos y Hechos 28. No constituye una migración ejecutable, no aplica DDL, no importa datos y no modifica Supabase, RLS, interfaz o producción.

El objetivo es cerrar antes de cualquier escritura:

- identidad estable de lugares, periodos y eventos;
- representación explícita de precisión e incertidumbre;
- trazabilidad completa de fuente, versión, localizador y hash;
- recuperación exclusiva desde servidor;
- RLS restrictiva;
- validación transaccional e idempotente fuera de producción.

## Decisiones de diseño

### Identificadores

Todas las entidades usan UUID como clave primaria y `slug` único como identidad legible y estable. Los identificadores externos, como el ID de Pleiades, se conservan en columnas separadas y nunca sustituyen la clave interna.

### Fechas históricas

No se usa `date` para representar cronologías antiguas debatidas. Los límites se almacenan como años enteros astronómicos:

- años positivos: era común;
- año `0`: 1 a. C. en numeración astronómica;
- años negativos: años anteriores a 1 a. C.

La presentación para usuarios deberá convertir estos valores a etiquetas históricas comprensibles. Ninguna fecha aproximada puede mostrarse como exacta.

### Coordenadas

El piloto usa latitud y longitud numéricas, no PostGIS. Para un único punto no se justifica introducir todavía una extensión ni una dependencia cartográfica. Las coordenadas deben incluir precisión declarada y fuente.

### Hashes

`content_hash` usa SHA-256 hexadecimal en minúsculas y debe cubrir una serialización canónica del contenido sustantivo de cada fila. Metadatos operativos como `created_at` y `updated_at` quedan fuera del hash.

### Publicación

Solo se consideran publicables las filas con:

- `review_status = 'approved'`;
- `enabled = true`;
- fuente aprobada y habilitada;
- hash válido;
- relaciones referenciales completas.

## Enumeraciones propuestas

Para evitar tipos PostgreSQL globales difíciles de evolucionar, el primer piloto usa restricciones `check` sobre texto.

### Precisión de coordenadas

- `exact`;
- `approximate`;
- `regional`;
- `unknown`.

### Precisión temporal

- `exact`;
- `year`;
- `range`;
- `approximate`;
- `relative`;
- `unknown`.

### Certeza

- `high`;
- `medium`;
- `low`;
- `disputed`.

### Revisión

- `draft`;
- `review`;
- `approved`;
- `rejected`.

## DDL propuesto para auditoría

El siguiente SQL es deliberadamente documental. No debe copiarse a una migración productiva hasta aprobar las pruebas descritas más adelante.

```sql
create table public.biblical_places (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  canonical_name_es text not null,
  canonical_name_source text,
  alternate_names jsonb not null default '[]'::jsonb,
  place_kind text not null,
  external_provider text,
  external_id text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  coordinate_precision text not null default 'unknown',
  certainty_level text not null default 'medium',
  source_id uuid not null references public.biblical_sources(id) on delete restrict,
  source_locator text not null,
  provider_version text not null,
  content_hash text not null,
  review_status text not null default 'draft',
  enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint biblical_places_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint biblical_places_alternate_names_array
    check (jsonb_typeof(alternate_names) = 'array'),
  constraint biblical_places_metadata_object
    check (jsonb_typeof(metadata) = 'object'),
  constraint biblical_places_latitude_range
    check (latitude is null or latitude between -90 and 90),
  constraint biblical_places_longitude_range
    check (longitude is null or longitude between -180 and 180),
  constraint biblical_places_coordinate_pair
    check ((latitude is null) = (longitude is null)),
  constraint biblical_places_coordinate_precision
    check (coordinate_precision in ('exact','approximate','regional','unknown')),
  constraint biblical_places_certainty
    check (certainty_level in ('high','medium','low','disputed')),
  constraint biblical_places_review
    check (review_status in ('draft','review','approved','rejected')),
  constraint biblical_places_hash
    check (content_hash ~ '^[0-9a-f]{64}$'),
  constraint biblical_places_external_identity
    unique nulls not distinct (external_provider, external_id)
);

create table public.biblical_timeline_periods (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_es text not null,
  summary_es text,
  start_year integer,
  end_year integer,
  chronology_system text not null,
  date_precision text not null default 'unknown',
  certainty_level text not null default 'medium',
  controversy_note_es text,
  source_id uuid not null references public.biblical_sources(id) on delete restrict,
  source_locator text not null,
  provider_version text not null,
  content_hash text not null,
  review_status text not null default 'draft',
  enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint biblical_timeline_periods_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint biblical_timeline_periods_year_order
    check (start_year is null or end_year is null or start_year <= end_year),
  constraint biblical_timeline_periods_precision
    check (date_precision in ('exact','year','range','approximate','relative','unknown')),
  constraint biblical_timeline_periods_certainty
    check (certainty_level in ('high','medium','low','disputed')),
  constraint biblical_timeline_periods_review
    check (review_status in ('draft','review','approved','rejected')),
  constraint biblical_timeline_periods_hash
    check (content_hash ~ '^[0-9a-f]{64}$'),
  constraint biblical_timeline_periods_metadata_object
    check (jsonb_typeof(metadata) = 'object')
);

create table public.biblical_timeline_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_es text not null,
  summary_es text not null,
  period_id uuid references public.biblical_timeline_periods(id) on delete restrict,
  start_year integer,
  end_year integer,
  relative_order integer not null,
  date_precision text not null default 'unknown',
  certainty_level text not null default 'medium',
  controversy_note_es text,
  start_book_code text not null references public.biblical_books(code) on delete restrict,
  start_chapter integer not null,
  start_verse integer,
  end_book_code text references public.biblical_books(code) on delete restrict,
  end_chapter integer,
  end_verse integer,
  source_id uuid not null references public.biblical_sources(id) on delete restrict,
  source_locator text not null,
  provider_version text not null,
  content_hash text not null,
  review_status text not null default 'draft',
  enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint biblical_timeline_events_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint biblical_timeline_events_year_order
    check (start_year is null or end_year is null or start_year <= end_year),
  constraint biblical_timeline_events_precision
    check (date_precision in ('exact','year','range','approximate','relative','unknown')),
  constraint biblical_timeline_events_certainty
    check (certainty_level in ('high','medium','low','disputed')),
  constraint biblical_timeline_events_review
    check (review_status in ('draft','review','approved','rejected')),
  constraint biblical_timeline_events_hash
    check (content_hash ~ '^[0-9a-f]{64}$'),
  constraint biblical_timeline_events_metadata_object
    check (jsonb_typeof(metadata) = 'object'),
  constraint biblical_timeline_events_start_chapter_positive
    check (start_chapter > 0),
  constraint biblical_timeline_events_start_verse_positive
    check (start_verse is null or start_verse > 0),
  constraint biblical_timeline_events_end_reference_complete
    check (
      (end_book_code is null and end_chapter is null and end_verse is null)
      or
      (end_book_code is not null and end_chapter is not null and end_chapter > 0 and (end_verse is null or end_verse > 0))
    )
);

create table public.biblical_timeline_event_places (
  event_id uuid not null references public.biblical_timeline_events(id) on delete cascade,
  place_id uuid not null references public.biblical_places(id) on delete restrict,
  relationship_kind text not null,
  sequence_order integer,
  certainty_level text not null default 'medium',
  source_id uuid not null references public.biblical_sources(id) on delete restrict,
  source_locator text not null,
  provider_version text not null,
  content_hash text not null,
  review_status text not null default 'draft',
  enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (event_id, place_id, relationship_kind),
  constraint biblical_timeline_event_places_relationship
    check (relationship_kind in ('location','origin','destination','route','associated')),
  constraint biblical_timeline_event_places_sequence
    check (sequence_order is null or sequence_order >= 0),
  constraint biblical_timeline_event_places_certainty
    check (certainty_level in ('high','medium','low','disputed')),
  constraint biblical_timeline_event_places_review
    check (review_status in ('draft','review','approved','rejected')),
  constraint biblical_timeline_event_places_hash
    check (content_hash ~ '^[0-9a-f]{64}$'),
  constraint biblical_timeline_event_places_metadata_object
    check (jsonb_typeof(metadata) = 'object')
);
```

## Índices propuestos

```sql
create index biblical_places_publication_idx
  on public.biblical_places (review_status, enabled, slug);

create index biblical_places_external_idx
  on public.biblical_places (external_provider, external_id);

create index biblical_timeline_periods_order_idx
  on public.biblical_timeline_periods (start_year, end_year, slug);

create index biblical_timeline_events_order_idx
  on public.biblical_timeline_events (relative_order, start_year, slug);

create index biblical_timeline_events_reference_idx
  on public.biblical_timeline_events (start_book_code, start_chapter, start_verse);

create index biblical_timeline_event_places_place_idx
  on public.biblical_timeline_event_places (place_id, event_id);
```

## RLS propuesta

El cliente no debe consultar directamente estas tablas durante el piloto. La interfaz consumirá una función `server-only` que use el cliente de servidor autorizado.

Principios:

1. RLS habilitada y forzada en las cuatro tablas.
2. `anon` sin privilegios directos.
3. `authenticated` sin `insert`, `update` o `delete`.
4. Lectura directa opcional para `authenticated` solo después de una auditoría adicional; no se concede en el piloto inicial.
5. `service_role` conserva acceso administrativo por su comportamiento privilegiado en Supabase.
6. No se crean políticas permisivas genéricas ni basadas únicamente en `enabled`.

Contrato propuesto:

```sql
alter table public.biblical_places enable row level security;
alter table public.biblical_places force row level security;
alter table public.biblical_timeline_periods enable row level security;
alter table public.biblical_timeline_periods force row level security;
alter table public.biblical_timeline_events enable row level security;
alter table public.biblical_timeline_events force row level security;
alter table public.biblical_timeline_event_places enable row level security;
alter table public.biblical_timeline_event_places force row level security;

revoke all on public.biblical_places from anon, authenticated;
revoke all on public.biblical_timeline_periods from anon, authenticated;
revoke all on public.biblical_timeline_events from anon, authenticated;
revoke all on public.biblical_timeline_event_places from anon, authenticated;
```

No se propone una política de lectura pública en este punto. La recuperación desde servidor debe filtrar además por aprobación, habilitación y estado de la fuente.

## Contrato de recuperación desde servidor

Servicio propuesto:

```ts
obtenerPilotoCronologiaMapaRoma(): Promise<PilotoCronologiaMapaRoma | null>
```

Requisitos:

- archivo con `import 'server-only'`;
- consulta por `slug = 'roma'`, nunca por nombre libre;
- selección explícita de columnas;
- unión únicamente con periodos, eventos y relaciones aprobadas/habilitadas;
- verificación de que la fuente también esté aprobada y habilitada;
- orden determinista por `relative_order`, luego `slug`;
- no exponer campos internos innecesarios;
- no conectar la respuesta a prompts de IA;
- devolver `null` si el conjunto no cumple integridad completa;
- registrar errores sin incluir secretos ni payloads completos.

Tipo de salida mínimo:

```ts
type PilotoCronologiaMapaRoma = {
  lugar: {
    slug: 'roma'
    nombre: string
    nombresAlternativos: string[]
    tipo: string
    coordenadas: { latitud: number; longitud: number } | null
    precisionCoordenadas: 'exact' | 'approximate' | 'regional' | 'unknown'
    certeza: 'high' | 'medium' | 'low' | 'disputed'
    fuente: { proveedor: string; version: string; atribucion: string; localizador: string }
  }
  periodos: Array<{
    slug: string
    titulo: string
    inicio: number | null
    fin: number | null
    precision: string
    certeza: string
  }>
  eventos: Array<{
    slug: string
    titulo: string
    resumen: string
    referenciaInicio: string
    referenciaFin: string | null
    inicio: number | null
    fin: number | null
    ordenRelativo: number
    precision: string
    certeza: string
    notaControversia: string | null
    relacionLugar: string
  }>
}
```

## Payload piloto autorizado para validación futura

El diseño permite como máximo:

- un lugar: Roma;
- un identificador externo de Pleiades;
- una coordenada o par de coordenadas con precisión declarada;
- un periodo contextual opcional;
- uno o dos eventos;
- referencias relacionadas con Romanos y Hechos 28;
- una relación por evento con Roma.

No se fijan todavía fechas absolutas, coordenadas, IDs externos ni textos editoriales. Esos valores deben provenir de fuentes verificadas, con licencia y hash aprobados en un incremento separado.

## Matriz de validación fuera de producción

Antes de crear una migración productiva debe existir una prueba automatizada en PostgreSQL 16 que confirme:

1. creación limpia dentro de una transacción;
2. rollback completo sin objetos residuales;
3. rechazo de slug inválido;
4. rechazo de hash no SHA-256;
5. rechazo de coordenadas fuera de rango;
6. rechazo de latitud sin longitud y viceversa;
7. rechazo de rango temporal invertido;
8. rechazo de referencias bíblicas incompletas;
9. rechazo de fuente inexistente;
10. rechazo de duplicado de identidad externa;
11. rechazo de relación duplicada;
12. `anon` sin lectura ni escritura;
13. `authenticated` sin lectura ni escritura directa;
14. importador restringido a `service_role`;
15. inserción exacta del payload piloto;
16. segunda ejecución idempotente;
17. ninguna fila parcial tras un error;
18. recuperación de servidor ordenada y determinista;
19. exclusión de filas no aprobadas o deshabilitadas;
20. exclusión de filas cuya fuente esté deshabilitada;
21. hashes canónicos estables en dos ejecuciones independientes;
22. ausencia de campos conectados a IA.

## Riesgos abiertos

- PostgreSQL 15 no admite `unique nulls not distinct` en versiones anteriores; Supabase debe confirmarse sobre PostgreSQL compatible antes de conservar esa sintaxis.
- Debe verificarse el nombre y tipo exactos de `biblical_books.code` y `biblical_sources.id` contra el esquema productivo antes de materializar el DDL.
- Debe definirse un mecanismo uniforme para `updated_at`; no se añade todavía un trigger porque primero debe reutilizarse, si existe, la función estándar del proyecto.
- La licencia y atribución exactas del registro de Pleiades deben leerse desde `biblical_sources`; no se duplicarán manualmente.
- Una cronología absoluta para los eventos de Roma requiere revisión de fuente separada.

## Criterio de aprobación

Este diseño puede avanzar a una migración candidata fuera de producción únicamente cuando:

- los nombres y tipos reales de las claves foráneas estén confirmados;
- la compatibilidad SQL esté verificada;
- el contrato de hashes esté definido con serialización canónica;
- la fuente cronológica esté aprobada;
- el payload mínimo de Roma tenga valores verificables;
- la matriz de pruebas pueda ejecutarse sin acceso a producción.

## Siguiente incremento seguro

Inspeccionar en modo de solo lectura el esquema exacto de `biblical_sources`, `biblical_books` y las funciones/triggers reutilizables; después adaptar este DDL documental y construir una migración candidata validable en PostgreSQL 16, todavía sin aplicarla a Supabase productivo.
