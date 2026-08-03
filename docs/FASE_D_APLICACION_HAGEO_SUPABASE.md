# FASE D · Bloque 4 — Aplicación controlada de Hageo

Fecha: 2026-08-02

## Resultado

La migración activa del importador TAHOT y el payload canónico de Hageo fueron aplicados de forma controlada al proyecto Supabase `calendariovida`.

La importación, auditoría técnica e idempotencia están completas. Falta únicamente la validación funcional manual en la aplicación.

## Artefactos fijados

- libro: Hageo (`Hag` / `HAG`);
- migración activa: `supabase/migrations/20260803023000_generalizar_importador_payload_tahot_hageo.sql`;
- PR de activación: #87;
- corrección mínima de cita SQL: PR #88;
- commit de corrección: `0d6d78cb47083be8b6e67c1e63f59f848585c7a6`;
- paquete: `bc8e1caebce9a2e55d34b3be4770f3591e430b3aa217208324dee1bdbdd54e38`;
- archivo payload: `c24d50fbbe01ecb47ec5a818c8a0f8cbdebae1451f2c9cd2b446234f02516ec6`;
- huella canónica interna: `db6510d6e971e672c2fac244b406ffd1f704ac49d4fc3b3bbca3b1c5cde71fa9`;
- archivo fuente TAHOT Isa–Mal: `f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5`;
- commit STEPBible: `b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39`.

## Aplicación de la migración

La primera ejecución controlada fue rechazada de forma atómica porque la comprobación final contenía una cadena SQL con comillas de identificador. PostgreSQL revirtió por completo la operación:

- la función conservó su contrato OBA/RUT;
- Hageo permaneció con cero textos, ocurrencias y lotes;
- no hubo escrituras parciales.

El PR #88 corrigió únicamente esa cita y añadió una comprobación estática para impedir la regresión. Después de la corrección, la migración `generalizar_importador_payload_tahot_hageo` quedó registrada correctamente.

La función interna final:

- conserva los contratos aprobados de Abdías y Rut;
- acepta exactamente el contrato fijado de Hageo;
- valida las tres variantes esperadas;
- conserva la validación especial de Rut 3:12;
- tiene SHA-256 `619b0249f70e6ac373256da724a89033cb3ecb566ad26f2ac9709ee0b6f9977d`.

## Transferencia e idempotencia

El payload fue transferido desde el artefacto reproducible y verificado antes de llamar al importador interno.

La ejecución posterior realizada con el mismo payload encontró el estado exacto ya importado y devolvió nuevamente:

- 38 referencias;
- 600 palabras visibles;
- 911 ocurrencias;
- 235 identificadores léxicos;
- 2 filas fuente con variantes;
- 3 variantes;
- cero hashes inválidos;
- `idempotent = true`.

Los conteos permanecieron sin cambios, confirmando idempotencia en producción.

Los dos puentes temporales de transferencia quedaron sustituidos por versiones inertes que:

- exigen JWT;
- responden únicamente HTTP 410;
- no contienen URL de artefacto, credenciales ni lógica de importación.

## Auditoría posterior independiente

- capítulos: 2;
- textos de versículo: 38;
- textos aprobados y habilitados: 38;
- palabras visibles: 600;
- ocurrencias morfológicas: 911;
- identificadores léxicos utilizados: 235;
- variantes estructuradas: 3;
- variantes aprobadas y habilitadas: 3;
- lotes de importación: 1;
- versículos con anomalías de índice visible: 0;
- hashes inválidos de textos: 0;
- hashes inválidos de ocurrencias o líneas fuente: 0;
- hashes inválidos de entradas léxicas: 0;
- hashes inválidos de variantes: 0.

El lote quedó con estado `imported`, sin error, y conserva los conteos y huellas del paquete, payload, archivo fuente y commit STEPBible.

Muestras de continuidad visible:

- Hageo 1:1: 28 palabras;
- Hageo 1:8: 11 palabras;
- Hageo 1:10: 9 palabras;
- Hageo 2:23: 20 palabras.

## Variantes y Qere/Ketiv

Distribución:

- variantes ortográficas: 2;
- sustituciones: 1;
- adiciones, omisiones o transposiciones: 0.

### Hageo 1:8

Dos variantes ancladas en la palabra visible 9:

1. ortográfica:
   - base `וְאֶכָּבְדָ֖ה`;
   - variante `וְאֶכָּבְדָ֖`;
   - testigo `L`;
2. sustitución Qere/Ketiv:
   - lectura principal Qere `וְאֶכָּבְדָ֖ה`;
   - Ketiv `וְאֶכָּבֵד`;
   - testigo `K`.

La lectura Qere permanece en el texto principal y no se crea una palabra adicional.

### Hageo 1:10

- ancla visible: 5;
- base `שָמַ֖יִם`;
- variante ortográfica `שָׁמַ֖יִם`;
- testigo `ABH`.

## Integridad editorial

- traducciones literales españolas añadidas: 0;
- glosas españolas de ocurrencia añadidas: 0;
- explicaciones españolas de variantes añadidas: 0;
- textos marcados como generados por IA: 0;
- ocurrencias marcadas como generadas por IA: 0;
- variantes marcadas como generadas por IA: 0.

La capa editorial española permanece deliberadamente incompleta cuando no existe revisión humana.

## Seguridad y recuperación

- `anon` no puede ejecutar el importador;
- `authenticated` no puede ejecutar el importador;
- únicamente `service_role` conserva `EXECUTE`;
- RLS continúa activo en las cuatro tablas textuales;
- el catálogo `HAG` está aprobado y habilitado con los alias `Hageo`, `Haggai` y `Hag`;
- la recuperación permanece en módulos `server-only` y exige una sesión autenticada;
- el resolver textual es genérico y no contiene un filtro exclusivo para Abdías o Rut.

El asesor de seguridad no produjo hallazgos asociados a Hageo, al importador TAHOT o a sus tablas. Los avisos existentes pertenecen a otras áreas históricas del proyecto.

## Evidencia técnica

- paquete: PR #82;
- política de afijos: PR #83;
- payload: PR #84;
- importador validado fuera de producción: PR #85;
- migración activa: PR #87;
- corrección de cita SQL: PR #88;
- workflow final de migración activa: ejecución `30778552986` — `success`;
- validación externa anterior: artefacto `stepbible-haggai-active-migration-validation`, ID `8842816420`, digest `sha256:bba8ed4764117097197e5c21fbacfec399a2f6aa73306135f62fd6f3a1d63e11`.

## Estado pendiente

La importación y la auditoría técnica están completas. Falta la validación funcional manual en producción de:

- Biblia → Estudio;
- Estudio Profundo;
- texto hebreo RTL y transliteración;
- agrupación palabra por palabra;
- Strong, lemas y morfología;
- Hageo 1:8 con sus dos variantes;
- Hageo 1:10 con su variante ortográfica;
- ausencia correcta de variantes en referencias sin evidencia;
- regresión de Rut, Abdías y Juan 3:16.

No ampliar a otro libro ni avanzar al Bloque 5 hasta registrar esa validación funcional.
