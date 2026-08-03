# FASE D · Bloque 4 — Importador transaccional de Nahúm

Fecha: 2026-08-02

## Resultado

La ampliación del importador TAHOT para aceptar exactamente Nahúm fue derivada desde la migración activa de Hageo y validada fuera de producción en PostgreSQL 16.

El SQL permanece en:

`supabase/migration-drafts/20260803040000_importador_payload_tahot_nahum.sql`

Está marcado expresamente como **BORRADOR NO ACTIVO**. No se aplicó ninguna migración y no se modificó Supabase, RLS, interfaz o producción.

## Derivación controlada

El borrador no contiene una copia editada manualmente de toda la función. `generate_nahum_importer_draft.py`:

1. lee `20260803023000_generalizar_importador_payload_tahot_hageo.sql`;
2. extrae exactamente el contrato OBA/RUT/HAG y el validador de Hageo;
3. añade únicamente el contrato `NAM` y el validador de las ocho variantes;
4. exige que la función base tenga SHA-256:
   `619b0249f70e6ac373256da724a89033cb3ecb566ad26f2ac9709ee0b6f9977d`;
5. aborta si cualquiera de las anclas aparece cero veces o más de una vez.

El workflow regenera el borrador en `/tmp` y exige identidad byte a byte con el archivo versionado.

## Contrato cerrado de Nahúm

- código interno: `NAM`;
- código STEPBible: `Nam`;
- dataset: `TAHOT Isa-Mal`;
- fuente SHA-256: `f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5`;
- paquete: `60e280a6d94abc8788b7cc9647e4dfa0f679e0a9708a1adf00be30abfc23b7f5`;
- archivo payload: `0c041041155152e1fb63cb568efa1530724bea7fa729b4ed8815dcbaaf666000`;
- huella interna del payload: `43a5ab1b8c9cf773e218c73eab3def49715ac7c0511a04ee9cae3990be4a8a99`;
- referencias: 47;
- palabras visibles: 558;
- ocurrencias: 828;
- identificadores léxicos: 387;
- filas fuente con variantes: 4;
- variantes estructuradas: 8.

## Validador de variantes

La función compara las ocho variantes completas mediante JSONB y verifica:

- `variant_key`;
- capítulo y versículo;
- ancla visible;
- tipo de lectura;
- lectura base;
- lectura alternativa;
- testigos;
- hash de contenido.

La agregación se ordena numéricamente por capítulo y versículo y después por tipo de lectura. Esto evita que una clave textual como `1:15` quede antes de `1:3` por orden lexicográfico.

Distribución obligatoria:

- cuatro variantes ortográficas;
- cuatro sustituciones Qere/Ketiv;
- cero adiciones, omisiones o transposiciones;
- cero variantes sin ancla visible.

## Validaciones PostgreSQL 16

La prueba parte del fixture textual mínimo, instala sucesivamente los importadores de Abdías, Rut y Hageo y confirma la huella base OBA/RUT/HAG antes de ejecutar el borrador de Nahúm.

Controles aprobados:

- derivación exacta del borrador: aprobada;
- instalación del SQL: aprobada;
- payload adulterado de Nahúm 1:15: rechazado antes de escribir datos;
- estado posterior al rechazo: 2 entradas léxicas del fixture y cero textos, ocurrencias, variantes o lotes;
- rollback forzado de una importación válida: aprobado sin residuos;
- importación válida: aprobada;
- segunda ejecución: idempotente;
- `anon`: sin `EXECUTE`;
- `authenticated`: sin `EXECUTE`;
- `service_role`: único rol con `EXECUTE`.

Conteos después de la importación válida:

- entradas léxicas totales: 388;
- ocurrencias: 828;
- textos: 47;
- variantes: 8;
- lotes: 1.

El total léxico es 388 porque el fixture contiene dos entradas previas y Nahúm reutiliza `H3068G`; `H9020` permanece como fila histórica no usada por el libro.

Integridad adicional:

- las ocho variantes almacenadas coinciden exactamente con el payload;
- no existen variantes sin ancla;
- no existen adiciones, omisiones o transposiciones;
- no se añadieron traducciones literales españolas;
- no se añadieron glosas españolas de ocurrencia;
- no se añadieron explicaciones españolas de variantes;
- la entrada previa `H3068G` conserva `fixture:H3068G` y `Yahvé`, demostrando reutilización no destructiva;
- la metadata de archivos fuente coincide con los cuatro hashes fijados.

## Huellas de función

- función base OBA/RUT/HAG:
  `619b0249f70e6ac373256da724a89033cb3ecb566ad26f2ac9709ee0b6f9977d`;
- función resultante OBA/RUT/HAG/NAM en PostgreSQL efímero:
  `69045240e658995cd0e1ba3557e54a2700b623078b36125e73ed1ada64f5139c`.

## Corrección de la evidencia inicial

Una ejecución inicial utilizó:

`python ... | tee importer-validation.json`

Ese pipeline permitió que `tee` ocultara el código de salida del proceso Python y produjo un falso estado verde con un archivo de evidencia vacío. Al hacer que el script escribiera directamente el JSON y devolver su propio código de salida, se reveló además que el validador ordenaba las claves como texto.

Ambos problemas fueron corregidos:

- el script escribe `importer-validation.json` directamente;
- el workflow muestra y archiva ese archivo;
- las variantes se ordenan numéricamente por referencia;
- únicamente la ejecución final se considera evidencia válida.

## Evidencia reproducible

- PR: #109;
- workflow: `Validar importador transaccional de Nahúm`;
- ejecución final: `30783024562` — `success`;
- artefacto: `stepbible-nahum-importer-validation`;
- ID: `8844300567`;
- digest: `sha256:36559375e0893609faabf955593aa406c9c93abd0ddb5a407dcf2c8a34a066c5`;
- estado: `validated_outside_production`.

## Alcance y siguiente paso

No se creó una migración activa, no se aplicó el borrador y no se importó Nahúm en Supabase.

El siguiente incremento seguro es convertir mecánicamente este borrador validado en una migración activa versionada y repetir la prueba completa desde la función OBA/RUT/HAG exacta. Solo después de una segunda validación podrá considerarse una aplicación controlada en Supabase.
