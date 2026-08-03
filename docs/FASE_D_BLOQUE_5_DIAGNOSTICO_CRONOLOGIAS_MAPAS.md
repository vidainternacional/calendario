# FASE D · Bloque 5 — Diagnóstico inicial de cronologías y mapas

Fecha: 2026-08-03

## Alcance

Este documento registra el primer incremento autorizado del Bloque 5. La inspección fue de solo lectura sobre `main`, `package.json`, el documento maestro y el esquema público de Supabase. No se creó DDL, no se importaron corpus, no se modificó la interfaz y no se escribió en producción.

## Inventario confirmado

### Navegación y experiencia existente

Las herramientas bíblicas avanzadas ya se presentan dentro de **Biblia → Estudio** y **Estudio Profundo**. El Bloque 5 debe reutilizar esas superficies y no crear una tercera sección paralela.

### Dependencias de interfaz

`package.json` no contiene Leaflet, MapLibre, OpenLayers, Google Maps SDK ni otra librería cartográfica. Tampoco existe una dependencia específica para líneas de tiempo. El proyecto dispone de React, Next.js, Tailwind y `lucide-react`, suficientes para un primer prototipo estático sin proveedor externo.

### Fuentes y datos reutilizables

- `public.biblical_sources` ya centraliza proveedor, versión, licencia, atribución, hash, revisión y habilitación.
- Pleiades ya está registrada como fuente histórica aprobada con licencia CC BY 3.0.
- `public.biblical_context_fragments` ya conserva `period_label`, `location_names`, referencia bíblica, localizador de fuente y metadatos.
- `public.biblical_context_units` ya conserva `places`, rangos bíblicos, contexto histórico, fuente, hash, revisión y habilitación.
- `public.biblical_books` aporta código canónico, orden, testamento y número de capítulos.
- No existen tablas públicas dedicadas a eventos cronológicos, periodos, lugares canónicos, coordenadas, geometrías, rutas o relaciones evento-lugar.
- No se encontró una dependencia cartográfica instalada ni evidencia de un componente de mapa reutilizable en el inventario disponible.

## Brechas

Los nombres de lugares actuales son texto libre y no proporcionan identidad estable, coordenadas, nivel de certeza, nombres alternativos o relaciones entre lugares. `period_label` tampoco permite ordenar de forma segura eventos con fechas aproximadas, rangos, cronologías alternativas o incertidumbre histórica.

No debe inferirse una coordenada a partir del nombre de un lugar ni presentarse una fecha debatida como exacta. Las cronologías bíblicas requieren distinguir al menos fecha exacta, rango, aproximación, orden relativo y tradición cronológica.

## Modelo mínimo propuesto

### `biblical_places`

- `id` UUID;
- `slug` estable;
- `canonical_name_es`;
- `alternate_names`;
- `place_kind`;
- `latitude` y `longitude` opcionales;
- `coordinate_precision` (`exact`, `approximate`, `regional`, `unknown`);
- `certainty_level` (`high`, `medium`, `low`, `disputed`);
- `source_id`, `source_locator`, `provider_version`, `content_hash`;
- `review_status`, `enabled`, `metadata`.

### `biblical_timeline_periods`

- `id`, `slug`, `title`;
- límites temporales opcionales;
- era y sistema cronológico;
- `date_precision` (`exact`, `year`, `range`, `approximate`, `relative`, `unknown`);
- `certainty_level`;
- fuente, hash, revisión, habilitación y metadatos.

### `biblical_timeline_events`

- `id`, `slug`, `title`, `summary`;
- referencia bíblica inicial y final;
- fecha o rango opcional;
- orden relativo independiente de la fecha absoluta;
- `date_precision`, `certainty_level` y nota de controversia;
- fuente, localizador, versión, hash, revisión y habilitación.

### Relaciones

- `biblical_timeline_event_places` para vincular eventos y lugares con un tipo de relación;
- relación opcional de eventos con periodos;
- referencias bíblicas estructuradas con el código canónico ya existente;
- ninguna relación con proveedores de IA.

## Fuentes candidatas

### Pleiades

Ya aprobada en el proyecto. Es apropiada para identidad geográfica antigua, nombres históricos y coordenadas con atribución CC BY 3.0. Debe conservarse el identificador estable de cada lugar y su precisión; no debe asumirse que toda referencia bíblica tiene una correspondencia única.

### OpenStreetMap

Puede evaluarse posteriormente para cartografía base, pero requiere cumplir atribución y condiciones de uso de mosaicos. No debe dependerse del servidor público de mosaicos para tráfico productivo sin revisar su política operativa.

### Natural Earth

Candidata para límites y fondos geográficos generales de baja resolución. Debe verificarse la versión concreta y conservar su atribución aunque sus datos sean de uso amplio.

### Fuentes cronológicas

No se aprueba todavía una cronología absoluta única. El siguiente incremento debe comparar fuentes académicas o institucionales abiertas, sus licencias y sus diferencias metodológicas antes de crear eventos fechados.

## Arquitectura recomendada

1. Mantener datos y recuperación en servidor, siguiendo el patrón `server-only` existente.
2. Aplicar RLS y mostrar únicamente filas aprobadas y habilitadas.
3. Construir primero un piloto pequeño, sin API de pago y sin importación masiva.
4. Renderizar una línea de tiempo accesible con HTML/CSS antes de adoptar una dependencia adicional.
5. Para el mapa piloto, preferir GeoJSON local aprobado y una librería libre solo después de justificar tamaño, licencia y mantenimiento.
6. Mostrar siempre fuente, atribución, precisión y certeza junto al evento o lugar.

## Primer piloto recomendado

Un piloto de Roma relacionado con Romanos y Hechos 28 es el incremento de menor riesgo porque el proyecto ya conserva contexto aprobado y una fuente Pleiades asociada. El piloto debe limitarse a:

- un lugar canónico;
- una coordenada con precisión declarada;
- dos relaciones bíblicas existentes;
- uno o dos eventos cronológicos claramente etiquetados como aproximados cuando corresponda;
- visualización dentro de las superficies de estudio existentes.

Antes de escribir datos en producción deben aprobarse el DDL, RLS, contratos de fuente, hashes, recuperación de servidor y pruebas fuera de producción.

## Conclusión

El repositorio posee una base reutilizable de fuentes, referencias, contexto, lugares en texto libre y atribución, pero carece de un modelo geográfico y cronológico normalizado. El siguiente incremento seguro es diseñar y validar fuera de producción el esquema piloto de lugares, periodos, eventos y relaciones para Roma, sin importar todavía corpus completos ni conectar estos datos a IA.
