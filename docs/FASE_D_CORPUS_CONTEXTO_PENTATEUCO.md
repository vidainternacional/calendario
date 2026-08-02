# FASE D · Bloque 4 — Corpus contextual del Pentateuco

Fecha: 2026-08-02

## Objetivo

Iniciar la cobertura contextual progresiva de toda la Biblia mediante un corpus interno verificable, sin depender de un proveedor de IA y sin fabricar texto original, transliteraciones o traducciones que todavía no hayan sido importadas y revisadas.

Este documento corresponde al lote interno 1 del Bloque 4. No cambia la fase activa ni autoriza avanzar al Bloque 5.

## Cobertura del lote

El índice canónico reconoce los 66 libros y sus 1,189 capítulos. El contenido contextual aprobado cubre los cinco libros del Pentateuco:

- Génesis;
- Éxodo;
- Levítico;
- Números;
- Deuteronomio.

La cobertura editorial se distribuye en 29 unidades:

- 5 perfiles generales de libro;
- 24 unidades narrativas, legales o literarias por rangos de capítulos.

Cualquier referencia válida dentro de Génesis–Deuteronomio puede recuperar el perfil del libro y la unidad más específica correspondiente al capítulo consultado.

## Modelo

### `public.biblical_books`

Índice canónico con:

- código;
- orden canónico;
- nombre en español e inglés;
- cantidad de capítulos;
- testamento y sección;
- idiomas originales principales;
- aliases de búsqueda;
- fuente, localizador, versión y hash;
- estado de cobertura.

### `public.biblical_context_units`

Unidades editoriales por libro, sección o capítulo con:

- resumen;
- contexto histórico;
- contexto judío;
- contexto literario;
- intención comunicativa;
- reflexión teológica;
- cautelas interpretativas;
- términos clave, pueblos y lugares;
- fuente, localizador, versión y hash.

## Recuperación

El servicio `lib/estudios/biblical-context-corpus.ts`:

1. normaliza nombres, abreviaturas y acentos;
2. reconoce referencias mediante el índice de 66 libros;
3. valida el capítulo solicitado;
4. recupera el perfil general y la unidad contextual más específica;
5. genera una versión SHA-256 del paquete recuperado;
6. devuelve estado `covered` o `indexed`.

La acción `app/actions/estudio-interno.ts` conserva la prioridad de los estudios completos ya aprobados. Cuando no existe una ficha completa, ensambla un estudio contextual determinista desde el corpus.

## Respuesta presentada

Para referencias del Pentateuco el resultado puede incluir:

- idioma original principal del libro;
- síntesis del pasaje dentro de su unidad;
- contexto histórico y judío;
- estructura y función literaria;
- términos y temas clave;
- intención comunicativa;
- cautelas sobre lo que el texto no debe usarse para afirmar;
- reflexión espiritual contextualizada.

## Límites honestos

Este lote todavía no ofrece para todos los versículos:

- el texto hebreo exacto;
- transliteración palabra por palabra;
- traducción literal propia;
- morfología completa;
- variantes manuscritas por versículo.

Cuando esos datos no existen, la aplicación lo declara explícitamente. No reconstruye palabras originales ni presenta una traducción inventada. La lectura del texto bíblico y la comparación de versiones permanecen en la Biblia estable.

## Fuente editorial

Fuente registrada:

- slug: `vida-contexto-editorial`;
- nombre: `VIDA — Corpus editorial de contexto bíblico`;
- contenido editorial original de Vida Internacional;
- idioma: español;
- licencia interna verificada;
- generación en tiempo de consulta: no;
- conexión a proveedor de IA: no.

## Seguridad

- RLS activo en ambas tablas;
- `anon` sin acceso;
- usuarios autenticados con cuenta activa solo pueden leer registros aprobados;
- fuente y libro aprobados obligatorios;
- cero políticas de escritura para clientes;
- hashes SHA-256 y localizadores obligatorios.

## Validación de datos

Resultado confirmado:

- libros aprobados: 66;
- capítulos indexados: 1,189;
- unidades contextuales: 29;
- Génesis: 5;
- Éxodo: 6;
- Levítico: 7;
- Números: 5;
- Deuteronomio: 6;
- rangos inválidos: 0;
- hashes inválidos: 0;
- políticas de escritura: 0.

## Pruebas sugeridas

- Génesis 1:1;
- Génesis 22:1;
- Génesis 45:5;
- Éxodo 3:14;
- Éxodo 20:1;
- Levítico 16:1;
- Levítico 19:18;
- Números 14:1;
- Números 27:1;
- Deuteronomio 6:4;
- Deuteronomio 30:19.

Una referencia posterior, por ejemplo Josué 1:1, debe ser reconocida por el índice pero indicar que su lote contextual todavía está pendiente.

## Siguiente lote interno

Libros históricos: Josué–Ester. Este trabajo continúa dentro del Bloque 4 y no abre todavía cronologías o mapas del Bloque 5.
