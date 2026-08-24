# FASE H — Bloque 2 — Auditoría de raíces verificadas

Fecha: 2026-08-19
Estado: auditoría read-only completada.

## Objetivo

Determinar si las fuentes hebreas ya aprobadas por VIDA permiten mostrar una raíz léxica explícita sin deducirla por heurística.

## Tablas auditadas

- `public.biblical_lexical_entries`
- `public.biblical_word_occurrences`

## Resultado

1. `biblical_lexical_entries` no contiene una columna de raíz explícita.
2. `biblical_word_occurrences` no contiene una columna de raíz explícita.
3. Se revisaron las claves de `metadata` de entradas hebreas `enabled=true` y `review_status='approved'`.
4. Las claves disponibles documentan fuente, dataset, versión/importación, hashes, nivel de revisión, lema fuente y estado editorial, pero no incluyen una raíz léxica explícita.
5. Por tanto, VIDA no debe generar una raíz tomando tres consonantes del lema, eliminando prefijos/sufijos o aplicando otra heurística visual.

## Decisión

El subpunto de raíces del Bloque 2 queda pendiente de una fuente léxica confiable y con licencia compatible que entregue la raíz de forma explícita y trazable.

Mientras tanto:

- el lema aprobado puede seguir mostrándose;
- la morfología aprobada puede utilizarse para enseñar forma y función;
- las raíces no se mostrarán como dato verificado;
- no se modifica Supabase ni se crean campos de raíz vacíos o inferidos.

## Morfología disponible

La auditoría confirmó cobertura real de códigos morfológicos hebreos compatibles con la familia Open Scriptures/STEPBible. Entre las formas Qal frecuentes aparecen códigos correspondientes a perfecto, imperfecto, forma secuencial narrativa, imperativo, infinitivo constructo y participio. Esto permite continuar gramática progresiva sin depender de una raíz inventada.

Esta auditoría no escribió datos ni modificó esquema, RLS, grants o funciones.
