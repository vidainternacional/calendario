# FASE D · Bloque 4 — Paquete TAHOT piloto de Rut

Fecha: 2026-08-02

## Objetivo

Generar y auditar un paquete completo de un libro pequeño antes de importar contenido textual del Antiguo Testamento a Supabase.

El libro elegido es **Rut** porque:

- tiene cuatro capítulos y 85 referencias;
- pertenece al archivo TAHOT Josué–Ester ya fijado por SHA-256;
- es completamente hebreo;
- permite validar el flujo completo sin comenzar por un corpus grande;
- no introduce por sí solo la complejidad lingüística del arameo de Esdras y Daniel.

## Contenido del paquete

El artefacto conserva por cada fila:

- referencia inglesa y referencia hebrea alternativa;
- índice fuente exacto;
- estado textual;
- forma hebrea;
- transliteración;
- glosa de la fuente;
- Strong ampliado;
- morfología;
- idioma derivado de `Grammar`;
- variantes de significado y ortografía;
- raíz e identificadores alternativos;
- unión con la palabra siguiente;
- etiquetas Strong expandidas;
- número de línea original.

También agrupa las filas por referencia y genera una lista de tokens de lectura reproducible.

## Regla de lectura provisional

El paquete no elimina ninguna fila. Para producir `reading_tokens` por posición:

1. Qere tiene prioridad cuando existe;
2. en ausencia de Qere se utiliza Leningrado;
3. después se considera texto restaurado;
4. las adiciones reconstruidas desde la LXX permanecen separadas;
5. una omisión Qere no crea una palabra visible artificial;
6. Ketiv y demás evidencia permanecen en las filas completas del versículo.

Esta regla sirve para auditar el paquete. Todavía no implica importación ni publicación.

## Resultado validado

El workflow generó y auditó el libro completo:

- capítulos: 4;
- referencias: 85;
- filas fuente: 1,294;
- tokens visibles de lectura: 1,293;
- filas hebreas: 1,293;
- filas sin idioma por omisión Qere: 1;
- filas arameas: 0;
- estados Leningrado: 1,281;
- estados Qere: 13;
- omisiones Qere: 1;
- filas sin forma hebrea: 1;
- SHA-256 canónico del paquete: `7f4ae92f1e1aa3e76f5e0f8a2efafbedfcc8c8f9bf673e12af8448780c24e8a1`.

## Auditoría Qere/Ketiv

Los trece casos Qere conservan evidencia Ketiv estructurada:

- 11 casos desde `Meaning variants`;
- 2 casos desde `Spelling variants`;
- 1 omisión Qere en `Rut.3.12#05=Q(K)`.

La omisión de Rut 3:12 no produce una palabra visible. La evidencia Ketiv de `אִם` permanece disponible en el artefacto.

Muestras revisadas:

- Rut 1:1;
- Rut 2:12;
- Rut 3:9;
- Rut 4:17;
- los trece casos Qere del libro.

## Evidencia técnica

- PR #65;
- workflow `Validar paquete TAHOT de Rut`;
- ejecución `30771696828` — `success`;
- artefacto `stepbible-tahot-ruth-package`;
- digest del artefacto `sha256:1254c03a203e05a739205af073ea6bc401a8829cf135666b596390120d172d10`.

## Seguridad y alcance

- no modifica Supabase;
- no importa entradas léxicas ni ocurrencias;
- no cambia la interfaz;
- no modifica producción;
- no consulta proveedores de IA;
- el corpus completo solo existe como artefacto temporal de CI.

## Criterio de avance

El paquete de Rut queda aprobado como base del importador del Antiguo Testamento. El siguiente incremento será diseñar y probar la importación transaccional de Rut en Supabase, manteniendo RLS, procedencia, hashes y separación Qere/Ketiv. El Bloque 4 permanece activo.
