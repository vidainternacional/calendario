# FASE D · Bloque 4 — Aplicación controlada de Hageo

Fecha: 2026-08-02

## Resultado

La migración activa del importador TAHOT y el payload canónico de Hageo fueron aplicados de forma controlada al proyecto Supabase `calendariovida`.

La importación, auditoría técnica y cierre de seguridad están completos. Falta únicamente la validación funcional manual en la aplicación.

## Artefactos fijados

- migración activa: `supabase/migrations/20260803023000_generalizar_importador_payload_tahot_hageo.sql`;
- paquete: `bc8e1caebce9a2e55d34b3be4770f3591e430b3aa217208324dee1bdbdd54e38`;
- archivo payload: `c24d50fbbe01ecb47ec5a818c8a0f8cbdebae1451f2c9cd2b446234f02516ec6`;
- huella canónica interna: `db6510d6e971e672c2fac244b406ffd1f704ac49d4fc3b3bbca3b1c5cde71fa9`;
- fuente TAHOT Isa–Mal: `f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5`;
- commit STEPBible: `b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39`.

## Activación y corrección segura

El PR #87 convirtió el borrador ya validado en una migración activa:

- commit de fusión: `c5514ccf4c77e9d3d85fc9e32460d0ff1fdee0a0`.

La primera aplicación fue rechazada por PostgreSQL porque la comprobación final contenía una cadena entre comillas de identificador dentro de `strpos`. La transacción fue revertida completamente:

- la función conservó la huella OBA/RUT;
- Hageo permaneció con cero textos y cero lotes;
- no quedaron escrituras parciales.

El PR #88 corrigió únicamente esa cita SQL y añadió una comprobación estática para impedir su reaparición:

- commit de fusión: `0d6d78cb47083be8b6e67c1e63f59f848585c7a6`;
- workflow final: `30778552986` — `success`;
- artefacto: `stepbible-haggai-active-migration-validation`;
- ID: `8842866884`;
- digest: `sha256:b6365795fd24f1828680bd68f649508fa177e68f7189dfbe75f37d18b90d2a02`.

La migración corregida fue aplicada correctamente. La función activa resultante conserva la huella:

`619b0249f70e6ac373256da724a89033cb3ecb566ad26f2ac9709ee0b6f9977d`

## Importación controlada

El payload se transfirió desde el artefacto canónico, fue descomprimido y verificado antes de llamar al importador.

Resultado devuelto por el importador:

- dataset: `TAHOT Isa-Mal`;
- libro: `HAG`;
- referencias: 38;
- palabras visibles: 600;
- ocurrencias: 911;
- identificadores léxicos: 235;
- filas fuente con variantes: 2;
- variantes estructuradas: 3;
- hashes inválidos: 0;
- operación idempotente: sí.

## Auditoría posterior independiente

- capítulos: 2;
- textos de versículo: 38;
- textos aprobados y habilitados: 38;
- palabras visibles: 600;
- ocurrencias morfológicas: 911;
- identificadores léxicos utilizados: 235;
- variantes aprobadas y habilitadas: 3;
- lotes de importación: 1;
- hashes inválidos de textos: 0;
- hashes inválidos de ocurrencias: 0;
- hashes inválidos de entradas léxicas: 0;
- hashes inválidos de variantes: 0.

El lote quedó con estado `imported`, sin error, y conserva los conteos y las huellas del paquete, payload, archivo fuente y commit STEPBible.

## Variantes textuales

Hageo 1:8 conserva dos variantes aprobadas y habilitadas:

1. ortográfica:
   - base `וְאֶכָּבְדָ֖ה`;
   - variante `וְאֶכָּבְדָ֖`;
   - ancla 9;
   - testigo `L`;
2. sustitución Qere/Ketiv:
   - base Qere `וְאֶכָּבְדָ֖ה`;
   - Ketiv `וְאֶכָּבֵד`;
   - ancla 9;
   - testigo `K`.

Hageo 1:10 conserva una variante ortográfica:

- base `שָמַ֖יִם`;
- variante `שָׁמַ֖יִם`;
- ancla 5;
- testigo `ABH`.

No existen variantes de adición, omisión o transposición para este paquete.

## Integridad editorial

- traducciones literales españolas añadidas: 0;
- glosas españolas de ocurrencia añadidas: 0;
- explicaciones españolas de variantes añadidas: 0;
- textos, ocurrencias o variantes marcados como generados por IA: 0.

## Seguridad y cierre de puentes

- `anon` no puede ejecutar el importador;
- `authenticated` no puede ejecutar el importador;
- únicamente `service_role` conserva `EXECUTE`;
- RLS continúa activo en las cuatro tablas textuales;
- el RPC público temporal de transferencia fue eliminado;
- `import-haggai-once` quedó inerte, exige JWT y responde HTTP 410;
- durante la auditoría se descubrió otra Edge Function temporal, `import-haggai-direct-20260803`, con capacidad de escritura directa y sin JWT;
- esa función fue reemplazada inmediatamente por una versión inerte, ahora exige JWT y responde HTTP 410;
- los conteos posteriores permanecieron exactamente en 38 textos, 911 ocurrencias, 3 variantes y 1 lote.

El asesor de seguridad no produjo hallazgos asociados al importador TAHOT, a sus tablas ni a los puentes temporales. Los avisos restantes pertenecen a áreas históricas fuera del alcance de este incremento.

## Estado pendiente

Falta validar manualmente en producción:

- Biblia → Estudio;
- Estudio Profundo;
- texto hebreo RTL y transliteración;
- agrupación palabra por palabra;
- Strong, lemas y morfología;
- Hageo 1:8 con dos variantes;
- Hageo 1:10 con su variante ortográfica;
- regresión de Abdías, Rut y Juan 3:16.

No ampliar a otro libro ni avanzar al Bloque 5 hasta registrar esa validación funcional.
