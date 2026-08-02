# FASE D · Bloque 4 — Borrador de migración piloto de Obadías

Fecha: 2026-08-02

## Objetivo

Diseñar y probar una importación transaccional e idempotente para el paquete TAHOT de Obadías, sin aplicar todavía ningún cambio a Supabase.

## Estado de seguridad

El SQL está almacenado en:

`supabase/migration-drafts/20260802153000_importador_payload_tahot_obadias.sql`

La carpeta `migration-drafts` no forma parte de las migraciones activas. El archivo no se ejecuta por Vercel, Supabase ni el flujo normal del repositorio.

## Arquitectura

La importación se divide en tres pasos reproducibles:

1. `extract_ot_book.py` descarga y verifica TAHOT, y genera `oba.json.gz`;
2. `build_obadiah_import_payload.py` transforma el paquete auditado en un payload explícito para las tablas de Supabase;
3. `internal.import_stepbible_tahot_payload()` valida el payload y realiza las inserciones dentro de la transacción del llamador.

PostgreSQL no vuelve a interpretar directamente los archivos TAHOT de 70 MB. Solo recibe un payload previamente auditado con entradas léxicas, ocurrencias, textos y variantes ya separados.

## Política de afijos

`scripts/stepbible/obadiah_affix_lemma_policy.json` fija formas canónicas para diez identificadores pronominales cuyo segundo campo de TAHOT es un código morfológico y no un lema hebreo visible.

Reglas:

- las entradas existentes se reutilizan sin modificación destructiva;
- `H9020` conserva el lema existente `־י`;
- las raíces y prefijos con lema hebreo verificable usan el lema de TAHOT;
- ningún código como `Ps1c` se publica como lema;
- la política se aplica antes de construir el payload, no dentro de la interfaz.

## Separación de idiomas editoriales

El payload conserva:

- glosas inglesas en metadatos y `source_gloss`;
- `display_gloss_es = null` para entradas nuevas;
- `occurrence_gloss_es = null`;
- `literal_translation_es = null`;
- `significance_es = null`.

Todos esos campos quedan marcados como pendientes de revisión editorial. La migración no traduce automáticamente ni presenta inglés como contenido español.

## Conteos obligatorios

El borrador cancela la operación si el payload no contiene exactamente:

- 21 textos de versículo;
- 291 palabras visibles;
- 434 ocurrencias morfológicas;
- 184 identificadores léxicos;
- 2 filas fuente con variantes;
- 3 variantes estructuradas.

También rechaza:

- hashes inválidos;
- identificadores o números Strong fuera de formato;
- libros o fuentes no aprobados;
- un lote previo con otro SHA-256;
- permisos de ejecución para `anon` o `authenticated`.

## Idempotencia

Las inserciones utilizan las claves únicas existentes:

- entrada léxica: fuente, idioma e identificador;
- ocurrencia: libro, capítulo, versículo, fuente, palabra y morfema;
- texto: fuente, libro, capítulo, versículo e idioma;
- variante: fuente, texto y clave de variante;
- lote: fuente, dataset, libro y commit.

Una segunda ejecución con el mismo paquete no debe aumentar ningún conteo. Un paquete diferente para el mismo libro y commit se rechaza.

## Prueba efímera

El workflow `Validar borrador de migración de Obadías` inicia PostgreSQL 16 y crea un esquema mínimo que reproduce las columnas, restricciones y claves utilizadas por la migración.

La prueba debe comprobar:

1. instalación sintáctica del borrador;
2. `anon` y `authenticated` sin `EXECUTE`;
3. importación completa dentro de una transacción;
4. rollback forzado;
5. regreso exacto a 2 entradas existentes y 0 filas de Obadías;
6. importación comprometida en la base efímera;
7. segunda ejecución sin duplicados;
8. conservación del lema existente de `H9020`;
9. ausencia de glosas y traducciones españolas inventadas.

## Fuera de alcance

Este incremento no:

- mueve el SQL a `supabase/migrations`;
- llama `apply_migration`;
- modifica el proyecto Supabase;
- cambia la interfaz;
- despliega producción;
- completa la capa editorial española.

## Criterio de avance

Solo después de aprobar rollback e idempotencia podrá proponerse:

1. mover la función importadora a una migración activa;
2. generar una migración de datos con el payload fijado;
3. revisar nuevamente los conteos y permisos;
4. aplicar la migración a Supabase;
5. validar Obadías desde Biblia → Estudio y Estudio Profundo.

El Bloque 4 permanece activo.
