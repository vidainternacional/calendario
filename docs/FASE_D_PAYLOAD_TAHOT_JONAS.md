# FASE D · Bloque 4 — Payload TAHOT reproducible de Jonás

Fecha: 2026-08-02

## Resultado

El paquete reproducible de Jonás y su política canónica de afijos fueron transformados en un payload determinista compatible con el modelo textual interno, sin modificar Supabase ni producción.

Dos ejecuciones independientes produjeron exactamente los mismos bytes.

## Artefactos de entrada

- libro: Jonás (`Jon` / `JON`);
- paquete: `jon.json.gz`;
- SHA-256 del paquete: `083b869fe7d10493deaeee392babd9811e9dffb91f0db816d2f21a22b2135915`;
- política: `scripts/stepbible/jonah_affix_lemma_policy.json`;
- fuente TAHOT Isa–Mal: `f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5`;
- commit STEPBible: `b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39`.

## Conteos validados

- referencias y textos: 48;
- palabras visibles: 688;
- ocurrencias morfológicas: 1,080;
- identificadores léxicos: 288;
- filas fuente con variantes: 0;
- variantes estructuradas: 0;
- omisiones Qere: 0;
- palabras/raíces: 688;
- prefijos: 310;
- sufijos: 82;
- claves de ocurrencia duplicadas: 0;
- claves de variante duplicadas: 0;
- hashes inválidos: 0;
- palabras visibles artificiales: 0;
- campos editoriales españoles no autorizados: 0.

## Reproducibilidad

- archivo: `import-payload.json`;
- tamaño: 1,248,309 bytes;
- SHA-256 del archivo: `e6bd082a446d29becbafb35a22b94ef9e260e447fe7fc7cea4361d98c5bb835b`;
- huella canónica interna: `f986bdd833c86f9f239ddd26e4594aeb33d48a89f72fb05dcc853dbd1d512fc4`;
- estado: `validated_outside_production`.

El workflow permanente exige el tamaño y la huella exactos del archivo. Cualquier cambio futuro en los bytes detendrá CI aunque los conteos permanezcan iguales.

## Estado textual

Las 1,080 ocurrencias conservan el estado fuente `leningrad`.

La primera versión del auditor esperaba incorrectamente `base`. La doble generación y la comparación byte a byte ya habían aprobado; el fallo se produjo únicamente durante la auditoría posterior. La regla fue corregida para reflejar el contrato real del paquete, sin modificar el generador, los datos, los conteos, el SHA-256 del archivo o la huella interna.

## Ausencia de variantes

Jonás no contiene filas Qere ni variantes en la fuente fijada. El payload conserva:

- `source_variant_rows = 0`;
- `variants = 0`;
- `qere_omissions = 0`;
- arreglo `variants` vacío;
- ninguna palabra visible adicional o artificial.

## Integridad léxica y estructural

La auditoría confirmó:

- 288 entradas léxicas únicas;
- todos los identificadores cumplen el formato TAHOT esperado;
- todos los números Strong cumplen el formato hebreo esperado;
- todas las entradas tienen lema canónico;
- las 13 decisiones de afijos coinciden con la política aprobada;
- 1,080 claves de ocurrencia únicas;
- índices positivos y continuos en los 48 versículos;
- 688 palabras visibles reconstruidas exactamente;
- roles internos iguales al resumen declarado: 688 palabras, 310 prefijos y 82 sufijos;
- hashes válidos para textos, entradas, ocurrencias y líneas fuente.

## Integridad editorial

- glosas de fuente en inglés conservadas;
- traducción literal española no añadida;
- glosas españolas de ocurrencia no añadidas;
- explicación española de variantes no añadida;
- `spanish_editorial_fields_complete = false`;
- no se añadió contenido generado por IA.

## Validación automática

- PR: #122;
- workflow: `Validar payload de importación de Jonás`;
- primera ejecución: `30788630807`;
- corrección del estado textual: ejecución `30788708776` — `success`;
- validación exacta documentada: ejecución `30788854404` — `success`;
- artefacto final: `stepbible-jonah-import-payload`;
- ID: `8846266421`;
- digest: `sha256:517574fa159fb46a39b951d1fdd90e7e4b2d19554932e24111491065137c3026`.

## Alcance y siguiente paso

No se modificó el importador, no se creó una migración y no se escribió en Supabase, RLS, interfaz o producción.

El siguiente incremento seguro es diseñar y validar fuera de producción la ampliación transaccional e idempotente del importador para aceptar exactamente Jonás. No aplicar migraciones ni importar Jonás hasta aprobar rechazo de payload adulterado, rollback, conteos, hashes, permisos e idempotencia en PostgreSQL 16.
