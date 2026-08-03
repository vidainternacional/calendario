# FASE D · Bloque 4 — Paquete TAHOT reproducible de Hageo

Fecha: 2026-08-02

## Resultado

Hageo quedó habilitado en el extractor TAHOT genérico y fue generado dos veces de forma independiente. Ambas ejecuciones produjeron exactamente los mismos bytes, manifiesto y auditoría.

Este incremento es de solo lectura sobre la fuente y no genera payload, migración o escritura en Supabase.

## Identidad

- libro: Hageo;
- código STEPBible: `Hag`;
- código interno: `HAG`;
- capítulos: 2;
- distribución canónica: 15 versículos en el capítulo 1 y 23 en el capítulo 2;
- fuente: `tahot-isa-mal`;
- commit STEPBible: `b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39`;
- SHA-256 de la fuente: `f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5`;
- licencia: CC BY 4.0;
- atribución: STEP Bible.

## Conteos validados

- referencias: 38;
- filas fuente: 600;
- palabras visibles: 600;
- componentes morfológicos: 911;
- filas hebreas: 600;
- filas arameas: 0;
- filas con variantes: 2;
- Qere: 1;
- omisiones Qere: 0;
- texto restaurado: 0;
- adiciones reconstruidas desde la LXX: 0;
- desalineaciones: 0;
- idiomas desconocidos: 0;
- hashes de línea inválidos: 0;
- palabras visibles artificiales: 0.

## Reproducibilidad

Dos generaciones independientes produjeron:

- archivo: `hag.json.gz`;
- tamaño: 113,722 bytes;
- SHA-256: `bc8e1caebce9a2e55d34b3be4770f3591e430b3aa217208324dee1bdbdd54e38`;
- manifiestos idénticos;
- auditorías generales idénticas;
- bytes comprimidos idénticos.

## Variantes y Qere/Ketiv

### Hageo 1:8

- fila fuente: `Hag.1.8#09=Q(K)`;
- línea: 129727;
- SHA-256 de línea: `213d90fc5ff6a195681dcc7fb6fa996380f970c6d01e7f281a9bf9dbb14b55ba`;
- lectura Qere visible: `וְאֶכָּבְדָ֖ה`;
- transliteración Qere: `ve.'e.ka.ved`;
- Ketiv documentado: `וְאֶכָּבֵד`;
- índice visible: 9;
- no es una omisión Qere;
- no genera una palabra adicional o artificial.

La fuente conserva también una diferencia ortográfica de Leningrado para esta misma fila.

### Hageo 1:10

- fila fuente: `Hag.1.10#05=L(abh)`;
- línea: 129779;
- SHA-256 de línea: `8c6aec6a5219154ad28972646e420ffa0ceafc90daaac7026e06ab90346894f7`;
- forma base: `שָמַ֖יִם`;
- variante ortográfica documentada: `שָׁמַ֖יִם`;
- índice visible: 5.

Las dos filas con variantes conservan una procedencia y un hash de línea distintos.

## Validación automática

- workflow: `Validar paquete TAHOT de Hageo`;
- ejecución: `30777253377` — `success`;
- artefacto: `stepbible-haggai-package`;
- ID: `8842436792`;
- digest: `sha256:154835a7fede83e2784328db06223aa0a9426e806f68ed4058727306e4f45e1e`.

El artefacto contiene:

- `hag.json.gz`;
- `manifest.json`;
- `audit.md`;
- `haggai-package-audit.json`;
- `haggai-package-audit.md`;
- `sha256.txt`.

## Seguridad y alcance

- no se generó payload de importación;
- no se modificó el contrato del importador;
- no se creó una migración;
- no se escribió en Supabase;
- no se modificó RLS;
- no se cambió la interfaz o producción;
- no se utilizó IA para crear contenido bíblico.

## Siguiente paso

El paquete de Hageo debe registrarse en el documento maestro. Después, el siguiente incremento seguro es inspeccionar sus componentes léxicos y fijar únicamente las políticas canónicas de afijos que falten antes de construir un payload. No generar payload ni importar Hageo hasta completar esa inspección y validación.
