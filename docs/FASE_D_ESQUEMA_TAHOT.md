# FASE D · Bloque 4 — Esquema verificado de TAHOT

Fecha: 2026-08-02

## Objetivo

Interpretar de forma reproducible la estructura tabulada de TAHOT antes de convertir sus filas en palabras, morfemas, variantes o textos completos del Antiguo Testamento.

## Fuente

- repositorio: `STEPBible/STEPBible-Data`;
- commit: `b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39`;
- licencia: CC BY 4.0;
- atribución: STEP Bible;
- archivos: 4;
- hashes SHA-256 fijados y obligatorios.

## Resultado global

La inspección completa confirmó:

- 39 libros;
- 23,261 referencias distintas de la fuente;
- 305,652 filas bíblicas explícitas;
- 12 columnas nombradas;
- 5 columnas reservadas que permanecen vacías;
- 80 filas tabuladas de licencia y documentación antes de los datos;
- 46,517 separadores completamente vacíos después de iniciar los datos;
- 0 filas lingüísticas posteriores sin referencia explícita;
- 300,811 filas hebreas;
- 4,827 filas arameas;
- 14 posiciones Qere sin forma visible.

Las filas que inicialmente parecían “continuaciones” son separadores vacíos. Los prefijos, raíces, sufijos y puntuación se almacenan dentro de la misma fila y se delimitan mediante `/` y `\`.

## Las doce columnas activas

| # | Nombre fuente | Uso confirmado |
|---:|---|---|
| 1 | `Eng (Heb) Ref & Type` | Referencia inglesa, referencia hebrea alternativa cuando difiere, índice de palabra de Ketiv y tipo textual. |
| 2 | `Hebrew` | Texto completo con vocalización, cantilación y puntuación. `/` separa elementos morfológicos y `\` separa puntuación. |
| 3 | `Transliteration` | Transliteración alineada con los elementos de la palabra. |
| 4 | `Translation` | Secuencia inglesa alineada mediante `/`. `<...>` marca elementos presentes que normalmente no se traducen y `[...]` palabras implícitas. |
| 5 | `dStrongs` | Etiquetas léxicas para cada elemento. La raíz aparece entre llaves y `+` puede extender una etiqueta a la siguiente palabra. |
| 6 | `Grammar` | Morfología ETCBC/OpenScriptures adaptada. El primer carácter `H` identifica hebreo y `A` arameo. |
| 7 | `Meaning Variants` | Variantes que pueden alterar el sentido o la traducción. |
| 8 | `Spelling Variants` | Diferencias ortográficas que la fuente considera no significativas para el sentido. |
| 9 | `Root dStrong+Instance` | Identificador estable de la raíz léxica y su instancia. |
| 10 | `Alternative Strongs+Instance` | Etiquetado Strong alternativo cuando existe otra interpretación de la raíz. |
| 11 | `Conjoin word` | Reservada por STEPBible; la documentación indica que todavía no está implementada. |
| 12 | `Expanded Strong tags` | Repite las etiquetas e incorpora lema hebreo, glosa, sub‑sentido y elementos de puntuación. |

Las columnas 13–17 están vacías en todas las filas bíblicas inspeccionadas y no se usarán para almacenar información propia.

## Referencias y versificación

La primera columna utiliza la referencia inglesa definida por la fuente. Cuando la numeración hebrea difiere, se incluye entre paréntesis:

`Isa.9.3(9.2)#03=Q(K)`

El contrato conserva por separado:

- referencia inglesa;
- referencia hebrea alternativa;
- índice fuente como cadena, preservando ceros iniciales y posiciones suplementarias como `0501`;
- sufijo textual completo.

No se convertirá esta numeración directamente a una traducción de la aplicación. La correspondencia se resolverá mediante el perfil de la traducción activa, igual que en el Nuevo Testamento.

## Idioma por ocurrencia

El idioma se determina desde `Grammar`, no únicamente por el libro:

- `H...`: hebreo;
- `A...`: arameo;
- vacío: posición sin forma lingüística;
- cualquier otro prefijo: estado desconocido que debe bloquear la importación.

Esto permite tratar correctamente las secciones arameas de Esdras y Daniel sin marcar el libro completo como arameo.

## Tipos textuales

La documentación incluida en TAHOT define:

- `L`: texto de Leningrado;
- `Q`: Qere, lectura pronunciada o corrección marginal;
- `K`: Ketiv, forma escrita original que Qere reemplaza;
- `R`: texto restaurado desde paralelos de Leningrado;
- `X`: palabras adicionales conservadas en la LXX y reconstruidas en hebreo por BHS/BHK.

Las letras dentro de paréntesis identifican otras fuentes o decisiones editoriales. Se preservan con su mayúscula o minúscula porque la fuente usa la caja para indicar si la diferencia puede afectar la traducción.

Códigos documentados:

- `A`: manuscrito de Alepo;
- `B`: Biblia Hebraica Stuttgartensia;
- `C`: manuscrito de El Cairo;
- `D`: manuscritos del Mar Muerto o desierto de Judea;
- `E`: enmienda académica a partir de fuentes antiguas;
- `F`: división o formato alternativo;
- `H`: edición Ben Chaim;
- `P`: puntuación alternativa;
- `S`: tradición escribal;
- `V`: otros manuscritos hebreos.

## Modelo Qere/Ketiv

La lectura principal de una fila `Q(...)` es Qere. Ketiv nunca se mezcla dentro de esa forma principal:

- `Q(K)`: Ketiv aparece como variante de significado en la columna 7;
- `Q(k)`: Ketiv aparece como diferencia ortográfica en la columna 8;
- `L` puede aparecer también en la columna 8 para conservar las letras de Ketiv con la vocalización de Qere presentes en Leningrado;
- variantes adicionales se preservan usando el sufijo y las columnas 7–8.

Las 14 posiciones con `Hebrew` y `Grammar` vacíos, pero con `[ ]` en transliteración y traducción, representan una omisión en Qere: no producen una palabra base visible. La palabra de Ketiv se conserva únicamente como variante estructurada.

## Texto restaurado y adiciones LXX

- Las filas `R` se conservarán como texto restaurado con aviso explícito de procedencia.
- Las filas `X` se conservarán como adiciones reconstruidas desde la LXX, sin presentarlas silenciosamente como texto de Leningrado.
- Ambas mantienen su índice fuente y sus etiquetas léxicas.

## Contrato implementado

`scripts/stepbible/tahot_schema.py` define:

- las 12 columnas activas y cinco reservadas;
- parser de referencia inglesa y hebrea;
- conservación del índice fuente;
- clasificación `leningrad`, `qere`, `restored`, `lxx_addition` y `other`;
- detección de hebreo, arameo y posiciones vacías desde `Grammar`;
- detección de omisiones Qere;
- catálogo de códigos documentados de variantes.

Inspectores:

- `scripts/stepbible/inspect_ot_schema.py`;
- `scripts/stepbible/inspect_ot_semantics.py`.

## Validación

Workflow: `Validar esquema observado de TAHOT`.

Ejecución aprobada:

- run: `30768672102`;
- commit: `148a205cd6907be67799ec4f342148f9f69ccabc`;
- artefacto: `stepbible-ot-schema-observation`;
- digest: `sha256:1645c2707ea3d2760bfc181235991a8600e802ed94a3a38dc7bbb8a2f4abde53`.

Auto‑pruebas aprobadas:

- referencias directas y referencias con numeración hebrea alternativa;
- posiciones suplementarias con ceros iniciales;
- clasificación de L, Q, R y X;
- detección hebreo/arameo;
- omisión Qere;
- encabezado uniforme y columnas reservadas vacías;
- ausencia de filas lingüísticas sin referencia explícita.

## Seguridad

- proceso de solo lectura;
- no modifica Supabase;
- no importa datos;
- no cambia la interfaz;
- no modifica producción;
- no consulta proveedores de IA.

## Siguiente incremento

Generar paquetes reproducibles por libro usando este contrato. El primer paquete completo será un libro pequeño y deberá validar:

- todas sus referencias;
- orden de palabras;
- elementos morfológicos;
- texto hebreo o arameo;
- transliteración y secuencia literal;
- Qere/Ketiv;
- restauraciones y adiciones LXX cuando existan;
- hashes y trazabilidad.

No se importará a Supabase hasta que ese paquete pase su auditoría independiente.
