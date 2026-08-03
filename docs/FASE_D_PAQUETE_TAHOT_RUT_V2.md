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
- el informe generado ya utiliza dinámicamente el nombre del libro;
- `scripts/stepbible/audit_ruth_qere.py` audita específicamente la evidencia Qere/Ketiv;
- el workflow genera el paquete dos veces y compara bytes y manifiestos;
- no se incluyen actualizadores temporales del documento maestro.

## Conteos obligatorios

La validación debe exigir:

- capítulos: 4;
- referencias: 85;
- filas fuente: 1,294;
- palabras visibles: 1,293;
- filas Qere: 13;
- omisiones Qere: 1;
- filas hebreas: 1,293;
- filas arameas: 0;
- idiomas desconocidos: 0;
- hashes de línea inválidos: 0.

## Regla de la omisión Qere

La posición `Rut.3.12#05=Q(K)` representa una omisión Qere con evidencia Ketiv.

La validación obliga a que:

- no tenga forma visible artificial;
- no reciba `display_word_index`;
- no cuente dentro de las 1,293 palabras visibles;
- conserve la evidencia Ketiv estructurada;
- siga disponible para la futura construcción de variantes textuales.

## Evidencia Qere/Ketiv esperada

- casos Qere: 13;
- casos con evidencia Ketiv desde variantes de significado: 11;
- casos con evidencia Ketiv desde variantes ortográficas: 2;
- omisiones Qere: 1;
- palabras visibles artificiales: 0.

## Reproducibilidad

El workflow `Validar paquete TAHOT de Rut v2` debe:

1. ejecutar los auto-tests del contrato TAHOT, extractor y auditor;
2. generar el libro dos veces desde la fuente fijada;
3. comparar byte a byte ambos archivos `rut.json.gz`;
4. comparar ambos manifiestos;
5. validar los conteos obligatorios;
6. generar la auditoría Qere/Ketiv;
7. publicar un artefacto temporal de CI.

La ejecución, SHA-256 final y digest del artefacto se registrarán únicamente después de que CI termine correctamente.

## Seguridad y alcance

Este incremento:

- no modifica Supabase;
- no importa entradas léxicas ni ocurrencias;
- no modifica RLS ni permisos;
- no cambia Biblia → Estudio ni Estudio Profundo;
- no consulta proveedores de IA;
- no avanza al Bloque 5.

## Criterio de avance

Después de validar y fusionar este paquete se podrá diseñar, en un incremento separado, un generador de payload e importador transaccional reutilizable para Rut. La escritura en Supabase solo podrá ocurrir después de validar conteos, hashes, omisiones Qere, idempotencia y rollback.
