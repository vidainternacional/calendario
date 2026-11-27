# Auditoría del estudio bíblico — 26 de noviembre de 2026

## Actualización posterior: mejora autorizada

Después de entregar esta auditoría, el usuario autorizó iniciar el bloque de búsqueda fiel, referencias y prevención. La implementación se encuentra en la rama de PR #322, pendiente de validación en el Preview y sin producción. El resto de este documento conserva los hallazgos anteriores como línea base; no significa que todos sigan sin intervenir.

- Implementados: coincidencias de palabras completas y cobertura de la consulta para respuesta directa; alternativas no equivalentes por elección explícita; conservación de la pregunta; rangos completos con distintos guiones y capítulos; verificación editorial de existencia; mensajes separados para indisponibilidad; paginación y recuperación de la consulta tras enviar el formulario. Las capas léxicas/originales siguen siendo individuales y no se presentan como si cubrieran un rango completo.
- Prevención: fixture de 34 temas/305 alias editoriales, sin datos personales, y 32 casos nuevos en `tests/regression/estudio-prevencion-errores.test.mjs`; CI ya recoge el archivo mediante su glob. No se crea almacenamiento de conversaciones ni entrenamiento automático.
- Ajustada la detección analítica existente de la etiqueta de resultados textuales, sin añadir eventos o datos. No se reactiva una campaña piloto.
- Verificación del bloque: 77 pruebas relacionadas correctas; build/TypeScript correctos; Chromium 320/390/820 con React real y servidor controlado, incluyendo rangos, error y consulta conservada. No se afirma prueba autenticada remota.
- Conjunto general: 771 pruebas, 762 pasan y 9 fallan. Esos mismos nueve fallos se reprodujeron en el HEAD anterior (33 pruebas de los seis archivos afectados: 24 pasan/9 fallan). Son middleware, dos refrescos de Avisos, shell/versionado offline, dos contratos del panel del líder, Para ti/atención pastoral, transición del tema de Biblia y acceso de responsabilidad de paleta. Se conservan como deuda previa; no se cambiaron esas superficies ni sus pruebas para que pasen.
- Pendientes fuera de este bloque: retorno garantizado desde el cuaderno/historial privado, simplificación visual y explicaciones asistidas nuevas. Sus datos, permisos, diseño y funcionamiento no se modifican automáticamente por esta aprobación.

El deployment final y su SHA se registran en https://github.com/vidainternacional/calendario/pull/322, reutilizando el mismo enlace de revisión. La producción necesita autorización nueva.

## Alcance y estado

Solicitud: revisar el estudio completo, encontrar errores y optimizaciones, mejorar comprensión y facilidad de uso, y explicar ventajas y desventajas. Esta entrega es una auditoría: no introduce reglas nuevas ni cambia código funcional, datos, permisos, corpus, diseño o producción. No modifica el maestro ni cierra fases.

Base examinada: rama `agent/estudio-busqueda-fiel-20261126`, HEAD local `ed8bdd86`; cambios funcionales de PR #322 en `6a4fd9a74457d4f26fd111ce7bb1c9684bfd1bb6`. Producción conocida: PR #321, main `6db8d0cd7312e73727cd3e29a112bb46fb852e36`. PR #322 sigue separado de producción. Los recibos de despliegue anteriores no son una nueva validación autenticada.

## Fuentes y comprobaciones

- Lectura de la ruta activa `/estudios/profundo`, acciones, resolución de referencias, concordancias, búsqueda textual, asistencia IA, analítica, metodología y enlace al cuaderno.
- Consultas editoriales de solo lectura en Neon B `curly-scene-97670657`: 66 libros aprobados; 31,084 textos RV1909; 1,189 capítulos canónicos y cobertura contextual de los 1,189; 34 temas y 305 alias aprobados. Cobertura contextual significa disponibilidad de unidades de contexto, no certificación exegética individual de cada versículo.
- Índice editorial real de temas/alias descargado temporalmente para ejecutar el buscador original con dependencias controladas. No se leyeron notas ni filas personales. Las ocurrencias de la prueba de integración son fixtures; separadamente se confirmó que los temas afectados tienen ocurrencias aprobadas reales: Amor 9, Matrimonio 5, Obediencia 5 y Palabras y comunicación 5.
- Pruebas ejecutadas: 45/45 de diez archivos de regresión relacionados con estudio, búsqueda, contexto, cuaderno, sincronización, IA y léxico. Parte son verificaciones estáticas; no sustituyen recorridos de usuarios reales. Los casos nuevos siguientes revelan huecos que esas pruebas no detectaban.
- Evidencia temporal local: `/tmp/vida-audit-probe.mjs`, `/tmp/vida-audit-probe-results.json`, `/tmp/vida-audit-tests.log`. No contiene contraseñas ni información personal; estos archivos temporales no garantizan continuidad entre entornos.

## Hallazgos prioritarios reproducidos

### 1. Coincidencias parciales cambian el tema — alta

`lib/estudios/biblical-concordance.ts`, función `scoreCandidate`, asigna puntuación alta mediante `includes` y `startsWith`, incluso dentro de otra palabra. La acción activa acepta estos resultados antes de consultar el texto bíblico.

Resultados ejecutando el módulo real con el índice editorial real:

| Consulta | Temas seleccionados por el buscador |
| --- | --- |
| `ira` | Palabras y comunicación, puntuación 95: coincide dentro de «mentira» |
| `clamor` | Amor, puntuación 95 |
| `amor y odio` | Amor 115 y Matrimonio 25; no aborda íntegramente ambos conceptos |
| `¿Qué dice la Biblia sobre odiar a alguien?` | Obediencia 16 |
| `odio` | Ninguno en el índice temático; puede alcanzar la nueva búsqueda textual |

La integración controlada con `app/actions/estudio-interno.ts` devolvió éxito de concordancia para los cuatro primeros casos sin alcanzar la búsqueda textual. No es una captura de una sesión real. **El arreglo previo de PR #322 resuelve la sustitución automática por temas relacionados, pero todavía no garantiza fidelidad para todas las preguntas naturales.** Sus mocks de concordancia vacía no cubrían este solapamiento real.

Propuesta antes/después: coincidencia parcial dentro de otra palabra → coincidencia de palabras completas, separación explícita entre resultado directo y relacionado, sin descartar la parte restante de una pregunta. Si no hay evidencia directa suficiente, explicar el límite y ofrecer alternativas elegibles. Conservar formas flexionadas, tildes, referencias, lugares y alias editoriales válidos; definir ejemplos de negación y consultas compuestas antes de cambiar sus reglas.

Ventaja: respuestas pertinentes, preservación de la intención. Riesgo: un umbral más estricto puede perder consultas legítimas; se necesita una matriz de términos reales, no solo ejemplos artificiales. No endurecer globalmente el buscador sin validación específica. Reversión: cambio aislado del resolvedor y su orden de consulta; sin migración de datos.

### 2. Rangos truncados o rechazados — alta

`parseInternalBibleReference` en `lib/estudios/biblical-context-corpus.ts` acepta un extremo final con guion pero no lo conserva. La normalización elimina el guion largo antes del patrón de referencia.

| Entrada | Salida real del parser |
| --- | --- |
| `Juan 3:16` | Juan 3:16 |
| `Juan 3:16-18` | Juan 3:16 |
| `Juan 3:16–18` | Sin referencia reconocida |
| `Juan 3-4` | Juan 3 |

`app/actions/traduccion-espanola-estudio.ts` filtra un único versículo cuando existe `reference.verse`; no tiene extremo final. Por tanto, aceptar un rango no equivale a estudiar todo ese rango.

Propuesta: conservar y validar inicio/final, soportar guiones habituales y mostrar exactamente el alcance recuperado. Definir un límite visible para varios capítulos y ofrecer continuación sin truncamiento silencioso. Ventaja: lectura fiel. Riesgo: pasajes grandes aumentan carga y volumen; no enviar cientos de versículos a IA automáticamente. Reversión: parser/lecturas aislados, sin editar textos.

### 3. Referencias inexistentes pueden mostrarse como estudio — alta

El parser valida capítulo contra el libro, pero versículo solo entre 1 y 200: acepta `Juan 3:99`, mientras rechaza `Juan 22:1`. Con contexto de capítulo disponible y sin texto español, la acción puede devolver `success`, `study`, pasaje `Juan 3:99`. Se reprodujo esa ruta con contexto controlado; no se afirma una prueba autenticada en producción.

Propuesta: comprobar existencia del versículo en el corpus aprobado antes de presentar un estudio de ese versículo. Si el lector falla, diferenciar indisponibilidad de referencia inexistente. Ventaja: evita una apariencia de evidencia que no existe. Riesgo: una avería del servicio no debe convertirse en un falso «versículo inexistente». Reversión: validación aislada, sin cambios editoriales.

## Continuidad, claridad y uso móvil

### 4. Historial y retorno al cuaderno — media

El historial de la ruta activa delega en `app/actions/estudio.ts`, que consulta `estudios_profundos_ia` por `generado_por`. La acción activa interna no escribe allí; la escritura identificada está en el generador anterior. Por ello, las búsquedas internas actuales no alimentan ese historial por esta ruta. No se inspeccionó el historial privado de usuarios ni se certificaron posibles escritores externos.

El enlace al cuaderno es fijo `/biblia/notas`; el retorno del cuaderno apunta a `/estudios`, no a la consulta original. El componente de estudio conserva la consulta en estado React y no implementa persistencia propia para restaurar un desmontaje. El caché del navegador puede conservar determinados retornos, pero no es una garantía de continuidad.

Las notas sí cuentan con identificación de origen `estudio_profundo`, referencia y filtro correspondiente en el cuaderno: conservarlos. No es necesario duplicarlas en una nueva tabla para encontrarlas.

Propuesta: volver explícitamente al mismo estudio y ofrecer recientes privados por usuario, con limpieza y separación de cuentas. Ventaja: evita repetir trabajo. Riesgo: no persistir consultas sensibles en almacenamiento compartido; cualquier cambio de almacenamiento o tabla requiere alcance específico y reversión. No cambiar ahora RLS.

### 5. La presentación promete más niveles de los implementados — media

`MetodologiaEstudioProfundo.tsx` muestra Breve/Completo/Avanzado como artículos informativos, no como un selector funcional. También habla de contexto «inicial» y «piloto léxico». Revisar ese texto frente al alcance efectivamente habilitado; corpus migrado completo no significa que todas las funciones académicas propuestas estén disponibles.

Propuesta: resumen inicial claro — pasaje o tema, explicación sencilla, evidencia y aplicación identificada — y mantener los detalles avanzados desplegables. Aclarar el alcance real de cada modo antes de añadir selectores. Ventaja: facilita teléfono y lectura. Riesgo: un rediseño puede alterar la organización aprobada; presentar un único Preview y conservar controles/notas/fuentes existentes. Es una propuesta, no un diseño aprobado.

## Calidad de las respuestas e IA

La ruta activa trabaja principalmente con corpus interno, concordancias y contexto editorial. `internal-study.ts` contiene dos estudios específicos preparados, Salmos 23:1 y Juan 3:16; otros pasajes cubiertos se ensamblan a partir de contexto de libro/sección y evidencia textual disponible. No significa que solo haya dos pasajes legibles ni que el resto de la Biblia falte.

El generador de `app/actions/estudio.ts` no es el analizador importado por la pantalla actual. La IA activa ayuda sobre todo a interpretar búsquedas; no debe describirse la experiencia como si cada consulta recibiera una explicación nueva y personalizada de un modelo. El contexto general está identificado en el ensamblado, pero no siempre responde con precisión a una pregunta particular sobre un versículo.

Propuesta: primero resolver correctamente pregunta y evidencia; después, si se aprueba, añadir explicación sencilla fundamentada en los pasajes recuperados, citas comprobables y distinción entre texto, interpretación y aplicación. No modificar criterios doctrinales ni sustituir preguntas por recomendaciones pastorales. Ventaja: más comprensible y útil. Costes/riesgos: latencia, consumo de proveedor y posibilidad de respuestas no respaldadas; requiere límites, evaluación y presupuesto explícito antes de activar servicios de pago. No se llamó a modelos de pago para esta auditoría ni se cambiaron proveedores.

## Rendimiento y errores

- La acción inicial ejecuta en paralelo evidencia textual, contexto y traducción; esas rutas repiten resolución del libro e identificación de sesión. Los temas derivados del contexto pueden disparar hasta diez búsquedas que vuelven a cargar índices de temas/alias. Propuesta: compartir resultados editoriales dentro de la misma petición, manteniendo autenticación y separación de usuarios. Ventaja: menos trabajo repetido; riesgo: un caché global mal diseñado podría mezclar datos personales. No se midió una mejora de tiempo ni se promete un porcentaje de ahorro.
- El cliente Neon ya usa transacciones de lectura y caché editorial de 300 segundos: conservarlos; nunca cachear notas como si fueran corpus público.
- La búsqueda textual devuelve lista vacía tanto ante determinados errores como cuando no hay coincidencias. Propuesta: distinguir sin resultados de servicio temporalmente indisponible, permitir reintento y conservar consulta. Ventaja: evita diagnósticos falsos. Riesgo: no exponer mensajes SQL ni detalles internos.
- La nueva búsqueda textual limita lectura a 80 filas y muestra como máximo 12 coincidencias; no equivale a una concordancia exhaustiva. Explicar el alcance y evaluar continuación antes de prometer todas las apariciones.
- El router IA tiene tiempos máximos por proveedor, pero los reintentos son secuenciales: el tiempo total puede sumar varios intentos. Revisar presupuesto total de espera sin cambiar modelos, gastos o política de fallback silenciosamente.

## Analítica: regresión adicional de PR #322 — media

`StudyAnalyticsTracker.tsx` detecta resultados leyendo etiquetas exactas del DOM. Solo reconoce «Concordancias internas»; el nuevo resultado textual muestra «Pasajes del texto bíblico». Ese resultado no queda reconocido por esa rama del detector. Las sugerencias nuevas también deben revisarse frente a la etiqueta anterior «Ayuda de búsqueda». No se activó ni reactivó ninguna campaña piloto y no se inspeccionaron eventos personales.

Propuesta: contrato explícito de tipo/estado del resultado para analítica, independiente del texto visible. Ventaja: cambiar una etiqueta no rompe medición. Riesgo: conservar la minimización de datos y los permisos actuales; no ampliar seguimiento para resolverlo. Incluir este caso antes de considerar listo PR #322.

## Orden recomendado y criterio de cierre

1. Fidelidad: corregir coincidencias parciales y preguntas compuestas; revalidar odio en preguntas naturales con el índice editorial real. Conservar selección explícita de relacionados.
2. Integridad de referencias: rangos, guiones, existencia y mensajes de indisponibilidad; comprobar AT y NT.
3. Continuidad: retorno desde cuaderno y recientes privados, sin perder notas existentes.
4. Claridad: propuesta visual mínima, alcance real de respuestas y evidencia; evaluar explicación asistida separadamente.
5. Optimización y medición: compartir lecturas por petición, presupuesto de espera y contrato de analítica.

Antes de modificar comportamiento, presentar y aprobar el antes/después concreto correspondiente. Cada bloque debe preservar consultas exactas, alias válidos, lugares, texto original, RV1909, fuentes, notas y permisos; contrastar diferencias y compilación. Máximo un Preview por bloque y nueva autorización de publicación. No entregar como «todo solucionado» por pasar las 45 pruebas existentes.

Pendiente real: correcciones descritas, validación visual/autenticada de esos recorridos y, si se autoriza, publicación del bloque. Esta auditoría no publica ninguna mejora y no requiere repetir la validación de módulos ajenos al estudio.
