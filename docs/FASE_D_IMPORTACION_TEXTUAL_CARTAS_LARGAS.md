# FASE D · Bloque 4 — Lote textual de cartas largas

Fecha: 2026-08-02

## Libros importados

- Romanos;
- 1 Corintios;
- Gálatas;
- Efesios;
- 1 Timoteo;
- 2 Timoteo;
- Hebreos.

## Validación por libro

| Libro | Textos | Palabras base | Lecturas adicionales | Variantes documentadas | Respaldo | Hashes inválidos |
|---|---:|---:|---:|---:|---:|---:|
| Romanos | 433 | 7,122 | 139 | 255 | 1 | 0 |
| 1 Corintios | 437 | 6,829 | 157 | 260 | 0 | 0 |
| Gálatas | 149 | 2,230 | 40 | 76 | 0 | 0 |
| Efesios | 155 | 2,422 | 62 | 92 | 0 | 0 |
| 1 Timoteo | 113 | 1,591 | 49 | 68 | 0 | 0 |
| 2 Timoteo | 83 | 1,238 | 35 | 52 | 0 | 0 |
| Hebreos | 303 | 4,953 | 84 | 152 | 0 | 0 |

## Resultado del lote

- referencias: 1,673;
- palabras base: 26,385;
- lecturas adicionales: 566;
- ocurrencias: 26,951;
- variantes documentadas: 955;
- hashes inválidos: 0.

## Lectura de respaldo

Romanos 16:24 no pertenece a la lectura NA28. TAGNT conserva la referencia y el importador seleccionó SBL como edición de respaldo.

La fila queda marcada con:

- `base_edition: SBL`;
- `uses_fallback_edition: true`;
- testigos y líneas fuente;
- texto, transliteración y glosas de la lectura utilizada.

No se presenta como texto NA28 ni se elimina para forzar uniformidad.

## Muestras comprobadas

- Romanos 8:28 y 16:24;
- 1 Corintios 13:4;
- Gálatas 3:28;
- Efesios 2:8;
- 1 Timoteo 2:12;
- 2 Timoteo 3:16;
- Hebreos 11:1.

## Estado acumulado

- libros textuales completos: 19;
- referencias: 2,496;
- palabras base: 40,243;
- lecturas adicionales: 930;
- ocurrencias: 41,173;
- variantes documentadas: 1,457.

## Seguridad e integridad

- migración transaccional;
- SHA-256 del archivo y de cada paquete individual;
- conteos exactos por libro;
- rollback completo ante cualquier diferencia;
- RLS activo;
- `anon` sin acceso;
- clientes autenticados únicamente con lectura;
- importador restringido al esquema `internal`;
- sin proveedor de IA.

## Siguiente lote

Importar Mateo, Marcos, Lucas, Juan y Hechos. Los tres libros con diferencias de versificación —2 Corintios, 3 Juan y Apocalipsis— siguen separados hasta aprobar sus correspondencias por traducción.