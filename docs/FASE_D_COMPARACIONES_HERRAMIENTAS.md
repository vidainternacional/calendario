# FASE D — Comparaciones y herramientas ampliadas

Fecha de inicio: 2026-08-01

Estado: **PRIMER INCREMENTO — INVENTARIO Y MODELO MÍNIMO**

## Objetivo

Ampliar la Biblia unificada con comparaciones estables y herramientas lingüísticas verificables, sin duplicar secciones, sin importar léxicos completos de forma prematura y sin presentar como hechos datos generados únicamente por IA.

## Inventario del sistema actual

### Comparaciones bíblicas

La Biblia ya ofrece dos modos funcionales dentro de `components/biblia/BibliaClient.tsx`:

- **Dos Biblias:** compara el mismo capítulo en dos traducciones seleccionadas;
- **Todas las versiones:** compara un solo versículo en todas las traducciones disponibles.

Estado confirmado:

- los controles están implementados en React;
- no dependen de clonación del DOM;
- conservan nombres abreviados en los botones y nombres completos en las opciones;
- la experiencia fue validada visualmente en producción.

### Herramientas de Estudio Profundo

`/estudios/profundo` organiza la respuesta de IA en once secciones, entre ellas:

- texto original;
- transliteración;
- traducción literal;
- comparación de versiones;
- análisis lingüístico.

Sin embargo, `app/actions/estudio.ts` declara expresamente que el proveedor de IA no recibe todavía léxicos, manuscritos ni documentos lingüísticos. También prohíbe inventar palabras originales, transliteraciones, etimologías o datos históricos.

Conclusión: esas secciones existen como estructura editorial, pero todavía no constituyen una herramienta lingüística verificable.

### Fuentes aprobadas actuales

El registro `public.biblical_sources` contiene fuentes de catálogo, referencias cruzadas e historia. Ninguna fuente léxica está aprobada todavía para recuperación dentro de la aplicación.

## Problema a resolver

La aplicación necesita distinguir tres capas:

1. **Texto bíblico observable:** traducción seleccionada y referencia.
2. **Datos lingüísticos verificables:** palabra original, lema, transliteración, morfología, significado y referencias vinculadas a una fuente aprobada.
3. **Explicación o reflexión:** contenido editorial o generado por IA, claramente separado de la evidencia.

No se permitirá que una respuesta de IA complete campos lingüísticos ausentes ni que una traducción editorial al español se presente como cita literal de la fuente.

## Modelo mínimo propuesto

### Tabla `biblical_lexical_entries`

Representa una entrada léxica estable.

Campos mínimos:

- `id`: UUID;
- `source_id`: fuente aprobada en `biblical_sources`;
- `language`: `hebrew`, `aramaic` o `greek`;
- `lexical_id`: identificador estable del proveedor;
- `strong_number`: identificador Strong cuando exista;
- `lemma`: forma léxica original;
- `transliteration`: transliteración publicada o verificada;
- `part_of_speech`: categoría gramatical normalizada;
- `source_gloss`: glosa breve conservada en el idioma de la fuente;
- `display_gloss_es`: glosa breve para la interfaz en español;
- `display_gloss_kind`: `source_translation`, `editorial_translation` o `editorial_summary`;
- `definition`: explicación breve y limitada;
- `source_locator`: enlace o ruta estable al registro de origen;
- `provider_version`: versión del dataset;
- `content_hash`: huella del contenido importado;
- `review_status`: `pending`, `approved` o `rejected`;
- `enabled`: control de publicación;
- marcas de creación, revisión y aprobación.

Restricción recomendada:

- unicidad por `source_id`, `language` y `lexical_id`.

### Tabla `biblical_word_occurrences`

Relaciona palabras de un pasaje con una entrada léxica.

Campos mínimos:

- `id`: UUID;
- `source_id`: fuente del texto etiquetado;
- `lexical_entry_id`: entrada léxica vinculada;
- `book_code`, `chapter`, `verse`;
- `word_index`: posición estable dentro del versículo;
- `surface_form`: forma que aparece en el texto original;
- `normalized_form`: forma normalizada para búsqueda;
- `morphology_code`: código del proveedor;
- `morphology_summary`: resumen editorial corto;
- `source_locator` y `provider_version`;
- `content_hash`;
- `review_status` y `enabled`.

Restricción recomendada:

- unicidad por `source_id`, referencia y `word_index`.

## Recuperación y seguridad

La recuperación deberá seguir las reglas de los Bloques 2 y 3:

- exclusivamente mediante servidor;
- sesión autenticada y cuenta activa;
- RLS habilitado;
- clientes con lectura de registros aprobados y sin escritura;
- fuente y registro habilitados y aprobados;
- versión del paquete calculada y visible;
- sin acceso a notas, bosquejos, biblioteca o contenido pastoral;
- sin incorporación a prompts de IA durante este bloque.

## Evaluación inicial de fuentes

### 1. STEPBible Data — candidata principal

Repositorio oficial: `https://github.com/STEPBible/STEPBible-Data`

Licencia declarada: **CC BY 4.0**.

Datasets relevantes:

- `TAHOT`: texto hebreo etiquetado;
- `TAGNT`: texto griego del Nuevo Testamento etiquetado;
- `TBESH`: léxico breve hebreo;
- `TBESG`: léxico breve griego;
- códigos expandidos de morfología hebrea y griega.

Ventajas:

- cubre Antiguo y Nuevo Testamento;
- ofrece lemas, etiquetas, referencias y léxicos compatibles;
- permite adaptación con atribución;
- usa archivos tabulares aptos para importación controlada;
- mantiene identificadores compatibles con Strong y extensiones propias.

Condiciones:

- atribuir a **STEP Bible** con enlace al proyecto;
- conservar la procedencia por dataset;
- registrar transformaciones o correcciones;
- no presentar una glosa española editorial como texto literal de la fuente.

Decisión inicial: **fuente recomendada para la primera prueba técnica**, todavía sin importar el conjunto completo.

### 2. Open Scriptures Hebrew Bible — complemento posible

Repositorio oficial: `https://github.com/openscriptures/morphhb`

Licencia para lema y morfología: **CC BY 4.0**.

Fortalezas:

- texto hebreo con lemas y morfología;
- estructura conocida y reutilizable.

Limitación:

- no resuelve por sí sola la capa griega ni todas las definiciones necesarias.

Decisión: complemento posible para verificación hebrea, no fuente única inicial.

### 3. MACULA Greek — complemento posterior

Repositorio oficial: `https://github.com/Clear-Bible/macula-greek`

Licencia declarada: **CC BY 4.0**.

Fortalezas:

- morfología, sintaxis, sentidos y anotaciones griegas;
- atribución definida.

Limitación:

- estructura más compleja de la necesaria para el primer piloto.

Decisión: evaluar después del modelo mínimo y del piloto de STEPBible.

### 4. UBS Dictionary of Biblical Hebrew

Repositorio de licencia: `https://github.com/ubsicap/ubs-open-license`

Licencia declarada: **CC BY-SA 4.0** y disponibilidad en español.

Ventaja:

- definiciones y glosas en español.

Riesgo:

- las obligaciones ShareAlike deben revisarse antes de mezclar o redistribuir el contenido dentro del producto.

Decisión: no usar en el primer incremento.

### Fuentes descartadas para el piloto

Los datasets con restricciones no comerciales no se usarán como base inicial. El primer piloto debe permitir una distribución clara de la aplicación y sus derivados sin ambigüedad de licencia.

## Primera prueba técnica propuesta

Importar únicamente un subconjunto pequeño y trazable:

- una referencia del Antiguo Testamento;
- una referencia del Nuevo Testamento;
- palabras seleccionadas, no todos los términos del versículo;
- entradas léxicas y ocurrencias estrictamente necesarias;
- atribución, licencia, versión y hash visibles.

Referencias de prueba sugeridas:

- Salmos 23:1;
- Juan 3:16.

La prueba debe confirmar:

- que el identificador del libro y la versificación coinciden con la Biblia actual;
- que cada palabra se vincula con una sola entrada válida;
- que la transliteración y la glosa se muestran sin perder procedencia;
- que el cambio de traducción no altera el texto original asociado al pasaje;
- que un pasaje sin datos muestra un estado vacío claro.

## Experiencia propuesta en Biblia → Estudio

La herramienta aparecerá dentro de la Biblia existente.

Flujo:

1. La persona selecciona un versículo o capítulo.
2. En **Estudio** aparece la sección **Palabras clave** solamente cuando existen datos aprobados.
3. Cada palabra muestra una etiqueta breve y comprensible.
4. Al tocarla se abre una ficha con:
   - palabra original;
   - transliteración;
   - lema;
   - categoría y morfología;
   - significado contextual breve;
   - otras referencias verificadas;
   - fuente, atribución y licencia.
5. La ficha distingue glosa de fuente, traducción editorial y resumen editorial.

No se añadirán marcas permanentes sobre todas las palabras del modo **Leer**. La lectura general debe conservarse limpia y funcional sin guía.

## Criterios del primer incremento

- inventario documentado;
- límite actual de la IA documentado;
- modelo mínimo definido;
- fuente principal y alternativas evaluadas;
- reglas de atribución, traducción editorial y privacidad definidas;
- ninguna importación completa realizada;
- ninguna conexión a la IA realizada.

## Siguiente bloque seguro

Crear las migraciones del modelo mínimo, registrar STEPBible Data como fuente pendiente o aprobada según la revisión final del dataset concreto, e importar únicamente el piloto limitado antes de construir la visualización.
