# FASE H · Bloque 1 — Contrato del lector bíblico guiado

Fecha: 2026-08-18

Estado: **ARQUITECTURA FIJADA — SIN NUEVO ESQUEMA DE DATOS**

## Objetivo

Definir cómo Hebreo Bíblico reutilizará la capa textual ya aprobada de VIDA para enseñar lectura de hebreo y arameo bíblicos sin crear un segundo lector, duplicar consultas ni fabricar traducciones o glosas inexistentes.

Este incremento es arquitectónico y documental. No modifica Supabase, RLS, grants, funciones, datos ni producción.

## Decisión principal

El futuro lector guiado de Hebreo Bíblico debe ser una **vista pedagógica del motor textual existente de Estudio Profundo**, no un motor nuevo.

La fuente pública de datos será la acción de servidor ya existente:

- `app/actions/evidencia-textual.ts` → `cargarEvidenciaTextualBiblica()`.

Esa acción delega en:

- `lib/estudios/multilingual-biblical-textual-study.ts` → `getVidaBiblicalTextualStudy()`.

El resolver multilingüe:

1. preserva un versículo con más de una lengua cuando corresponda;
2. si no existe mezcla lingüística, delega en `getResolvedBiblicalTextualStudy()`;
3. el resolver de versificación aplica los perfiles y correspondencias ya aprobados para la traducción seleccionada;
4. si no existe correspondencia especial, utiliza `getInternalBiblicalTextualStudy()`;
5. toda la recuperación continúa exigiendo sesión autenticada y registros aprobados/habilitados.

Por tanto Hebreo Bíblico no debe consultar directamente las tablas textuales desde un componente cliente.

## Traducción española

La comparación española debe reutilizar:

- `app/actions/traduccion-espanola-estudio.ts` → `cargarTraduccionEspanolaEstudio()`.

Contrato actual:

- fuente: `rv1909-ebible`;
- fuente habilitada y aprobada;
- licencia verificada;
- referencia resuelta por el parser bíblico interno;
- texto y hash por versículo;
- atribución y versión de proveedor disponibles.

La RV1909 debe presentarse como **traducción bíblica española**, nunca como “traducción literal” generada desde TAHOT.

La columna `literalTranslationEs` del corpus original permanece opcional. Para el Antiguo Testamento auditado en FASE H está vacía, por lo que la interfaz no debe inventar un reemplazo.

## Unidad inicial de lectura

La primera implementación funcional del lector guiado debe trabajar **un versículo a la vez**.

Motivos:

- el resolver textual aprobado ya tiene contrato estable a nivel de versículo;
- la versificación se resuelve con precisión antes de mostrar el texto;
- las palabras, morfemas y variantes permanecen ancladas al versículo correcto;
- una unidad breve encaja mejor con el objetivo pedagógico de FASE H;
- evita cargar capítulos completos antes de validar interacción, rendimiento y legibilidad móvil.

La navegación por capítulo podrá agregarse posteriormente como una capa de selección, sin cambiar el contrato textual subyacente.

## Idiomas incluidos

Hebreo Bíblico mostrará únicamente las ediciones originales relevantes para el Antiguo Testamento:

- `hebrew`;
- `aramaic`.

No mostrará una edición `greek` como si perteneciera al lector de hebreo.

Los segmentos arameos deben conservar su etiqueta de idioma. En referencias donde la capa aprobada contenga más de una lengua, `getVidaBiblicalTextualStudy()` es la autoridad para conservarlas en el mismo paquete.

El Nuevo Testamento original continúa identificado como griego y queda fuera del lector hebreo original.

## Capas de interfaz del lector guiado

### 1. Referencia

Mostrar siempre:

- libro;
- capítulo;
- versículo;
- referencia canónica resultante.

La referencia visible debe provenir del paquete resuelto, no reconstruirse en el cliente con supuestos propios.

### 2. Texto original

Mostrar:

- `originalText`;
- `textDirection` respetando RTL;
- idioma de la edición;
- niqqud/cantilación tal como estén presentes en la fuente aprobada.

El texto original es la capa principal.

### 3. Ayuda de transliteración

La transliteración será **opcional y ocultable**.

Puede utilizar:

- transliteración completa de la edición;
- transliteración de cada palabra/ocurrencia.

Debe etiquetarse como ayuda de lectura. El objetivo pedagógico es disminuir progresivamente la dependencia de ella.

### 4. Traducción española

La RV1909 se mostrará en una capa separada y claramente rotulada, por ejemplo:

**Traducción española · Reina-Valera 1909**

No se mezclará visualmente con:

- glosas léxicas;
- traducción literal inexistente;
- paráfrasis generada;
- interpretación teológica.

### 5. Palabras interactivas

Cada `BiblicalTextualWord` puede convertirse en un control táctil.

Al seleccionarlo se podrá mostrar, cuando exista:

- forma visible;
- transliteración de la ocurrencia;
- glosa española disponible;
- morfemas en su orden real;
- tipo de morfema: palabra, prefijo o sufijo;
- lema;
- transliteración del lema si existe;
- Strong si existe;
- categoría gramatical si existe;
- código morfológico;
- resumen morfológico.

Los campos `null` deben omitirse. La ausencia de glosa española no es un error y no autoriza generar una definición automática.

### 6. Morfemas

Los morfemas deben conservar el ensamblaje definido por el motor existente mediante:

- `joinsPrevious`;
- `joinsNext`;
- `wordGroupKey`;
- `displayWordIndex`;
- `sourceWordIndexes`.

Hebreo Bíblico no debe volver a segmentar palabras en el cliente mediante reglas heurísticas.

### 7. Variantes y procedencia

Qere/Ketiv, variantes ortográficas, omisiones, adiciones y demás evidencia textual continúan disponibles en el paquete.

En la experiencia inicial no deben dominar la pantalla. Se mostrarán como una capa secundaria, por ejemplo:

- indicador discreto de que existe una variante;
- acceso a detalle;
- enlace o acción “Ver en Estudio Profundo” para el análisis avanzado.

Nunca se reemplazará silenciosamente la lectura principal con una variante.

### 8. Fuente y versión

La experiencia debe poder exponer:

- nombre de fuente;
- proveedor;
- atribución;
- licencia/enlace cuando corresponda;
- versión del proveedor;
- versión/hash del paquete textual.

No es necesario llenar la pantalla principal con metadatos; pueden vivir en un panel de información/procedencia.

## Estados de interfaz

### Cargando

- skeleton discreto;
- conservar referencia seleccionada;
- no sustituir el texto por datos de una consulta anterior.

### Sin cobertura

Mostrar un mensaje explícito y neutral, por ejemplo:

> Aún no hay texto original aprobado para esta referencia.

No consultar una API alternativa silenciosamente y no generar contenido para rellenar el hueco.

### Traducción española no disponible

El texto original puede seguir mostrándose. La capa española indicará que la traducción aprobada no está disponible para esa referencia.

### Error

- mensaje breve;
- acción Reintentar;
- no borrar la selección actual;
- no mostrar datos parciales como si fueran completos.

## Navegación prevista

Ruta objetivo para el lector, después de validar el hub/Alef-bet:

`/estudios/hebreo/leer`

Flujo previsto:

`Estudios → Hebreo Bíblico → Leer → referencia → versículo → palabra → detalle`

Desde el detalle avanzado podrá abrirse Estudio Profundo manteniendo la misma referencia.

La ruta aún no se implementa en este documento.

## Relación con las superficies existentes

### Biblia

Continúa siendo el lector bíblico general, traducciones, audio y navegación de lectura.

### Hebreo Bíblico

Será la experiencia de aprendizaje:

- letras;
- niqqud;
- lectura guiada;
- palabras y morfemas;
- progresión pedagógica.

### Estudio Profundo

Continúa siendo la experiencia avanzada de evidencia:

- variantes;
- morfología completa;
- fuentes;
- contexto;
- concordancias y demás herramientas.

Las tres superficies comparten datos, pero tienen objetivos distintos. No se debe copiar Estudio Profundo dentro de Hebreo Bíblico.

## Seguridad y privacidad

El lector guiado conservará los controles existentes:

- sesión autenticada;
- fuentes habilitadas/aprobadas;
- políticas RLS actuales;
- recuperación únicamente por acciones/servicios de servidor.

Este contrato no requiere:

- nueva tabla;
- nueva política RLS;
- nuevos grants;
- nueva función SQL;
- `service_role` en cliente;
- almacenamiento de progreso;
- notas privadas;
- telemetría.

Si posteriormente el progreso personal o materiales administrables requieren persistencia, se diseñarán como un bloque separado con alcance, impacto y reversión antes de cualquier cambio sensible.

## Límites pedagógicos

1. No derivar significado de una palabra únicamente por Strong.
2. No derivar significado léxico o teológico por la forma pictográfica de una letra.
3. No presentar transliteración como sustituto permanente de la lectura hebrea.
4. No fabricar glosas españolas cuando la fuente no las provea.
5. No llamar “literal” a RV1909.
6. No ocultar que una porción es aramea.
7. No presentar pronunciación pedagógica futura como reconstrucción histórica exacta.
8. No identificar una traducción hebrea futura del NT como texto original.

## Primera implementación posterior a este contrato

Una vez validado visualmente el hub/Alef-bet en Preview móvil, el siguiente incremento funcional seguro podrá ser:

1. ruta `/estudios/hebreo/leer`;
2. selector simple de referencia;
3. recuperación mediante `cargarEvidenciaTextualBiblica()`;
4. filtro de ediciones hebreo/arameo;
5. texto RTL;
6. alternancia de transliteración;
7. RV1909 mediante `cargarTraduccionEspanolaEstudio()`;
8. selección de palabra y detalle de morfemas;
9. enlace a Estudio Profundo;
10. sin persistencia nueva.

## Criterio de cierre del Bloque 1

El Bloque 1 podrá considerarse listo para cierre cuando:

- la línea base de fuentes esté versionada;
- el Alef-bet y navegación inicial estén implementados en Preview;
- el contrato del lector guiado esté versionado;
- CI/build estén verdes;
- Preview esté READY y sin errores atribuibles al incremento;
- la experiencia móvil inicial de Estudios → Hebreo Bíblico → Alef-bet sea validada visualmente;
- no se haya creado infraestructura sensible innecesaria.

Cerrar el Bloque 1 no cierra FASE H. La progresión de lecciones, niqqud, lector funcional, práctica/progreso, audio y materiales administrables permanecen dentro de la fase y se abordarán únicamente según el siguiente bloque que se documente formalmente.