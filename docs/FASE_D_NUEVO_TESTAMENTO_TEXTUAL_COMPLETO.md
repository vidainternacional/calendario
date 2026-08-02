# FASE D · Bloque 4 — Nuevo Testamento textual completo

Fecha: 2026-08-02

## Resultado

Los 27 libros del Nuevo Testamento están importados desde TAGNT y disponibles para recuperación interna.

Conteos finales:

- libros: 27;
- capítulos: 260;
- referencias TAGNT: 7,958;
- palabras de lectura base: 138,096;
- lecturas adicionales: 4,000;
- ocurrencias textuales: 142,096;
- variantes documentadas: 6,409;
- hashes inválidos: 0.

## Datos disponibles por referencia

- texto griego;
- transliteración;
- secuencia literal de glosas en español;
- palabras en orden;
- lema;
- número Strong;
- categoría gramatical;
- código morfológico;
- lecturas adicionales;
- notas de variante;
- ediciones y testigos declarados por STEPBible;
- fuente, licencia, versión, línea y SHA-256.

## Fuente

- repositorio: `STEPBible/STEPBible-Data`;
- commit: `b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39`;
- licencia: CC BY 4.0;
- Mateo–Juan SHA-256: `ab8eaaeb68e17a1dcfa34e1e9350358f22f03bc2a97244d848750ad81044bc8e`;
- Hechos–Apocalipsis SHA-256: `524e32375361e6d3fa2f7ef00b87605fdc4317a762f395651a05fdc31ad031b7`.

## Lectura base

NA28 se utiliza cuando contiene la referencia. Dieciséis referencias ausentes en NA28 se conservan con una edición de respaldo aprobada y quedan marcadas mediante:

- `base_edition`;
- `uses_fallback_edition: true`;
- testigos;
- línea y archivo fuente.

No se eliminan versículos para forzar una única edición ni se atribuyen lecturas de respaldo a NA28.

## Versificación R09

HelloAO identifica Reina Valera 1909 como `spa_r09`, con SHA-256:

`94e154b2e6e56eda1702d9e9f664357a5f2aa82634b551111b0b698d124e97d5`

Se aprobaron cinco correspondencias:

### 2 Corintios 13:14

HelloAO expone un marcador 13:14 vacío. El resolver usa TAGNT 13:13 para devolver la bendición textual cuando se consulta 13:14 en R09.

### 3 Juan 1:14

R09 reúne en 1:14 las referencias TAGNT 1:14 y 1:15. El resultado ensamblado contiene 21 palabras base.

### Apocalipsis 13:1

R09 integra la frase TAGNT 12:18 al comienzo de 13:1. El resultado ensamblado combina TAGNT 12:18 y 13:1, con 33 palabras base.

## Resolver del servidor

`getResolvedBiblicalTextualStudy()`:

1. reconoce la referencia solicitada;
2. recibe el identificador de traducción;
3. busca un perfil de versificación aprobado;
4. utiliza correspondencias explícitas cuando existen;
5. recupera uno o varios paquetes fuente;
6. concatena texto, transliteración y glosas;
7. reindexa palabras y anclas de variantes;
8. conserva las referencias fuente utilizadas;
9. usa recuperación directa cuando no se necesita correspondencia.

`analizarPasaje()` acepta `translation_id` y utiliza `spa_r09` como valor predeterminado.

## Seguridad

- RLS activo;
- `anon` sin acceso;
- clientes autenticados únicamente con lectura;
- importador no ejecutable desde clientes;
- perfiles y correspondencias únicamente aprobados y habilitados;
- fuente aprobada obligatoria;
- ninguna llamada a un proveedor de IA.

## Estado visible

El servidor ya puede adjuntar evidencia textual para cualquier versículo del Nuevo Testamento. La siguiente tarea del Bloque 4 es:

1. publicar la visualización general dentro de **Biblia → Estudio** y Estudio Profundo;
2. importar el corpus hebreo y arameo del Antiguo Testamento;
3. aplicar el mismo modelo de correspondencias donde la numeración difiera entre traducciones.