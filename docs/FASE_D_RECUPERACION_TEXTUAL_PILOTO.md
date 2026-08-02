# FASE D · Bloque 4 — Recuperación textual piloto

Fecha: 2026-08-02

## Objetivo

Conectar los datos textuales aprobados de Salmos 23:1 y Juan 3:16 al servicio interno de Estudio Profundo sin modificar todavía la interfaz.

## Servicio

Archivo: `lib/estudios/biblical-textual-study.ts`.

La función `getInternalBiblicalTextualStudy()`:

1. reconoce una referencia mediante el índice canónico interno;
2. exige un versículo individual;
3. verifica que exista una sesión autenticada;
4. recupera únicamente textos, fuentes, ocurrencias, entradas léxicas y variantes aprobadas y habilitadas;
5. agrupa morfemas por `display_word_index`;
6. separa la secuencia base de las ocurrencias variantes;
7. calcula una versión estable del paquete a partir de hashes y datos lingüísticos.

## Contrato devuelto

El paquete contiene:

- referencia canónica;
- una o más ediciones aprobadas;
- texto original completo;
- texto normalizado;
- transliteración completa;
- traducción literal editorial;
- dirección del texto;
- estado del análisis;
- atribución, licencia y versión de la fuente;
- palabras de la lectura base;
- morfemas de cada palabra;
- lema, Strong, categoría gramatical y morfología;
- ocurrencias variantes separadas;
- variantes textuales con ediciones y significado;
- versión hash del paquete.

## Integración

`app/actions/estudio-interno.ts` adjunta el resultado como `textualEvidence` únicamente cuando existe evidencia aprobada.

El cliente actual no lee ni muestra esta propiedad. Por lo tanto, este incremento valida la recuperación y serialización del servidor sin cambiar la pantalla visible.

## Comportamiento esperado

- `Salmos 23:1`: devuelve una edición hebrea con cuatro palabras visibles y cinco morfemas.
- `Juan 3:16`: devuelve una edición griega con 25 palabras base, una ocurrencia variante y dos variantes documentadas.
- una referencia contextual sin paquete textual devuelve el estudio normal sin `textualEvidence`;
- una consulta temática o de concordancia no intenta inventar evidencia textual;
- una referencia de capítulo completo no devuelve un paquete textual de versículo.

## Seguridad

La recuperación depende de RLS y vuelve a filtrar:

- `enabled = true`;
- `review_status = approved`;
- fuente aprobada;
- entrada léxica aprobada;
- cuenta autenticada y activa según las políticas existentes.

No se consulta ningún proveedor de IA y no se exponen metadatos internos de importación en el contrato público.

## Siguiente incremento

Después de validar compilación y respuesta del servidor, crear la visualización dentro de **Biblia → Estudio** para los dos pasajes piloto.