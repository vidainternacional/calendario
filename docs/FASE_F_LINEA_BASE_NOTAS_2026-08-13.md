# FASE F — Línea base de Biblia → Notas

Fecha: 2026-08-13

Fase activa: **FASE F — EVOLUCIÓN CORRELATIVA DE BIBLIA → NOTAS**.

Este documento registra el estado real previo a cualquier cambio de modelo, RLS, datos o diseño.

## 1. Superficies actuales

### Biblia → Notas

Rutas y componentes:

- `app/(app)/biblia/page.tsx` → `BibliaClient`.
- `BibliaClient` incluye la vista `notas` y embebe `BibleNotesWorkspace`.
- `app/(app)/biblia/notas/page.tsx` presenta el mismo `BibleNotesWorkspace` como ruta independiente.
- `BibleExperienceFixes` añade la acción “Crear nota de este versículo”; crea la nota y navega a `/biblia/notas?nota=<id>`.

Modelo visible actual de `BibleNotesWorkspace`:

- `id`;
- `titulo`;
- `contenido`;
- `tipo`: `versiculo | estudio | predicacion | personal`;
- `referencia` libre;
- `paqueteId` y nombre `paquete`;
- `creadaEn`;
- `actualizadaEn`.

La UI ya permite:

- crear, editar y eliminar notas;
- búsqueda por título, contenido, referencia y paquete;
- filtros por tipo;
- asociación visual opcional con un paquete pastoral propio;
- inserción de listas, tareas y fecha/hora;
- guardado automático local.

### Persistencia real de Biblia → Notas

Toda la colección se guarda en `localStorage` bajo una única clave:

- `vida-biblia-notas-v2`.

No existe `userId` dentro del modelo local ni namespace por usuario en la clave. La persistencia depende del navegador/dispositivo y no ofrece por sí misma sincronización entre dispositivos ni respaldo servidor.

La selección de paquete pastoral se obtiene desde Supabase mediante `listarPaquetesPastoralesParaNotas()`, pero `paqueteId`/`paquete` se almacenan únicamente dentro de la nota local; no existe FK servidor desde el cuaderno local.

### Crear nota desde un versículo

`BibleExperienceFixes.guardarNotaDeVersiculo()`:

1. genera un UUID en cliente;
2. construye una nota tipo `versiculo`;
3. guarda directamente en `localStorage`;
4. abre la ruta del cuaderno con el ID recién creado.

Por lo tanto, esta acción tampoco sincroniza con Supabase.

## 2. Estudio Profundo → Mis notas personales

Existe un segundo sistema de notas independiente dentro de `EstudioProfundoClient`.

Flujo:

- `EstudioProfundoClient` importa `obtenerNota()` y `guardarNota()` desde `app/actions/estudio-interno.ts`;
- esas acciones delegan en `app/actions/estudio.ts`;
- `obtenerNota(pasaje)` consulta `public.notas_estudio` por usuario autenticado + `pasaje_normalizado`;
- `guardarNota(pasaje, nota)` hace `upsert` en `public.notas_estudio` con conflicto en `(profile_id, pasaje_normalizado)`;
- la UI muestra una única caja “Mis notas personales” por pasaje de estudio.

Este sistema sí usa Supabase y la sesión del usuario, pero no comparte registros con `BibleNotesWorkspace`.

## 3. Tabla `public.notas_estudio`

Estado real en Supabase al 2026-08-13:

### Columnas

- `id uuid` PK, default `gen_random_uuid()`;
- `profile_id uuid`, nullable;
- `pasaje_normalizado text`, NOT NULL;
- `nota text`, NOT NULL;
- `created_at timestamptz`, default `now()`;
- `updated_at timestamptz`, default `now()`.

### Restricciones e índices

- PK: `notas_estudio_pkey`;
- FK: `profile_id → auth.users(id) ON DELETE CASCADE`;
- UNIQUE: `(profile_id, pasaje_normalizado)`;
- índice de PK y único compuesto correspondientes.

No existen triggers propios sobre `notas_estudio`; `updated_at` se actualiza explícitamente desde la acción servidor actual.

### Datos

- filas servidor: **0**;
- usuarios con notas servidor: **0**;
- filas sin `profile_id`: **0**.

Esto no permite concluir que no existan notas reales en dispositivos: las notas de `BibleNotesWorkspace` viven únicamente en `localStorage` y no son visibles desde Supabase.

### Historial de migraciones

No se encontró ninguna entrada en `supabase_migrations.schema_migrations` cuyo contenido registre la creación/evolución de `notas_estudio`. La tabla existe en producción, pero su origen no está actualmente trazado por una migración versionada del flujo auditado.

## 4. RLS y permisos actuales

- RLS: **habilitada**.
- FORCE RLS: no.

Políticas existentes:

- SELECT: `profile_id = auth.uid()`;
- INSERT: `profile_id = auth.uid()`;
- UPDATE: `profile_id = auth.uid()`;
- DELETE: `profile_id = auth.uid()`.

Las cuatro políticas están declaradas para rol `public`, pero la condición de propietario usa `auth.uid()`.

Grants de tabla actualmente incluyen privilegios amplios para `anon`, `authenticated`, `service_role` y `postgres`; RLS es la barrera efectiva para acceso de usuario. **No se modifica este estado durante la línea base.** Cualquier endurecimiento posterior de grants/RLS se tratará como cambio sensible y requerirá alcance y reversión antes de aplicarse.

## 5. RPC y acciones

No se encontraron routines/RPC con nombre relacionado a `nota`/`note` en los esquemas auditados. El acceso servidor actual se hace directamente a la tabla mediante el cliente Supabase autenticado en `app/actions/estudio.ts`.

Acciones relevantes:

- `obtenerNota(pasaje)`;
- `guardarNota(pasaje, nota)`;
- wrappers equivalentes en `app/actions/estudio-interno.ts`.

## 6. Relaciones actuales

### Referencia bíblica

- Cuaderno local: `referencia` es texto libre.
- Estudio Profundo: relación por `pasaje_normalizado` textual.
- No existe una FK/capa estructurada común de libro-capítulo-versículo entre ambos sistemas de notas.

### Paquete pastoral

- Cuaderno local puede seleccionar un paquete pastoral propio.
- Guarda `paqueteId` y título solo en el JSON local.
- `notas_estudio` no tiene `paquete_id` ni otra relación pastoral.

### Usuario

- Cuaderno local: no tiene campo usuario y su clave local no está namespaced por cuenta.
- `notas_estudio`: usa `profile_id` ligado a `auth.users(id)` y políticas por `auth.uid()`.

## 7. Hallazgo principal de FASE F

Hoy existen **dos sistemas paralelos**, justo lo que el documento maestro ordena consolidar:

1. `BibleNotesWorkspace`: cuaderno completo y mejor UX, pero solo local/dispositivo.
2. `notas_estudio`: persistencia privada en Supabase por usuario/pasaje, pero con modelo mínimo y una sola nota por referencia.

No debe crearse una tercera tabla/superficie sin antes decidir cuál será el modelo canónico.

## 8. Riesgos que debe resolver la fase

1. Pérdida de notas locales si el dispositivo/navegador se borra o cambia.
2. Sincronización entre dispositivos inexistente en el cuaderno principal.
3. Modelo local no asociado estructuralmente a la cuenta autenticada.
4. Duplicación: una nota de Estudio Profundo y una nota de Biblia pueden referirse al mismo pasaje sin conocerse entre sí.
5. `notas_estudio` solo permite un registro por usuario/pasaje y no soporta el cuaderno múltiple requerido para prédicas, notas personales y estudios.
6. Campos requeridos por FASE F aún inexistentes en servidor: número correlativo de prédica, fecha, serie, lugar, predicador, estado y metadatos de origen/contexto.
7. Asociación pastoral del cuaderno es local y no tiene integridad referencial servidor.
8. La tabla servidor existente no tiene migración de origen trazable en el historial auditado.

## 9. Condiciones de preservación

La evolución debe:

- conservar la UI aprobada de `Biblia → Notas` salvo cambios explícitamente validados en Preview;
- preservar cualquier nota que ya exista en `localStorage` mediante una estrategia de importación/sincronización, no borrarla;
- mantener privacidad por defecto y propiedad estricta por usuario;
- reutilizar un único modelo canónico para Biblia, Estudio Profundo y superficies pastorales autorizadas;
- conservar referencia/origen/contexto sin duplicar la misma nota;
- no depender de telemetría de notas personales.

## 10. Primer bloque seguro propuesto

Antes de tocar producción, el primer bloque debe definir **el contrato canónico del cuaderno** y la migración/reversión necesaria.

Propuesta de dirección técnica:

- evolucionar una única tabla servidor de notas personales para admitir múltiples notas por usuario;
- conservar IDs estables generados por cliente para importar notas locales sin duplicarlas;
- incorporar campos de cuaderno y origen/contexto requeridos por FASE F;
- conectar Estudio Profundo al mismo modelo en vez de mantener `notas_estudio` como silo por pasaje;
- implementar una migración de cliente idempotente desde `vida-biblia-notas-v2` hacia Supabase y conservar la copia local durante una etapa de transición;
- no eliminar `notas_estudio` ni datos existentes en el primer paso; cualquier consolidación destructiva deberá ocurrir solo después de validar migración y reversión.

El siguiente paso requiere presentar el esquema exacto, políticas RLS/grants, estrategia de compatibilidad y plan de reversión **antes de aplicar cambios sensibles en Supabase**.
