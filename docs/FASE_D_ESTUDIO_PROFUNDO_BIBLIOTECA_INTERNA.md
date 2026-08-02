# FASE D — Estudio Profundo basado en biblioteca interna

Fecha: 2026-08-01

Estado: **SEGUNDO INCREMENTO IMPLEMENTADO — VALIDACIÓN FUNCIONAL EN CURSO**

## Decisión de producto

El módulo deja de presentarse como “Estudio con IA” o “Estudio Profundo (IA)” y adopta el nombre único **Estudio Profundo**.

La inteligencia artificial no es la fuente ni la autoridad del estudio. La arquitectura objetivo es:

1. recuperar contenido aprobado desde la biblioteca interna;
2. mostrar procedencia, licencia, localizador, versión y hash;
3. distinguir evidencia textual, contexto histórico, interpretación, teología y reflexión espiritual;
4. permitir asistencia automática únicamente como organizador opcional de evidencia disponible;
5. reconocer expresamente cuando no exista información suficiente.

## Primer incremento de interfaz

- elimina “(IA)” del título de la página;
- cambia la presentación principal a biblioteca interna verificable;
- añade tres niveles conceptuales de profundidad: breve, completo y avanzado;
- documenta una metodología académica mínima;
- documenta reglas de honestidad y límites;
- agrupa el detalle metodológico en paneles desplegables;
- conserva los componentes actuales de fuentes aprobadas, contexto histórico y estudio;
- no conecta los datos léxicos o históricos a un proveedor de IA;
- no importa libros completos ni contenido con licencia pendiente.

Preview del incremento:

- commit: `e3a7f36a83f4b5199bfde3b0e62d445b491fd50f`;
- deployment: `dpl_E8EtHWMp9deeF2gBofNKyp1SYdpj`;
- estado: `READY`;
- PR: #29.

## Segundo incremento: modelo de biblioteca verificable

La base de datos incorpora dos tablas aditivas y vacías. No se ha importado ninguna obra ni fragmento.

### `public.biblical_library_items`

Representa una obra o recurso verificable antes de almacenar contenido recuperable.

Campos principales:

- fuente registrada en `biblical_sources`;
- slug, título, autor y tipo de recurso;
- idioma, año, edición y descripción;
- localizador estable;
- estado de licencia por recurso;
- versión y hash de integridad;
- estado de revisión, activación y aprobación;
- metadatos técnicos no sensibles.

Tipos iniciales autorizados:

- comentario;
- nota de estudio;
- diccionario;
- artículo;
- manuscrito;
- conjunto de referencias cruzadas;
- otro recurso explícitamente clasificado.

### `public.biblical_library_fragments`

Representa una unidad pequeña y recuperable vinculada obligatoriamente a una obra y a su fuente.

Campos principales:

- título y contenido;
- clase de contenido: cita de fuente, resumen editorial o inferencia;
- idioma;
- referencia bíblica opcional con rango de capítulos y versículos;
- temas;
- localizador dentro de la obra;
- versión y hash;
- revisión, activación y aprobación.

La clave foránea compuesta impide asociar un fragmento a una fuente distinta de la fuente de su obra.

## Seguridad aplicada

- RLS habilitado en ambas tablas;
- `anon` sin privilegios;
- `authenticated` con `SELECT` únicamente;
- no existen políticas de escritura para clientes;
- solo son visibles registros habilitados y aprobados;
- los recursos requieren licencia `verified` o `varies_by_item`;
- la fuente superior también debe estar habilitada y aprobada;
- la cuenta autenticada debe permanecer activa;
- los fragmentos solo son visibles cuando su obra superior también es válida.

Validación inicial en base de datos:

- dos tablas creadas;
- RLS activo en ambas;
- `anon_select = false`;
- `authenticated_select = true`;
- una política `SELECT` por tabla;
- cero obras importadas;
- cero fragmentos importados.

Migración aplicada y versionada:

- `20260802051917_biblioteca_biblica_verificable.sql`.

## Servicio de recuperación

Archivo: `lib/estudios/biblical-library.ts`.

Funciones iniciales:

- `listarRecursosBibliotecaAprobados()`;
- `listarBibliotecaParaReferencia()`.

El servicio:

- se ejecuta exclusivamente en servidor;
- exige sesión autenticada;
- vuelve a filtrar estado, activación y licencia además de RLS;
- recupera únicamente fragmentos vinculados a la referencia solicitada;
- limita el número de resultados;
- normaliza fuente, obra y fragmento a tipos estables;
- genera una versión SHA-256 abreviada del paquete;
- no consulta notas privadas, bosquejos, biblioteca pastoral ni perfiles;
- todavía no se conecta al prompt ni al proveedor de IA.

## Proceso autorizado de incorporación

Cada futura incorporación debe seguir este orden:

1. registrar o verificar la fuente superior en `biblical_sources`;
2. revisar licencia, obligaciones de atribución y permiso de almacenamiento;
3. registrar la obra en `biblical_library_items` como deshabilitada y pendiente;
4. calcular versión y hash del recurso original;
5. dividir únicamente el contenido autorizado en unidades pequeñas;
6. conservar página, sección, URL o identificador en `source_locator`;
7. clasificar cada unidad como cita, resumen editorial o inferencia;
8. vincularla a una referencia bíblica solamente cuando la relación sea justificable;
9. revisar doctrina, fidelidad, traducción y atribución;
10. aprobar y habilitar mediante migración versionada o futura herramienta administrativa protegida;
11. validar RLS, conteos, hashes, interfaz y ausencia de exposición a `anon`;
12. conectar a la experiencia de estudio solo después de una prueba aislada.

No se permite:

- cargar PDFs completos como si fueran evidencia indexada;
- importar obras comerciales sin licencia expresa;
- habilitar automáticamente contenido recién descargado;
- mezclar inferencias editoriales con citas de fuente;
- enviar fragmentos a IA antes de documentar privacidad, costo y trazabilidad.

## Metodología objetivo

Cada estudio podrá incorporar, cuando exista cobertura aprobada:

- texto original;
- transliteración;
- traducción literal;
- traducción interpretativa;
- comparación de traducciones;
- variantes textuales;
- contexto histórico, cultural, político y religioso;
- palabras clave y expresiones idiomáticas;
- estructura literaria;
- intención probable del autor;
- lectura teológica identificada;
- afirmaciones que el pasaje no realiza;
- debates académicos y límites de certeza;
- reflexión espiritual no manipulativa.

## Fuentes previstas

Texto Masorético, Septuaginta, Peshitta, Nuevo Testamento griego, Vulgata, Manuscritos del Mar Muerto, códices principales, léxicos y literatura histórica podrán incorporarse gradualmente. Mencionarlos como objetivo no significa que su contenido completo esté ya disponible ni autorizado.

Léxicos comerciales como HALOT, BDAG y otras obras protegidas requieren licencia expresa antes de almacenar o reproducir su contenido.

## Reglas de honestidad

- no derivar significados únicamente de Strong;
- no afirmar que todo el Nuevo Testamento tuvo necesariamente un original arameo;
- no presentar variantes como corrupción intencional sin evidencia;
- no sustituir el contexto original con Cábala, gematría, Midrash o tradición posterior;
- identificar PaRDeS y lecturas místicas como marcos interpretativos posteriores;
- separar hechos, hipótesis, interpretación teológica y reflexión;
- no prometer milagros, profecías personales ni respuestas divinas;
- indicar los debates académicos y la insuficiencia de evidencia.

## Estado de Fase D

Este incremento permanece dentro del **Bloque 4 — Comparaciones y herramientas ampliadas**.

No activa el Bloque 5 ni modifica el estado del documento maestro. Antes de incorporar contenido real se debe completar la validación del servicio, seleccionar una fuente inicial compatible y construir una visualización funcional aislada.
