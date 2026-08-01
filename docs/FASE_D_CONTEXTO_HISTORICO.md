# FASE D — Contexto histórico y cultural

Fecha de inicio: 2026-07-31

Estado: **PRIMER INCREMENTO VALIDADO — PENDIENTE DE INTEGRACIÓN Y PRODUCCIÓN**

## Objetivo

Crear una capa verificable de fragmentos históricos y culturales asociados a pasajes bíblicos, sin enviar contenido privado a servicios externos y sin presentar inferencias como hechos documentados.

## Alcance de este incremento

Este primer incremento incorpora únicamente:

- modelo de datos para fragmentos contextuales;
- relación obligatoria con `biblical_sources`;
- referencia canónica por libro, capítulo y rango de versículos;
- clasificación del tipo de contexto y del tipo de contenido;
- metadatos de periodo, lugares, pueblos y temas;
- revisión y habilitación antes de lectura;
- RLS de solo lectura para cuentas activas;
- servicio exclusivo de servidor para recuperar contexto aprobado;
- versión SHA-256 abreviada del paquete recuperado.

Todavía no incorpora:

- fragmentos históricos publicados;
- comentarios completos;
- generación de IA con contexto recuperado;
- cambios en `/biblia`;
- cronologías o mapas;
- contenido privado de notas, bosquejos o biblioteca pastoral.

## Modelo de datos

Tabla: `public.biblical_context_fragments`

### Identidad y contenido

- `slug`: identificador estable;
- `title`: título editorial;
- `content`: fragmento o síntesis revisada;
- `content_kind`: `source_excerpt`, `editorial_summary` o `inference`;
- `context_type`: periodo, política, religión, costumbre social, institución, pueblo, lugar, arqueología, literatura u otro;
- `language`: idioma ISO de tres letras.

### Referencia bíblica

- `book_code`: código canónico normalizado;
- `chapter_start` y `chapter_end`: rango obligatorio de capítulos;
- `verse_start` y `verse_end`: rango opcional de versículos;
- `reference_label`: etiqueta legible para mostrar.

### Evidencia y atribución

- `source_id`: referencia obligatoria a `biblical_sources`;
- `source_locator`: URL, endpoint, sección, página o identificador estable dentro de la fuente;
- `provider_version` y `content_hash`: trazabilidad del contenido;
- la atribución y licencia se recuperan desde la fuente vinculada.

### Clasificación

- `period_label`;
- `location_names`;
- `people_groups`;
- `topics`;
- `metadata` para datos técnicos no sensibles.

### Revisión

- `review_status`: `approved`, `pending` o `rejected`;
- `enabled`;
- `approved_at` y `approved_by`.

Un fragmento no puede habilitarse si no está aprobado y no tiene fecha de aprobación.

## Seguridad

- RLS está habilitado.
- `anon` no recibe privilegios.
- `authenticated` recibe únicamente `SELECT`.
- La cuenta debe estar activa.
- Solo se leen fragmentos habilitados y aprobados.
- La fuente relacionada también debe estar habilitada y aprobada.
- No existen políticas de escritura para clientes.
- Las inserciones y revisiones iniciales se realizarán mediante migraciones versionadas o una futura acción administrativa protegida.

## Servicio de recuperación

Archivo: `lib/estudios/biblical-context.ts`

Funciones:

- `listarContextoBiblicoParaReferencia()`;
- `obtenerFragmentoContextoBiblico()`.

El servicio:

- se ejecuta exclusivamente en servidor;
- exige sesión autenticada;
- valida libro, capítulo, versículo y límite;
- consulta únicamente fragmentos aprobados;
- aplica RLS y exige una fuente aprobada;
- filtra rangos de versículos de forma determinista;
- devuelve atribución y licencia de la fuente;
- calcula una versión del paquete recuperado;
- no consulta notas, bosquejos, biblioteca, paquetes ni contenido pastoral.

## Validación ejecutada

### Base de datos

Migración aplicada en Supabase: `contexto_historico_biblico`.

Se confirmó:

- tabla creada correctamente;
- RLS habilitado;
- `anon` sin `SELECT`;
- `authenticated` con `SELECT` y sin `INSERT`, `UPDATE` ni `DELETE`.

### Matriz de seguridad

La prueba se ejecutó dentro de una transacción revertida, usando fragmentos temporales y una cuenta activa:

1. La cuenta activa ve únicamente el fragmento aprobado vinculado a una fuente aprobada. — CORRECTO
2. El fragmento pendiente permanece oculto. — CORRECTO
3. El fragmento aprobado vinculado a una fuente pendiente permanece oculto. — CORRECTO
4. La inserción desde `authenticated` está bloqueada. — CORRECTO
5. La actualización desde `authenticated` está bloqueada. — CORRECTO

Resultado: **5 de 5 comprobaciones correctas**. No quedaron fragmentos ni cambios temporales.

### Asesor de seguridad

No se generaron advertencias nuevas asociadas a `biblical_context_fragments`. Los avisos existentes corresponden a tablas, funciones, Storage y configuración de autenticación anteriores, fuera del alcance de este bloque.

### Preview

- commit: `fabb7f29871dd89a8dfaec6c7a64940a1c6b0332`;
- deployment: `dpl_28Vy1JuCrHoZ8TKAQyDuBJw2XxSe`;
- estado: `READY`;
- Next.js 16.2.10 compiló correctamente;
- TypeScript terminó sin errores;
- páginas generadas: 32 de 32.

## Regla para el siguiente incremento

Antes de publicar fragmentos se debe:

1. seleccionar una fuente académica o primaria con licencia compatible;
2. registrar y aprobar esa fuente en `biblical_sources`;
3. conservar un localizador verificable por fragmento;
4. diferenciar cita, resumen editorial e inferencia;
5. validar atribución, licencia y revisión en producción.

La integración con la IA permanece bloqueada hasta que existan fragmentos aprobados y una visualización verificable para el usuario.
