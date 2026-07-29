# FASE D — Diagnóstico y arquitectura de IA Bíblica Avanzada

Fecha: 2026-07-29

Estado: **BLOQUE 1 EN VALIDACIÓN TÉCNICA**

## Objetivo del bloque

Determinar el estado real de Biblia, Comparar, Notas y Estudio Profundo; identificar riesgos; y definir una arquitectura que permita agregar fuentes, contexto histórico, cronologías, mapas e IA sin deteriorar las funciones estables.

## Inventario actual

### Biblia general

Ruta: `/biblia`

Base principal:

- `app/(app)/biblia/page.tsx`
- `components/biblia/BibliaClient.tsx`
- `components/biblia/BibleNotesWorkspace.tsx`

Funciones disponibles:

- lectura por traducción, libro, capítulo y versículo;
- traducciones en español y una selección en inglés;
- comparación paralela de dos traducciones;
- favoritos por cuenta;
- audio mediante `speechSynthesis` del navegador;
- temas claro, sepia y oscuro;
- notas bíblicas;
- envío contextual a Estudio Profundo;
- integración con proyectos pastorales.

Proveedor bíblico actual:

- Free Use Bible API de HelloAO;
- acceso mediante archivos JSON estáticos;
- traducciones, libros y capítulos se cargan desde el navegador.

### Notas bíblicas

- Las notas nuevas de Biblia se guardan únicamente en `localStorage` con la clave `vida-biblia-notas-v2`.
- Pueden relacionarse visualmente con un paquete pastoral.
- No se sincronizan entre dispositivos ni cuentan con respaldo del servidor.
- No deben enviarse a un proveedor de IA sin una acción explícita de la persona.

### Estudio Profundo

Ruta: `/estudios/profundo`

Base principal:

- `components/estudios/EstudioProfundoClient.tsx`
- `app/actions/estudio.ts`
- tablas `estudios_profundos_ia`, `notas_estudio` y `app_settings`.

El resultado se organiza en once secciones:

1. texto original;
2. transliteración;
3. traducción literal;
4. traducción interpretativa;
5. comparación de versiones;
6. contexto histórico;
7. análisis lingüístico;
8. mensaje interpretativo;
9. qué no significa;
10. explicación;
11. reflexión.

## Hallazgos críticos

### 1. Modelo retirado

La acción utilizaba directamente `gemini-2.0-flash`. Google apagó los modelos Gemini 2.0 Flash el 1 de junio de 2026. Por lo tanto, los estudios nuevos no podían completarse con esa configuración.

Decisión:

- usar `GEMINI_MODEL` como configuración de entorno;
- utilizar `gemini-3.6-flash` como valor predeterminado vigente;
- rechazar explícitamente identificadores retirados conocidos;
- conservar la capacidad de cambiar el modelo sin modificar código.

Referencias oficiales:

- https://ai.google.dev/gemini-api/docs/deprecations
- https://ai.google.dev/gemini-api/docs/changelog

### 2. Promesa de fuentes sin recuperación real

El prompt anterior afirmaba utilizar textos originales, manuscritos y léxicos académicos, pero la solicitud solo enviaba al modelo la referencia escrita por el usuario. No existía recuperación de documentos, fragmentos ni citas.

Riesgo:

- el modelo podía presentar datos generados de memoria como si hubieran sido consultados;
- no era posible auditar la procedencia de una afirmación histórica o lingüística;
- la interfaz podía crear una confianza académica mayor que la evidencia disponible.

Decisión:

- prohibir citas, variantes, etimologías y datos inventados;
- exigir que la incertidumbre se indique dentro de cada sección;
- mostrar en la interfaz que la capa de fuentes verificables está en desarrollo;
- no considerar la salida actual como investigación académica citada.

### 3. Respuesta débilmente validada

La respuesta se solicitaba como JSON, pero no incluía un esquema explícito y solo se aplicaba `JSON.parse`.

Corrección del primer incremento:

- esquema JSON con once propiedades obligatorias;
- propiedades adicionales deshabilitadas;
- validación de que cada sección exista y contenga texto;
- rechazo de respuestas vacías o incompletas.

### 4. Caché sin versión de modelo, prompt o fuentes

El caché se consultaba únicamente por una normalización básica del pasaje. Un resultado antiguo podía seguir apareciendo después de cambiar el modelo, el prompt o la fuente de datos.

Corrección del primer incremento:

- columnas `modelo`, `prompt_version` y `source_version`;
- índice compuesto para recuperar la versión correcta;
- historial y cuota indexados por persona y fecha;
- el caché actual se identifica como `sin-recuperacion-v1`.

### 5. Propiedad de inserción insuficiente

La política anterior permitía insertar a una cuenta activa sin exigir que `generado_por` fuera su propio identificador.

Corrección del primer incremento:

- `generado_por` es obligatorio;
- RLS exige `generado_por = auth.uid()`;
- las lecturas compartidas del caché no exponen notas privadas dentro del resultado.

### 6. Errores internos visibles

La acción devolvía al usuario el mensaje técnico completo recibido del proveedor.

Corrección:

- el detalle se conserva únicamente en registros del servidor;
- la interfaz recibe un mensaje general recuperable.

### 7. Cuota basada en resultados guardados

El límite diario cuenta estudios generados y almacenados, no intentos fallidos. Una serie de fallos del proveedor podría consumir cuota externa sin quedar registrada.

Decisión:

- mantener el límite actual durante el primer incremento;
- diseñar un registro independiente de solicitudes antes de abrir el uso avanzado a más personas;
- no bloquear el diagnóstico por este punto.

### 8. Fragmentación de notas

Existen dos mecanismos diferentes:

- notas de Biblia en `localStorage`;
- notas de Estudio Profundo en Supabase.

Decisión:

- no migrar ni mezclar notas durante el Bloque 1;
- diseñar una migración optativa y reversible más adelante;
- ninguna nota privada será enviada automáticamente a IA.

## Capacidades de la fuente bíblica actual

HelloAO ya publica, además de traducciones:

- comentarios bíblicos;
- conjuntos de datos;
- referencias cruzadas;
- metadatos de sitio, licencia y notas de licencia;
- descargas completas en formatos reutilizables.

Esto permite construir una primera capa verificable sin contratar otra API y sin permitir que el modelo invente la procedencia.

Referencias oficiales:

- https://bible.helloao.org/docs/guide/getting-started.html
- https://bible.helloao.org/docs/reference/

## Arquitectura aprobada

### Capa 1 — Texto bíblico

Responsabilidad:

- obtener el pasaje y las traducciones seleccionadas;
- conservar el identificador de traducción;
- mostrar atribución y licencia de la traducción;
- no modificar el comportamiento estable de `/biblia`.

Fuente inicial: HelloAO.

### Capa 2 — Fuentes verificables

Responsabilidad:

- registrar cada fuente con identificador, nombre, tipo, idioma, sitio, licencia y versión;
- recuperar únicamente fragmentos relacionados con el pasaje;
- conservar la referencia exacta de cada fragmento;
- distinguir comentario, referencia cruzada, perfil, dato histórico y texto bíblico.

Primera fuente candidata:

- comentarios y dataset `open-cross-ref` disponibles en HelloAO.

Toda fuente deberá aprobarse antes de aparecer como disponible.

### Capa 3 — Paquete de evidencia

Antes de llamar a IA, el servidor construirá un paquete que incluya:

- referencia normalizada;
- texto bíblico utilizado;
- traducciones comparadas;
- fragmentos recuperados;
- identificador y licencia de cada fuente;
- versión del conjunto de fuentes.

El paquete no incluirá notas bíblicas, notas de estudio, bosquejos ni contenido pastoral privado salvo una futura acción explícita y confirmada.

### Capa 4 — Síntesis mediante IA

La IA podrá:

- organizar la evidencia;
- resumir coincidencias y diferencias;
- explicar vocabulario cuando exista evidencia proporcionada;
- señalar incertidumbre;
- generar una reflexión separada del análisis.

La IA no podrá:

- atribuir una fuente no incluida;
- inventar texto original, variantes o fechas;
- presentar una inferencia como dato histórico;
- publicar automáticamente un estudio;
- acceder por defecto a notas privadas.

### Capa 5 — Resultado trazable

El futuro resultado versionado deberá guardar:

- modelo;
- versión del prompt;
- versión de fuentes;
- secciones estructuradas;
- citas utilizadas por sección;
- fecha de generación;
- estado de revisión humana;
- consumo estimado del proveedor.

## Modelo de datos propuesto para el siguiente bloque

### `biblical_sources`

Registro de fuentes aprobadas:

- `id`;
- `slug`;
- `name`;
- `source_type`;
- `language`;
- `website`;
- `license_url`;
- `license_notes`;
- `provider`;
- `provider_version`;
- `enabled`;
- timestamps.

### `biblical_source_entries`

Índice local o caché de fragmentos recuperables:

- fuente;
- libro, capítulo y rango de versículos;
- título o asunto;
- contenido;
- referencia externa;
- hash y versión.

No se importará contenido completo hasta confirmar licencia, volumen y necesidad.

### Resultado de estudio ampliado

El JSON futuro añadirá metadatos sin romper las once secciones actuales:

- `citations` por sección;
- `warnings`;
- `evidence_version`;
- `review_status`.

## Flujo objetivo

1. La persona elige un pasaje desde Biblia o lo escribe.
2. El servidor valida y normaliza la referencia.
3. Se recupera el texto bíblico y su atribución.
4. Se obtienen comentarios o referencias cruzadas aprobadas.
5. Se crea el paquete de evidencia.
6. La IA sintetiza únicamente ese paquete.
7. El servidor valida estructura y citas.
8. Se guarda un resultado versionado.
9. La interfaz diferencia texto, fuente, inferencia y reflexión.
10. La persona revisa antes de compartir o usar el contenido para enseñar.

## Primer incremento implementado

- modelo configurable y rechazo de modelos retirados;
- valor predeterminado `gemini-3.6-flash`;
- esquema JSON obligatorio;
- validación de las once secciones;
- prompt responsable que prohíbe fuentes inventadas;
- límite de longitud de entrada;
- errores internos ocultos al usuario;
- caché versionado;
- índices para caché y cuota;
- RLS de inserción vinculada a la cuenta autenticada;
- aviso visible de que las citas verificables todavía están en desarrollo.

## Riesgos pendientes antes de IA con fuentes

- definir el parser canónico de referencias bíblicas en español;
- revisar las licencias de cada comentario concreto;
- diseñar el registro de intentos y consumo;
- establecer límites de fragmentos y tokens;
- decidir qué fuentes serán doctrinales, históricas o solo comparativas;
- crear pruebas contra citas inexistentes;
- revisar la edición del prompt almacenado en `app_settings`.

## Decisión de avance

El Bloque 1 podrá marcarse completado cuando:

- la rama compile y TypeScript termine correctamente;
- la migración quede verificada;
- el preview no presente errores de ejecución;
- el documento maestro registre el siguiente bloque activo.

No se implementarán contexto histórico, cronologías, mapas ni nuevas fuentes dentro del Bloque 1.
