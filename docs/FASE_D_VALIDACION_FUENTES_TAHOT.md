# FASE D · Bloque 4 — Validación de fuentes TAHOT

Fecha: 2026-08-02

## Resultado

Las cuatro fuentes TAHOT fijadas al commit de STEPBible `b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39` descargaron correctamente y cubren los 39 libros esperados del Antiguo Testamento.

Esta validación fue exclusivamente de lectura. No se importaron datos en Supabase y no se modificó la interfaz ni producción.

## Archivos fijados

| Archivo | Libros | Referencias fuente | Filas con referencia | Bytes | SHA-256 |
|---|---:|---:|---:|---:|---|
| TAHOT Génesis–Deuteronomio | 5 | 5,852 | 79,990 | 18,190,455 | `e9b8546ee48fe0bfc57c3b70f5f40e98d96580e803526d19026224e31753368b` |
| TAHOT Josué–Ester | 12 | 7,018 | 107,259 | 24,500,317 | `195fee1dc3653bab33701f170734eb894ed647c10cd08cc61749375fe8b73775` |
| TAHOT Job–Cantares | 5 | 4,901 | 39,090 | 9,540,133 | `84e118a97e5725e3847cdfdd593873513021c790c63cc91a0d41fca2b5db2ed5` |
| TAHOT Isaías–Malaquías | 17 | 5,490 | 79,313 | 17,977,518 | `f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5` |

Totales:

- archivos: 4;
- libros: 39;
- referencias distintas de la fuente: 23,261;
- filas que contienen una referencia explícita: 305,652;
- tamaño total descargado: 70,208,423 bytes.

## Formas de fila

La primera inspección encontró 70,057 filas tabuladas cuya primera columna no contenía una referencia bíblica. La clasificación posterior demostró que no representan 70,057 registros bíblicos dañados:

- 283 filas pertenecen al preámbulo, licencia y documentación;
- 46,517 filas tienen la primera columna vacía y continúan la referencia de la fila anterior;
- 23,257 filas son cabeceras repetidas con el valor exacto `Eng (Heb) Ref & Type`.

Las 23,257 cabeceras repetidas equivalen a una cabecera entre bloques de referencias, con una menos por archivo que el total de referencias de ese archivo. El importador deberá ignorarlas explícitamente.

Las 46,517 filas continuadas todavía no se interpretan como un tipo lingüístico definitivo. El siguiente incremento analizará sus 17 columnas y determinará cuáles representan componentes, información paralela, Ketiv/Qere u otras relaciones documentadas por TAHOT.

## Versificación

Las 23,261 referencias son referencias de la fuente hebrea y no deben presentarse como el conteo de versículos de una traducción española. Los títulos de salmos y otras divisiones pueden diferir de R09 u otras traducciones. La referencia fuente se conservará y cualquier correspondencia se asociará a la traducción seleccionada.

## Evidencia automatizada

Workflow: `Validar fuentes textuales del Antiguo Testamento`.

Ejecución aprobada: `30765710955`.

Artefacto: `stepbible-ot-source-inspection`.

Digest del artefacto: `sha256:7733f5003475cf30f1b3a98190c3ca34d47239d5da055d65d87f4e5a876de524`.

## Próximo paso

1. fijar los cuatro hashes dentro del inspector;
2. definir el significado de las 17 columnas de las filas principales y continuadas;
3. distinguir hebreo y arameo por ocurrencia;
4. conservar prefijos, raíces y sufijos bajo una palabra visible;
5. modelar Ketiv/Qere y marcas de procedencia sin mezclarlas con la lectura principal;
6. generar paquetes por libro;
7. importar primero un libro pequeño y validar la interfaz antes de ampliar a los 39.

El Bloque 4 continúa activo. No se avanza al Bloque 5.
