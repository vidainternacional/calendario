# Respuestas directas del estudio bíblico — 26-11-2026

## Autorización y alcance

El usuario pregunta «Que es el bautismo y que dice l bíblia al respecto» y aprueba «0k hazlo» después de presentar una respuesta directa con fuentes y explicar la diferencia entre búsqueda y generación. Autoriza una capacidad general de explicación, no una respuesta fija para bautismo. Se conserva la pregunta, la búsqueda por palabras, referencias, concordancias, notas, permisos y diseño aprobado. No se modifica el maestro ni producción. Rama y PR: `agent/estudio-busqueda-fiel-20261126`, #322 Draft.

## Implementación

- Reconoce preguntas naturales, incluidos errores leves del enunciado; una cita individual, un lugar o una palabra siguen su recorrido existente.
- Recupera evidencia de RV1909 por palabras completas/familias léxicas acotadas, con fuente aprobada/licenciada y libros aprobados. No convierte bautismo en un sinónimo de Espíritu Santo.
- Recuperación general acotada a 160 candidatos y ocho fuentes, con diversidad por libro y contexto próximo en una consulta agrupada. Para bautismo prioriza además las tres referencias del ejemplo solicitado y comprobado (Mateo 28:19, Hechos 2:38, Romanos 6:4), solo si existen realmente en la lectura autorizada. Son anclas de recuperación, no texto de respuesta precargado. No modifican el corpus ni la interpretación.
- Las referencias explícitas se comprueban mediante el lector existente. Los rangos de más de doce versículos no se recortan para aparentar una explicación completa: se devuelve insuficiencia de evidencia para esta capa; el estudio de rangos conserva su lectura existente.
- La explicación estructurada usa dos a cinco párrafos breves y fuentes identificadas. Solo admite identificadores de fuentes recuperadas; las referencias y enlaces visibles los construye el servidor, no el modelo. Rechaza citas ajenas, referencias numéricas incrustadas no verificadas, enlaces externos, HTML y estructura inválida.
- La validación acredita formato y existencia/procedencia de las citas; no certifica automáticamente la corrección teológica o que cada inferencia se desprenda del texto. El prompt exige separar explicación/aplicación, reconocer límites y no inventar una postura de VIDA ni consenso denominacional.
- La interfaz muestra explicación y citas primero, con fuentes plegadas inicialmente; conserva las concordancias debajo. Texto como contenido React, sin ejecutar HTML del modelo.
- Falta de conexión, error del proveedor y evidencia insuficiente son estados explícitos. Nunca se presenta un texto de prueba como respuesta real del modelo. La pregunta permanece en el formulario.

## Bloqueo real: conexión de IA ausente

Se inspeccionaron exclusivamente nombres, targets y ramas de variables de Vercel, sin descifrar valores. No hay claves/configuración del router IA en el proyecto. No se invocó ningún modelo real ni se habilitó facturación.

La nueva tarea usa configuración separada y únicamente Gemini, sin fallback a OpenAI/Claude u otro proveedor, y no activa el resto de tareas IA:

| Variable de servidor | Finalidad |
| --- | --- |
| `VIDA_BIBLE_QA_API_KEY` | Secreto introducido por el propietario directamente en Vercel; nunca por chat |
| `VIDA_BIBLE_QA_MODEL` | Modelo confirmado en la documentación y habilitado en la cuenta |
| `VIDA_BIBLE_QA_ENABLED` | Activación explícita, solo después de confirmar modalidad sin cargos y condiciones aceptadas |

La función queda deshabilitada en el Preview hasta configurar esa conexión. Ver los pasajes no significa que ya esté generando respuestas. No publicar ni afirmar que la pregunta de bautismo quedó resuelta con IA real todavía.

Revisión de documentación oficial de Google el 26-11-2026:

- https://ai.google.dev/gemini-api/docs/billing : las cuentas nuevas comienzan en Free Tier, con modelos y límites elegibles; el paso a pago implica vincular facturación.
- https://ai.google.dev/gemini-api/docs/pricing : Gemini 3.5 Flash-Lite (`gemini-3.5-flash-lite`) figura con entrada/salida gratuitas en Free Tier. Su disponibilidad y cuotas concretas deben comprobarse en el proyecto del propietario; no son garantía de capacidad para 300 personas.
- El nivel gratuito puede usar las consultas/respuestas para mejorar productos de Google, según sus términos. No se envían perfiles, correos ni notas personales, pero la pregunta escrita por el usuario sí se envía al generar. El propietario debe conocer/aceptar esa condición antes de activar. No afirmar que el proveedor no utiliza esos contenidos.

No se crearon variables, cuentas, planes ni claves. El propietario puede obtener la conexión en https://aistudio.google.com/api-keys usando un proyecto que indique Free Tier, sin habilitar facturación, y guardarla como secreto Preview de esta rama en https://vercel.com/vida-internacional/calendario/settings/environment-variables . No pedir que comparta la clave en la conversación. La activación/modelo se configuran después de verificar ese estado; no desplegar producción por añadir la conexión de revisión.

## Consumo, privacidad y reversión

No hay tablas, vectores, entrenamiento autónomo, historial nuevo ni almacenamiento de conversaciones. La caché existente se separa por usuario/tarea/pregunta/fuentes y es temporal en memoria; no se comparte la respuesta privada entre cuentas. La tarea tiene entrada máxima de 16,000 caracteres, salida máxima de 1,600 tokens, timeout de 25 segundos y los controles temporales existentes. Estos límites no son un tope financiero ni una garantía distribuida entre instancias: mantener el proyecto del proveedor en Free Tier es lo que evita cargos. Ante cuota agotada se muestran los pasajes, sin contratar ni cambiar de proveedor.

Reversión: deshabilitar la variable de activación y retirar el commit de esta capa. No hay SQL, corpus o notas que restaurar. La función anterior de búsquedas/referencias corregidas permanece independiente.

## Verificación

Quince casos nuevos con funciones reales y dependencias controladas: clasificación, evidencia y licencias, ausencia de sesión/fuente, conservación de consulta y usuario, validación de citas, texto no permitido, formato roto, falta de proveedor, aclaración y conexión con la acción real. El router no toma claves globales ni usa otro proveedor para la nueva tarea. No son llamadas reales a Gemini.

Chromium a 320/390/820 con React real y acciones controladas: explicación, enlaces exactos a Biblia, fuentes cerradas, consulta conservada, ausencia honesta de proveedor y sin desbordes. Son pruebas de interfaz, no una sesión autenticada real. Lint de módulos nuevos sin errores, TypeScript y compilación comprobados antes de entrega.

Conjunto general previo a añadir el último caso de aislamiento: 785 pruebas, 776 pasan y los mismos nueve fallos anteriores permanecen. El último caso nuevo pasa por separado; no declarar CI global verde. El recibo final de Preview/SHA y validaciones se registra en PR #322 sin generar otro deployment exclusivamente documental.

Pendientes: conexión y condiciones de la cuenta gratuita, prueba real del modelo con las fuentes, validación autenticada del usuario y autorización nueva para producción. El Preview no incluye respuestas ficticias para ocultar ese bloqueo.
