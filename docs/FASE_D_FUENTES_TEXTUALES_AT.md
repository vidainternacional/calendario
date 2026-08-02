# FASE D · Bloque 4 — Fuentes textuales del Antiguo Testamento

Fecha: 2026-08-02

## Alcance de este incremento

Validar las fuentes que se utilizarán para ampliar la capa textual hebrea y aramea a los 39 libros del Antiguo Testamento.

Este incremento es de solo lectura:

- no importa palabras ni versículos;
- no modifica Supabase;
- no cambia la interfaz;
- no altera producción;
- no conecta los datos a un proveedor de IA.

## Fuente fijada

Repositorio: `STEPBible/STEPBible-Data`

Commit:

`b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39`

Licencia y atribución:

- CC BY 4.0;
- atribución visible a STEP Bible.

## Archivos TAHOT

La fuente divide el Antiguo Testamento en cuatro archivos:

1. `TAHOT Gen-Deu - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt`;
2. `TAHOT Jos-Est - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt`;
3. `TAHOT Job-Sng - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt`;
4. `TAHOT Isa-Mal - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt`.

Cobertura esperada:

- Pentateuco: 5 libros;
- históricos: 12 libros;
- poesía y sabiduría: 5 libros;
- profetas: 17 libros;
- total: 39 libros.

## Qué valida el inspector

`scripts/stepbible/inspect_ot_sources.py`:

- descarga los cuatro archivos desde el commit fijado;
- calcula SHA-256 y tamaño de cada archivo;
- comprueba que cada archivo contenga únicamente sus libros esperados;
- cuenta filas morfológicas, capítulos y referencias distintas;
- inventaría las marcas de procedencia textual presentes en el primer campo;
- detecta filas tabuladas sin referencia reconocible;
- genera un manifiesto JSON y un resumen Markdown;
- no conserva ni publica los archivos fuente completos.

## Hash conocido previamente

El archivo Job–Cantares ya fue validado durante el piloto de Salmos 23:1:

`84e118a97e5725e3847cdfdd593873513021c790c63cc91a0d41fca2b5db2ed5`

La ejecución completa fijó también los hashes de Génesis–Deuteronomio, Josué–Ester e Isaías–Malaquías.

## Resultado automatizado confirmado

La inspección completa aprobó:

- 4 archivos;
- 39 libros;
- 23,261 referencias distintas de la fuente;
- 305,652 filas con referencia explícita;
- 46,517 filas continuadas;
- 23,257 cabeceras repetidas `Eng (Heb) Ref & Type`;
- 283 filas de preámbulo;
- 70,208,423 bytes descargados;
- los cuatro hashes SHA-256 fijados en el inspector.

El workflow vuelve a descargar los cuatro archivos y cancela la ejecución si cualquiera de sus hashes difiere del valor aprobado.

La evidencia detallada está en `docs/FASE_D_VALIDACION_FUENTES_TAHOT.md`.

## Validaciones siguientes

Después de aprobar esta inspección se realizará, en bloques separados:

1. análisis completo de columnas y morfemas;
2. distinción hebreo/arameo por ocurrencia;
3. conservación de prefijos, raíces y sufijos dentro de una palabra visible;
4. tratamiento explícito de Ketiv/Qere y otras marcas de procedencia;
5. comparación de versificación TAHOT con las traducciones de la Biblia general;
6. generación reproducible de paquetes por libro;
7. importación piloto de un libro pequeño antes de ampliar a los 39.

## Criterio de avance

No se diseñará el importador masivo ni se cargará contenido hasta que:

- los cuatro archivos descarguen correctamente;
- sus hashes queden fijados;
- aparezcan los 39 libros esperados;
- las referencias sean analizables;
- cualquier diferencia de formato quede documentada.

El Bloque 4 permanece activo. No se avanza a cronologías ni mapas.
