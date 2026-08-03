# FASE D · Bloque 4 — Diseño del importador transaccional de Rut

Fecha: 2026-08-02

## Objetivo

Generalizar el importador TAHOT ya validado con Abdías para aceptar el payload reproducible de Rut, sin ejecutar todavía ninguna escritura en Supabase.

## Estado de partida

La función `internal.import_stepbible_tahot_payload(jsonb, jsonb)` ya implementa:

- ejecución `security definer` con `search_path` fijado;
- validación de fuente aprobada y libro aprobado;
- validación de formato de hashes e identidad del paquete;
- inserciones idempotentes de entradas léxicas, ocurrencias, textos y variantes;
- registro de lote interno;
- rechazo de acceso desde clientes;
- capa editorial española incompleta y sin contenido inventado.

El bloqueo actual es deliberado: la función exige los conteos exactos del piloto de Abdías.

## Contrato exacto de Rut

El importador debe aceptar Rut únicamente cuando el payload declare y contenga:

- código interno: `RUT`;
- código STEPBible: `Rut`;
- dataset: `TAHOT Jos-Est`;
- fuente SHA-256: `195fee1dc3653bab33701f170734eb894ed647c10cd08cc61749375fe8b73775`;
- paquete SHA-256: `80a79abd038de9159a90e7aa572f1d4ff6a0c7f1ca8bfb4195875ffd5a7ca20c`;
- payload interno: `d88763cef355dc05d3251438f3adce08a99feed389b82502e8c8f1263d7b79ee`;
- referencias: 85;
- palabras visibles: 1,293;
- ocurrencias: 2,026;
- identificadores léxicos: 373;
- filas fuente con variantes: 19;
- variantes estructuradas: 29;
- omisiones Qere: 1.

## Generalización requerida

La validación de conteos no debe eliminarse ni hacerse permisiva. Debe reemplazarse por una tabla interna de contratos por libro, inicialmente con dos entradas:

- `OBA`: 21 / 291 / 434 / 184 / 2 / 3;
- `RUT`: 85 / 1,293 / 2,026 / 373 / 19 / 29.

Cualquier libro no registrado debe ser rechazado.

## Tratamiento de Rut 3:12

La omisión Qere debe importarse exclusivamente como variante textual:

- `reading_type = 'addition'`;
- `base_reading IS NULL`;
- `variant_reading = 'אִם'`;
- `anchor_word_index IS NULL`;
- `witnesses = ['K']`;
- ninguna ocurrencia con el hash de línea de la omisión.

La restricción de `anchor_word_index` ya admite valores nulos. La función debe conservar ese valor sin convertirlo en cero.

## Idempotencia

Dos ejecuciones consecutivas del mismo payload deben producir:

- 85 textos, no 170;
- 2,026 ocurrencias, no 4,052;
- 29 variantes, no 58;
- un solo lote de importación para la misma fuente, libro, commit y artefacto;
- ninguna modificación destructiva de entradas léxicas compartidas con Abdías.

## Rollback y atomicidad

La validación fuera de producción debe demostrar:

1. un payload correcto completa toda la transacción;
2. un conteo alterado cancela toda la operación;
3. un hash alterado cancela toda la operación;
4. una variante Qere inválida cancela toda la operación;
5. un fallo después de insertar entradas léxicas no deja filas parciales;
6. una segunda ejecución correcta no modifica conteos.

## Compatibilidad con datos compartidos

Rut reutiliza identificadores léxicos que ya pueden existir por Abdías. El importador debe:

- reutilizar la fila existente por `(source_id, language, lexical_id)`;
- no sobrescribir lema, glosa, hash ni metadatos aprobados;
- insertar únicamente identificadores nuevos;
- enlazar todas las ocurrencias con la entrada léxica resultante.

## Seguridad

La función generalizada debe conservar:

- `security definer`;
- `search_path` fijo;
- revocación para `anon`, `authenticated` y `public`;
- ejecución reservada a `service_role` y contexto interno;
- RLS activo en tablas públicas;
- recuperación posterior exclusivamente desde servidor;
- ninguna llamada a proveedores de IA.

## Validación fuera de producción

El siguiente incremento debe crear un borrador SQL fuera de `supabase/migrations` y un workflow con PostgreSQL 16 que:

- cargue el esquema mínimo real;
- instale la función generalizada;
- ejecute una importación de Rut dentro de una transacción controlada;
- valide conteos, hashes, variantes, lote e idempotencia;
- ejecute casos negativos y confirme rollback;
- no se conecte al proyecto Supabase de producción.

## Criterio de avance

Solo después de aprobar esa validación podrá prepararse una migración activa. La aplicación de esa migración y la importación de Rut serán incrementos separados y requerirán una nueva auditoría independiente antes de solicitar pruebas visuales al usuario.
