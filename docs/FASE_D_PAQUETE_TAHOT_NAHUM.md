# FASE D · Bloque 4 — Paquete TAHOT reproducible de Nahúm

Fecha: 2026-08-02

## Objetivo

Habilitar Nahúm (`Nam` / `NAM`) en el extractor genérico de TAHOT y generar dos paquetes independientes para comprobar identidad byte a byte, integridad de referencias, palabras, morfemas y procedencia de sus cuatro lecturas Qere/Ketiv.

Este incremento no construye payload, no modifica el importador y no escribe en Supabase, RLS, interfaz o producción.

## Fuente fijada

- repositorio: `STEPBible/STEPBible-Data`;
- commit: `b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39`;
- dataset: `TAHOT Isa-Mal`;
- SHA-256 del archivo fuente: `f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5`;
- licencia: CC BY 4.0;
- atribución: STEP Bible.

## Resultado estructural

- capítulos: 3;
- referencias: 47 de 47;
- filas fuente: 558;
- palabras visibles: 558;
- componentes morfológicos: 828;
- filas con variantes: 4;
- casos Qere: 4;
- omisiones Qere: 0;
- filas hebreas: 558;
- filas arameas: 0;
- texto restaurado: 0;
- adiciones reconstruidas desde la LXX: 0;
- idiomas desconocidos: 0;
- desalineaciones: 0;
- hashes de línea inválidos: 0;
- palabras visibles artificiales: 0.

Las 47 referencias corresponden exactamente a:

- capítulo 1: 15 versículos;
- capítulo 2: 13 versículos;
- capítulo 3: 19 versículos.

Cada versículo conserva índices visibles continuos desde 1 hasta su conteo declarado.

## Reproducibilidad

Dos ejecuciones independientes produjeron paquetes, manifiestos y auditorías idénticos.

- archivo: `nam.json.gz`;
- tamaño: 110,590 bytes;
- SHA-256: `60e280a6d94abc8788b7cc9647e4dfa0f679e0a9708a1adf00be30abfc23b7f5`;
- compresión determinista: `gzip`, nivel 9, `mtime=0` y nombre interno vacío;
- comparación de bytes: aprobada;
- comparación de manifiestos: aprobada;
- comparación de auditorías: aprobada.

La validación automática exige el tamaño y la huella anteriores. Cualquier cambio en el paquete, aunque conserve los conteos, detiene CI.

## Qere y Ketiv fijados

Las cuatro filas con variantes son exactamente las cuatro filas Qere. Ninguna es una omisión: cada Qere permanece como palabra visible principal y el Ketiv se conserva como evidencia separada.

### Nahúm 1:3

- referencia fuente: `Nam.1.3#04=Q(K)`;
- índice visible: 4;
- Qere visible: `וּגְדָל`;
- transliteración Qere: `u.ge.dol-`;
- Ketiv documentado: `וּגְדוֹל`;
- evidencia ortográfica Leningrado: `וּגְדָול`;
- SHA-256 de la línea fuente: `a89d8026a33cf6ee0026547388a3da4e02f0abe123b1dc2d69691341c345ffb7`.

### Nahúm 1:15

- referencia fuente: `Nam.1.15#17=Q(k)`;
- índice visible: 17;
- Qere visible: `לַֽעֲבָר`;
- transliteración Qere: `la.'a.Vor-`;
- Ketiv documentado: `לַעֲבוֹר`;
- evidencia ortográfica Leningrado: `לַֽעֲבָור`;
- SHA-256 de la línea fuente: `ecb2bf4c628b4def3ccf97803c570dcdc1bde4f8aa64effc8204c36f027b61f7`.

### Nahúm 2:5

- referencia fuente: `Nam.2.5#04=Q(K)`;
- índice visible: 4;
- Qere visible: `בַּהֲלִֽיכָתָ֑ם`;
- transliteración Qere: `va.ha.li.kho.tam`;
- Ketiv documentado: `בַהֲלִכוֹתָם`;
- evidencia ortográfica Leningrado: `בַּהֲלִכָותָם`;
- SHA-256 de la línea fuente: `b3d2baafdd8efb5c795f16f6fdc95ea66dafeac812bfd70da587c4709ddefa16`.

### Nahúm 3:3

- referencia fuente: `Nam.3.3#14=Q(K)`;
- índice visible: 14;
- Qere visible: `וְכָשְׁל֖וּ`;
- transliteración Qere: `ve.yikh.she.lu`;
- Ketiv documentado: `יִכְשְׁלוּ`;
- evidencia ortográfica Leningrado: `יְכָשְׁל֖וּ`;
- SHA-256 de la línea fuente: `edaeb818785689d6e1f732c4205c5175dd730cc15250b740e3a0a9b74c5f3ab6`.

## Controles automáticos

El workflow permanente verifica:

- auto-tests del esquema, extractor y ambos auditores de Nahúm;
- catálogo exacto de 47 referencias;
- doble generación independiente;
- identidad byte a byte;
- tamaño y SHA-256 fijados;
- conteos estructurales completos;
- continuidad de índices visibles;
- cuatro filas con variantes y cuatro Qere;
- coincidencia exacta entre ambos conjuntos;
- lecturas, índices, evidencias y hashes de línea exactos;
- cero omisiones Qere o palabras artificiales;
- cero desalineaciones e idiomas desconocidos.

## Evidencia

- PR: #96;
- workflow: `Validar paquete TAHOT de Nahúm`;
- ejecución inicial: `30780593399` — `success`;
- ejecución final del contrato exacto: `30780858522` — `success`;
- artefacto final: `stepbible-nahum-package`;
- ID: `8843576939`;
- digest: `sha256:afda8649db99fbfc0ebbd42bb4c3f5ce9f2f96463d43bfaac58b105fc176c29b`.

## Alcance y siguiente paso

Todavía no se ha:

- inspeccionado el conjunto completo de identificadores léxicos de Nahúm;
- fijado una política canónica para afijos sin lema hebreo explícito;
- construido un payload;
- modificado el contrato del importador;
- creado o aplicado una migración;
- escrito en Supabase.

El siguiente incremento seguro será inspeccionar los componentes léxicos de Nahúm y fijar únicamente los lemas canónicos de afijos que falten. No construir payload ni importar Nahúm hasta completar y registrar esa política.
