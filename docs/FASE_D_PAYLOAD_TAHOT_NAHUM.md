# FASE D · Bloque 4 — Payload TAHOT reproducible de Nahúm

Fecha: 2026-08-02

## Resultado

El paquete reproducible de Nahúm y su política canónica de afijos fueron transformados en un payload determinista compatible con el modelo textual interno, sin modificar Supabase ni producción.

Dos ejecuciones independientes produjeron exactamente los mismos bytes.

## Artefactos de entrada

- libro: Nahúm (`Nam` / `NAM`);
- paquete: `nam.json.gz`;
- SHA-256 del paquete: `60e280a6d94abc8788b7cc9647e4dfa0f679e0a9708a1adf00be30abfc23b7f5`;
- política: `scripts/stepbible/nahum_affix_lemma_policy.json`;
- fuente TAHOT Isa–Mal: `f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5`;
- commit STEPBible: `b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39`.

## Conteos validados

- referencias y textos: 47;
- palabras visibles: 558;
- ocurrencias morfológicas: 828;
- identificadores léxicos: 387;
- filas fuente con variantes: 4;
- variantes estructuradas: 8;
- variantes ortográficas: 4;
- sustituciones Qere/Ketiv: 4;
- omisiones Qere: 0;
- palabras/raíces: 558;
- prefijos: 175;
- sufijos: 95;
- claves de ocurrencia duplicadas: 0;
- claves de variante duplicadas: 0;
- hashes inválidos: 0;
- palabras visibles artificiales: 0;
- campos editoriales españoles no autorizados: 0.

## Reproducibilidad

- archivo: `import-payload.json`;
- tamaño: 1,066,318 bytes;
- SHA-256 del archivo: `0c041041155152e1fb63cb568efa1530724bea7fa729b4ed8815dcbaaf666000`;
- huella canónica interna: `43a5ab1b8c9cf773e218c73eab3def49715ac7c0511a04ee9cae3990be4a8a99`;
- estado: `validated_outside_production`.

## Corrección de modelado Qere/Ketiv

La primera generación produjo siete variantes porque Nahúm 1:15 conserva el testigo Ketiv `K` dentro del mismo campo fuente que la variante ortográfica `L`.

El generador fue corregido para:

- separar `K` como sustitución Qere/Ketiv;
- excluir `K` del resumen de la variante ortográfica;
- conservar una sola sustitución cuando `K` ya está presente en la evidencia de significado;
- rechazar combinaciones ambiguas que no puedan representarse sin ampliar la clave de variante.

Rut contiene dos filas históricas con una estructura semejante. Como su payload ya fue importado, auditado y aprobado visualmente, la compatibilidad se conserva únicamente para la huella exacta del paquete fijado de Rut. Cualquier paquete nuevo usa el modelado corregido.

Regresiones confirmadas:

- paquete de Rut: `80a79abd038de9159a90e7aa572f1d4ff6a0c7f1ca8bfb4195875ffd5a7ca20c`;
- payload de Rut: `454d57e805cd55eaf59d1d7635eb2fe913858ff03f293b18d0db315222178913`;
- paquete de Hageo: `bc8e1caebce9a2e55d34b3be4770f3591e430b3aa217208324dee1bdbdd54e38`;
- payload de Hageo: `c24d50fbbe01ecb47ec5a818c8a0f8cbdebae1451f2c9cd2b446234f02516ec6`.

## Variantes estructuradas

### Nahúm 1:3

- ancla visible: 4;
- lectura base Qere: `וּגְדָל`;
- variante ortográfica L: `וּגְדָול־`;
- Ketiv K: `וּגְדוֹל`;
- hash ortográfico: `9efe642d1d9a24992c94a52e80dc35d259c3faf9453875f976c25b3c20055d64`;
- hash de sustitución: `768331bda59484864f4825dddfe73fcd814831ca06887015954888c266218cf8`.

### Nahúm 1:15

- ancla visible: 17;
- lectura base Qere: `לַֽעֲבָר`;
- variante ortográfica L: `לַֽעֲבָור־`;
- Ketiv K: `לַעֲבוֹר`;
- hash ortográfico: `dcec339d7811971e87221aaf0d5f572576deeaad3a398d1b885fbf4373efb762`;
- hash de sustitución: `613a3dd58eb3ef5366b9c0e37b349381f4b78bc5941096612f407c76bb8b2540`.

### Nahúm 2:5

- ancla visible: 4;
- lectura base Qere: `בַּהֲלִֽיכָתָ֑ם`;
- variante ortográfica L: `בַּהֲלִֽכָותָ֑ם`;
- Ketiv K: `בַהֲלִכוֹתָם`;
- hash ortográfico: `eb49717fc623dfafd078f9d67574542ae9a41af22529d2b3e769fb55e634367d`;
- hash de sustitución: `c60f300822ead99fb756d1427105eb9c00813db850d24187a9ad0f9137e99c46`.

### Nahúm 3:3

- ancla visible: 14;
- lectura base Qere: `וְכָשְׁל֖וּ`;
- variante ortográfica L: `יְכָשְׁל֖וּ`;
- Ketiv K: `יִכְשְׁלוּ`;
- hash ortográfico: `1b9369fc3a5e1d3b392f8dc14a0fb18fed6961aaf64efa8bb2d7c2c3e523d914`;
- hash de sustitución: `b6b4657e955cd7c0097746d5dd2b0bd207772aa3fc7d5df37dcac4c5b0ac597c`.

La lectura Qere permanece en el texto principal y ninguna variante crea una palabra visible adicional.

## Integridad editorial

- glosas de fuente en inglés conservadas;
- traducción literal española no añadida;
- glosas españolas de ocurrencia no añadidas;
- explicación española de variantes no añadida;
- `spanish_editorial_fields_complete = false`;
- no se añadió contenido generado por IA.

## Validación automática

- PR de corrección y payload: #105;
- workflow: `Validar payload de importación de Nahúm`;
- ejecución final: `30782128822` — `success`;
- artefacto: `stepbible-nahum-import-payload`;
- ID: `8844014389`;
- digest: `sha256:aead5384c01d293de4514e3971d6c1866ae801836525b2963f6010b8485a6449`.

## Alcance y siguiente paso

No se modificó el importador, no se creó una migración y no se escribió en Supabase, RLS, interfaz o producción.

El siguiente incremento seguro es diseñar y validar fuera de producción la ampliación transaccional e idempotente del importador para aceptar exactamente Nahúm. No aplicar migraciones ni importar Nahúm hasta aprobar rechazo de payload adulterado, rollback, conteos, hashes, permisos e idempotencia en PostgreSQL 16.
