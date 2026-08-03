# FASE D · Bloque 4 — Payload TAHOT reproducible de Rut

Fecha: 2026-08-02

## Objetivo

Construir fuera de producción un payload determinista de Rut a partir del paquete TAHOT validado, sin modificar Supabase, RLS ni la interfaz.

## Resultado validado

- referencias: 85;
- palabras visibles: 1,293;
- ocurrencias morfológicas: 2,026;
- identificadores léxicos: 373;
- filas fuente con variantes: 19;
- variantes estructuradas: 29;
- omisiones Qere: 1;
- roles morfológicos:
  - raíces/palabras: 1,295;
  - prefijos: 559;
  - sufijos: 172.

El número de raíces/palabras es mayor que las 1,293 palabras visibles porque algunas filas TAHOT contienen dos grupos léxicos dentro de una sola posición visible. Los separadores estructurales vacíos no se convierten en ocurrencias.

## Reproducibilidad

El payload se generó dos veces desde el mismo paquete y la misma política canónica. Ambas generaciones produjeron archivos idénticos byte a byte.

Huellas:

- paquete `rut.json.gz`: `80a79abd038de9159a90e7aa572f1d4ff6a0c7f1ca8bfb4195875ffd5a7ca20c`;
- archivo `import-payload.json`: `454d57e805cd55eaf59d1d7635eb2fe913858ff03f293b18d0db315222178913`;
- huella interna `payload_sha256`: `d88763cef355dc05d3251438f3adce08a99feed389b82502e8c8f1263d7b79ee`;
- tamaño del payload: 2,265,466 bytes.

## Omisión Qere de Rut 3:12

La posición `Rut.3.12#05=Q(K)` se conserva como variante de tipo `addition`:

- lectura base: nula;
- lectura alternativa: `אִם`;
- testigo: `K`;
- ancla visible: nula;
- ocurrencias creadas desde esa fila: 0;
- hash de la variante: `489cff3cf334e56ec11bd274d99a66e76032a81e3758f0bb563517230d774c40`.

Esto permite mostrar que la lectura base omite la palabra mientras el Ketiv la conserva, sin crear una palabra visible artificial.

## Integridad

La validación confirmó:

- claves de ocurrencia únicas;
- hashes SHA-256 válidos para textos, ocurrencias, entradas léxicas y variantes;
- 85 textos de versículo;
- 2,026 ocurrencias;
- 373 entradas léxicas;
- 29 variantes;
- política canónica de 21 afijos completamente cubierta;
- capa editorial española marcada como incompleta;
- ninguna traducción literal, glosa española o explicación española inventada.

## Evidencia de CI

- PR #73;
- workflow `Validar payload de importación de Rut`;
- ejecución inicial `30774563107` — `success`;
- artefacto `stepbible-ruth-import-payload`;
- ID del artefacto `8841574990`;
- digest del contenedor `sha256:e7be2e9c42cc6ec1b05f587c7725d413f92cf0cbe3dd4ddb0e7f1c93c1e40964`.

## Seguridad y alcance

Este incremento:

- no crea una migración activa;
- no ejecuta funciones de importación;
- no escribe en Supabase;
- no modifica RLS ni permisos;
- no modifica Biblia → Estudio ni Estudio Profundo;
- no consulta proveedores de IA;
- no avanza al Bloque 5.

## Siguiente incremento autorizado

Después de fusionar este payload se podrá diseñar un importador transaccional reutilizable para Rut y validarlo fuera de producción. La escritura en Supabase solo podrá ocurrir después de aprobar conteos exactos, hashes, rollback, idempotencia, variantes y el tratamiento de la omisión Qere.
