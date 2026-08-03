# FASE D · Bloque 4 — Aplicación controlada de Obadías

Fecha: 2026-08-02

## Resultado

La migración activa y el payload canónico de Obadías fueron aplicados de forma controlada al proyecto Supabase `calendariovida`.

## Artefactos fijados

- migración: `supabase/migrations/20260802232000_importador_payload_tahot_obadias.sql`;
- payload: `supabase/import-payloads/obadiah-tahot-v1.json`;
- SHA-256 de la migración: `e4e5cdbacb68778abffb5a549792723ee36932497fd667b3a207617c26b7604b`;
- SHA-256 del archivo payload: `dea3cbc8a608b6c0a663c1c7dd61103f57652b9b7d73481fe7b2477947d34a30`;
- huella canónica interna: `502eade2003802940dd79d386073e4b9817ae5f0668fd341b84ae6ea9e828652`.

## Auditoría posterior

- textos de versículo: 21;
- palabras visibles: 291;
- ocurrencias morfológicas: 434;
- identificadores léxicos usados: 184;
- variantes estructuradas: 3;
- lotes de importación: 1;
- hashes inválidos: 0;
- glosas españolas inventadas: 0;
- traducciones literales españolas inventadas: 0;
- significados españoles de variantes inventados: 0.

La segunda ejecución produjo los mismos conteos, confirmando idempotencia.

## Qere y variantes

- Obadías 1:8 conserva una variante ortográfica;
- Obadías 1:11 conserva una variante ortográfica y la lectura Ketiv como sustitución separada;
- la lectura Qere permanece como texto principal.

## Seguridad

- `anon` no puede ejecutar el importador;
- `authenticated` no puede ejecutar el importador;
- únicamente `service_role` conserva `EXECUTE`;
- no se agregaron campos editoriales españoles sin revisión;
- RLS y políticas existentes no fueron debilitadas.

## Evidencia

- PR #67;
- commit de fusión `8705ffd9044bacec0d15495ca0b82c186cf53455`;
- PR #68;
- commit de fusión `d4ce2f1f172bd8f178fcc5b8421bc76826977b4b`;
- migraciones Supabase `importador_payload_tahot_obadias` y `agregar_alias_obadias_a_abdias` aplicadas correctamente.

## Validación funcional completada

La recuperación desde servidor y la visualización fueron confirmadas en producción el 2026-08-02.

- la diferencia entre el nombre canónico `Abdías` y las denominaciones `Obadías`/`Obadias` fue corregida mediante una migración idempotente de alias;
- Abdías 1:1 muestra texto hebreo RTL, transliteración, 18 palabras base, análisis palabra por palabra, fuente, licencia y contexto;
- las 21 referencias están disponibles;
- Abdías 1:8 y 1:11 conservan sus variantes documentadas;
- no se reimportaron datos ni se debilitó RLS.

## Siguiente paso

Preparar una ampliación controlada del corpus textual del Antiguo Testamento reutilizando el importador validado, comenzando por un libro pequeño. El Bloque 4 permanece activo y no se debe avanzar al Bloque 5.
