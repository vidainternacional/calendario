# FASE D · Bloque 4 — Evangelios y Hechos textuales

Fecha: 2026-08-02

## Libros importados

- Mateo;
- Marcos;
- Lucas;
- Juan;
- Hechos.

## Validación por libro

| Libro | Textos | Palabras base | Lecturas adicionales | Variantes documentadas | Respaldo | Hashes inválidos |
|---|---:|---:|---:|---:|---:|---:|
| Mateo | 1,071 | 18,387 | 511 | 808 | 3 | 0 |
| Marcos | 678 | 11,321 | 548 | 817 | 5 | 0 |
| Lucas | 1,151 | 19,498 | 643 | 1,110 | 2 | 0 |
| Juan | 879 | 15,650 | 426 | 706 | 1 | 0 |
| Hechos | 1,007 | 18,452 | 534 | 926 | 4 | 0 |

## Resultado del lote

- referencias: 4,786;
- palabras base: 83,308;
- lecturas adicionales: 2,662;
- ocurrencias: 85,970;
- variantes documentadas: 4,367;
- referencias con edición de respaldo: 15;
- hashes inválidos: 0.

## Referencias de respaldo

NA28 no contiene algunas referencias presentes en otras tradiciones. El importador las conserva y etiqueta con la edición utilizada.

### Mateo

- Mateo 17:21 — Tregelles;
- Mateo 18:11 — Textus Receptus;
- Mateo 23:14 — Textus Receptus.

### Marcos

- Marcos 7:16 — Tregelles;
- Marcos 9:44 — Tregelles;
- Marcos 9:46 — Tregelles;
- Marcos 11:26 — Textus Receptus;
- Marcos 15:28 — Textus Receptus.

### Lucas

- Lucas 17:36 — Textus Receptus;
- Lucas 23:17 — Textus Receptus.

### Juan

- Juan 5:4 — Textus Receptus.

### Hechos

- Hechos 8:37 — Textus Receptus;
- Hechos 15:34 — Textus Receptus;
- Hechos 24:7 — Textus Receptus;
- Hechos 28:29 — Textus Receptus.

La interfaz deberá mostrar estas referencias como lecturas de respaldo, no atribuirlas a NA28 ni ocultarlas.

## Muestras comprobadas

- Mateo 6:7;
- Marcos 16:8;
- Lucas 4:18;
- Juan 3:16;
- Hechos 2:1.

Cada muestra devuelve texto griego, transliteración, glosas alineadas, palabras con Strong y morfología, variantes, edición base y trazabilidad.

## Procedencia de lotes

El importador ahora registra el archivo correcto:

- Mateo–Juan: `TAGNT Mat-Jhn`;
- Hechos: `TAGNT Act-Rev`.

## Estado acumulado

- libros textuales completos: 24 de 27;
- referencias: 7,282;
- palabras base: 123,551;
- lecturas adicionales: 3,592;
- ocurrencias: 127,143;
- variantes documentadas: 5,824.

## Libros pendientes

- 2 Corintios;
- 3 Juan;
- Apocalipsis.

Los tres poseen diferencias de versificación y se importarán después de aprobar correspondencias asociadas a la traducción seleccionada.

## Seguridad e integridad

- importaciones divididas en tres transacciones;
- hashes del archivo y del paquete individual;
- conteos exactos por libro;
- rollback ante cualquier diferencia;
- RLS activo;
- `anon` sin acceso;
- clientes autenticados únicamente con lectura;
- importador restringido al esquema `internal`;
- sin proveedor de IA.