# FASE D · Bloque 4 — Paquete TAHOT reproducible de Rut v2

Fecha: 2026-08-02

## Objetivo

Preparar el segundo libro completo del Antiguo Testamento mediante el extractor TAHOT actualmente validado, sin importar datos a Supabase ni modificar la interfaz.

Rut se mantiene como el siguiente incremento porque:

- contiene solamente cuatro capítulos y 85 referencias;
- pertenece a la fuente TAHOT Josué–Ester ya fijada por SHA-256;
- utiliza hebreo y no introduce todavía el corpus arameo;
- contiene trece casos Qere, incluida una omisión que permite probar la separación Qere/Ketiv;
- permite validar la generalización posterior del importador con un alcance controlado.

## Cambios de esta versión

La implementación anterior del paquete de Rut quedó en una rama histórica creada antes de validar el importador de Abdías. Esta versión se construye desde `main` y reutiliza el extractor actual:

- `scripts/stepbible/extract_ot_book.py` habilita Rut con su distribución canónica de 22, 23, 18 y 22 versículos;
- el informe generado utiliza dinámicamente el nombre del libro;
- `scripts/stepbible/audit_ruth_qere.py` audita específicamente la evidencia Qere/Ketiv;
- el workflow genera el paquete dos veces y compara bytes y manifiestos;
- no se incluyen actualizadores temporales del documento maestro.

## Resultado validado

- capítulos: 4;
- referencias: 85;
- filas fuente: 1,294;
- palabras visibles: 1,293;
- componentes morfológicos: 2,029;
- filas con variantes: 19;
- filas Qere: 13;
- omisiones Qere: 1;
- filas hebreas: 1,293;
- filas arameas: 0;
- texto restaurado: 0;
- adiciones reconstruidas desde LXX: 0;
- desalineaciones: 0;
- idiomas desconocidos: 0;
- hashes de línea inválidos: 0.

Fuente fijada:

- conjunto: `tahot-jos-est`;
- commit STEPBible: `b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39`;
- SHA-256 de la fuente: `195fee1dc3653bab33701f170734eb894ed647c10cd08cc61749375fe8b73775`.

Artefacto reproducible:

- archivo: `rut.json.gz`;
- tamaño: 247,609 bytes;
- SHA-256: `80a79abd038de9159a90e7aa572f1d4ff6a0c7f1ca8bfb4195875ffd5a7ca20c`.

## Regla de la omisión Qere

La posición `Rut.3.12#05=Q(K)` representa una omisión Qere con evidencia Ketiv.

La validación confirmó que:

- no tiene forma visible artificial;
- no recibe `display_word_index`;
- no cuenta dentro de las 1,293 palabras visibles;
- conserva la evidencia Ketiv de `אִם`;
- sigue disponible para la futura construcción de variantes textuales.

## Evidencia Qere/Ketiv

- casos Qere: 13;
- casos con evidencia Ketiv desde variantes de significado: 11;
- casos con evidencia Ketiv desde variantes ortográficas: 2;
- omisiones Qere: 1;
- palabras visibles artificiales: 0.

## Reproducibilidad

El workflow generó dos veces el libro completo desde la fuente fijada y confirmó:

- archivos `rut.json.gz` idénticos byte a byte;
- manifiestos idénticos;
- conteos exactos;
- SHA-256 estable;
- auditoría Qere/Ketiv aprobada.

Evidencia de CI:

- PR #70;
- workflow `Validar paquete TAHOT de Rut v2`;
- ejecución `30773995300` — `success`;
- artefacto `stepbible-tahot-ruth-package-v2`;
- ID del artefacto `8841404666`;
- digest del contenedor `sha256:68513b8267fe04356453652a0d85f2269720b4195df93ce0a376064e2e0b23d3`.

## Seguridad y alcance

Este incremento:

- no modifica Supabase;
- no importa entradas léxicas ni ocurrencias;
- no modifica RLS ni permisos;
- no cambia Biblia → Estudio ni Estudio Profundo;
- no consulta proveedores de IA;
- no avanza al Bloque 5.

## Criterio de avance

Después de fusionar este paquete se podrá diseñar, en un incremento separado, un generador de payload e importador transaccional reutilizable para Rut. La escritura en Supabase solo podrá ocurrir después de validar conteos, hashes, omisiones Qere, idempotencia y rollback.
