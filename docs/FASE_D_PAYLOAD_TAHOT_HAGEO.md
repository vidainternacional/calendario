# FASE D · Bloque 4 — Payload TAHOT reproducible de Hageo

Fecha: 2026-08-02

## Resultado

El paquete reproducible de Hageo y su política canónica de afijos fueron transformados en un payload determinista compatible con el modelo textual interno, sin modificar Supabase ni producción.

Dos ejecuciones independientes produjeron exactamente los mismos bytes.

## Artefactos de entrada

- paquete `hag.json.gz`;
- SHA-256 del paquete: `bc8e1caebce9a2e55d34b3be4770f3591e430b3aa217208324dee1bdbdd54e38`;
- política: `scripts/stepbible/haggai_affix_lemma_policy.json`;
- fuente TAHOT Isa–Mal: `f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5`;
- commit STEPBible: `b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39`.

## Conteos validados

- referencias y textos: 38;
- palabras visibles: 600;
- ocurrencias morfológicas: 911;
- identificadores léxicos: 235;
- filas fuente con variantes: 2;
- variantes estructuradas: 3;
- omisiones Qere: 0;
- palabras/raíces: 600;
- prefijos: 268;
- sufijos: 43;
- claves de ocurrencia duplicadas: 0;
- claves de variante duplicadas: 0;
- hashes inválidos: 0;
- palabras visibles artificiales: 0;
- campos editoriales españoles no autorizados: 0.

## Reproducibilidad

- archivo: `import-payload.json`;
- tamaño: 1,052,343 bytes;
- SHA-256 del archivo: `c24d50fbbe01ecb47ec5a818c8a0f8cbdebae1451f2c9cd2b446234f02516ec6`;
- huella canónica interna: `db6510d6e971e672c2fac244b406ffd1f704ac49d4fc3b3bbca3b1c5cde71fa9`;
- estado de auditoría: `validated_outside_production`.

## Variantes estructuradas

### Hageo 1:8 — ortográfica

- ancla visible: 9;
- lectura base: `וְאֶכָּבְדָ֖ה`;
- lectura variante: `וְאֶכָּבְדָ֖`;
- tipo: `orthographic`;
- testigo: `L`;
- hash: `23b41c777eb36b8ff5a1771ec06f2fd42ae3adfb52820291a2fc37317c919da6`.

### Hageo 1:8 — sustitución Ketiv

- ancla visible: 9;
- lectura base Qere: `וְאֶכָּבְדָ֖ה`;
- lectura variante Ketiv: `וְאֶכָּבֵד`;
- tipo: `substitution`;
- testigo: `K`;
- hash: `971f7eee26666e16a1d7aa09fb6a5edb74e240aa7020259582c6d122eb207c1e`.

### Hageo 1:10 — ortográfica

- ancla visible: 5;
- lectura base: `שָמַ֖יִם`;
- lectura variante: `שָׁמַ֖יִם`;
- tipo: `orthographic`;
- testigo: `ABH`;
- hash: `13eddfb344545f9681a594a7af539de0d1fdb2b51537eeac46905890925b0c6e`.

No se creó una ocurrencia adicional para ninguna variante. La lectura Qere permanece en el texto principal.

## Integridad editorial

El payload mantiene separadas las capas de fuente y edición:

- glosas de fuente en inglés conservadas;
- traducción literal española no añadida;
- glosas españolas de ocurrencia no añadidas;
- explicación española de variantes no añadida;
- `spanish_editorial_fields_complete = false`;
- no se añadió contenido generado por IA.

## Validación automática

- workflow: `Validar payload de importación de Hageo`;
- ejecución inicial: `30777802369` — `success`;
- artefacto: `stepbible-haggai-import-payload`;
- ID: `8842631101`;
- digest: `sha256:32dc56f668eeb7b01f62b54447fee73ac0d0be0443e76b6438da4847d4cbe7b5`.

## Alcance y siguiente paso

Este incremento:

- no modifica el importador SQL;
- no crea una migración activa;
- no escribe en Supabase;
- no modifica RLS, interfaz o producción.

El siguiente incremento seguro es diseñar y validar fuera de producción la ampliación transaccional e idempotente del importador para aceptar exactamente Hageo con estas huellas y conteos. No aplicar la migración ni importar Hageo hasta que rollback, rechazo de payload adulterado, permisos e idempotencia hayan sido aprobados en PostgreSQL 16.
