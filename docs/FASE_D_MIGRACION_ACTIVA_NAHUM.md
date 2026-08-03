# FASE D · Bloque 4 — Migración activa de Nahúm

Fecha: 2026-08-02

## Resultado

El borrador transaccional de Nahúm fue convertido mecánicamente en una migración activa versionada y validado nuevamente en PostgreSQL 16.

Migración:

`supabase/migrations/20260803043000_generalizar_importador_payload_tahot_nahum.sql`

La migración **no se ha aplicado a Supabase** y Nahúm todavía no se ha importado en producción.

## Conversión mecánica

La primera validación generó la migración cambiando únicamente la declaración:

- origen: `BORRADOR NO ACTIVO`;
- destino: `MIGRACIÓN ACTIVA`.

El cuerpo SQL permaneció idéntico. El archivo generado se comparó byte a byte con la migración versionada antes de ejecutar PostgreSQL.

Después de probar esa equivalencia, el borrador, el activador y el materializador temporal fueron retirados. El repositorio conserva una sola ruta activa.

## Contrato fijado

- función base OBA/RUT/HAG:
  `619b0249f70e6ac373256da724a89033cb3ecb566ad26f2ac9709ee0b6f9977d`;
- función resultante OBA/RUT/HAG/NAM:
  `69045240e658995cd0e1ba3557e54a2700b623078b36125e73ed1ada64f5139c`;
- libro: Nahúm (`Nam` / `NAM`);
- dataset: `TAHOT Isa-Mal`;
- paquete:
  `60e280a6d94abc8788b7cc9647e4dfa0f679e0a9708a1adf00be30abfc23b7f5`;
- archivo payload:
  `0c041041155152e1fb63cb568efa1530724bea7fa729b4ed8815dcbaaf666000`;
- huella canónica interna:
  `43a5ab1b8c9cf773e218c73eab3def49715ac7c0511a04ee9cae3990be4a8a99`.

## Validaciones PostgreSQL 16

La prueba parte del fixture textual mínimo, instala sucesivamente los importadores activos de Abdías, Rut y Hageo y confirma la huella base antes de ejecutar la migración activa de Nahúm.

Controles aprobados:

- instalación sin escrituras de datos;
- payload adulterado de Nahúm 1:15 rechazado;
- cero residuos después del rechazo;
- rollback forzado de una importación válida;
- cero residuos después del rollback;
- importación válida completa;
- segunda ejecución idempotente;
- permisos exclusivos de `service_role`;
- `anon` y `authenticated` sin `EXECUTE`;
- ocho variantes exactas;
- reutilización no destructiva de `H3068G`;
- campos editoriales españoles nulos para los datos nuevos.

Conteos comprometidos:

- entradas léxicas totales del fixture: 388;
- textos: 47;
- ocurrencias: 828;
- variantes: 8;
- lotes: 1.

Las variantes permanecen distribuidas en:

- cuatro ortográficas;
- cuatro sustituciones Qere/Ketiv;
- cero adiciones;
- cero omisiones;
- cero transposiciones;
- cero anclas nulas.

## Evidencia reproducible

- PR: #113;
- workflow: `Validar migración activa TAHOT de Nahúm`;
- ejecución inicial con comprobación mecánica: `30783726966` — `success`;
- artefacto inicial: ID `8844524932`;
- digest inicial: `sha256:2ddf30acf9901842992d50bf9ac3ae316472ab254b154ae3c2a852cec56c5586`;
- ejecución limpia sin borrador ni materializadores: `30784026725` — `success`;
- artefacto limpio: `stepbible-nahum-active-migration-validation`;
- ID limpio: `8844622756`;
- digest limpio: `sha256:6d177970ef2bf6811a00eaeab392b8592c38e26737bf21dcb9360ae7352cc380`;
- función instalada en PostgreSQL efímero:
  `69045240e658995cd0e1ba3557e54a2700b623078b36125e73ed1ada64f5139c`;
- estado: `validated_outside_production`.

El commit final no contiene el borrador, el activador, el marcador, el materializador temporal ni el workflow sustituido del borrador. La validación permanente se ejecuta directamente sobre la migración activa.

## Alcance y siguiente paso

No se aplicó la migración a Supabase, no se importó Nahúm y no se modificaron RLS, interfaz o producción.

La migración activa quedó aprobada para aplicación controlada. El siguiente incremento autorizado será aplicar esta migración exacta en Supabase, importar únicamente Nahúm y realizar una auditoría independiente. No se solicitará validación visual hasta completar esa auditoría técnica.
