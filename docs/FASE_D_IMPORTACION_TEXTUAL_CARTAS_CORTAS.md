# FASE D · Bloque 4 — Lote textual de cartas cortas

Fecha: 2026-08-02

## Libros importados

- 2 Juan;
- Judas;
- Tito;
- 2 Tesalonicenses;
- 2 Pedro.

Los cinco libros mantienen correspondencia directa entre las referencias TAGNT y la numeración usada para este lote. Ninguno necesita una edición de respaldo: NA28 está disponible en todas las referencias importadas.

## Validación por libro

| Libro | Textos | Palabras base | Lecturas adicionales | Variantes documentadas | Respaldo | Hashes inválidos |
|---|---:|---:|---:|---:|---:|---:|
| 2 Juan | 13 | 243 | 6 | 12 | 0 | 0 |
| Judas | 25 | 456 | 12 | 21 | 0 | 0 |
| Tito | 46 | 658 | 22 | 28 | 0 | 0 |
| 2 Tesalonicenses | 47 | 823 | 19 | 23 | 0 | 0 |
| 2 Pedro | 61 | 1,093 | 19 | 25 | 0 | 0 |

## Muestras comprobadas

- 2 Juan 1:6;
- Judas 1:3;
- Tito 2:11;
- 2 Tesalonicenses 2:2;
- 2 Pedro 3:9.

Cada muestra devuelve:

- texto griego de la lectura base;
- transliteración;
- secuencia literal de glosas fuente;
- palabras con lema, Strong y morfología;
- variantes atribuidas cuando existen;
- edición base y trazabilidad.

## Estado acumulado

Incluyendo Filemón:

- libros textuales completos: 6;
- referencias: 217;
- palabras base: 3,608;
- lecturas adicionales: 92;
- ocurrencias: 3,700;
- variantes documentadas: 127.

## Integridad

El lote se ejecutó en una sola migración transaccional. Cada libro fue descargado desde la fuente oficial fijada y validado mediante:

- SHA-256 del archivo TAGNT;
- SHA-256 del artefacto individual;
- conteo exacto de referencias;
- conteo exacto de palabras base;
- conteo exacto de lecturas adicionales;
- hashes de cada registro;
- registro en `internal.biblical_textual_import_batches`.

## Seguridad

No se modificaron permisos ni políticas:

- RLS activo;
- `anon` sin acceso;
- usuarios autenticados únicamente con `SELECT`;
- importador no ejecutable desde el cliente;
- sin IA durante extracción o recuperación.

## Siguiente lote

Continuar con cartas de tamaño medio que no requieren mapa de versificación. 2 Corintios, 3 Juan y Apocalipsis permanecen apartados hasta aprobar la correspondencia por traducción.