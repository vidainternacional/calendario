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

## Validaciones obligatorias

- fuente descargada desde el commit fijado;
- SHA-256 coincidente;
- solo filas de Rut;
- 4 capítulos;
- 85 referencias;
- ninguna fila aramea;
- ningún código lingüístico desconocido;
- todos los versículos con filas y lectura visible;
- columnas reservadas vacías;
- hash canónico SHA-256 del paquete;
- proceso reproducible mediante GitHub Actions.

## Seguridad y alcance

- no modifica Supabase;
- no importa entradas léxicas ni ocurrencias;
- no cambia la interfaz;
- no modifica producción;
- no consulta proveedores de IA;
- el corpus completo solo existe como artefacto temporal de CI.

## Criterio de avance

Después de aprobar el artefacto se compararán muestras de los cuatro capítulos y los casos textuales encontrados. Solo entonces se diseñará la migración/importador de Rut. El Bloque 4 permanece activo.
