# FASE D — IA Bíblica Avanzada

Estado: **ACTIVA — BLOQUE 3, CONTEXTO HISTÓRICO Y CULTURAL**

Fecha de inicio: 2026-07-29

Última actualización: 2026-07-31

## Objetivo

Ampliar el estudio bíblico de Vida Internacional con fuentes verificables, contexto histórico, comparaciones, cronologías, mapas y asistencia de IA, protegiendo la experiencia estable de Biblia y el contenido privado de cada persona.

## Principios

- La Biblia general actual es una base protegida; cualquier cambio debe ser pequeño, aislado y validado.
- La IA no sustituye el texto bíblico ni presenta interpretaciones como hechos indiscutibles.
- Las fuentes deben identificarse y diferenciar texto bíblico, dato histórico, comentario e inferencia.
- No se enviarán notas privadas, bosquejos o contenido pastoral a servicios externos sin una decisión explícita de arquitectura y privacidad.
- Se evitarán costos recurrentes innecesarios y dependencias frágiles.
- Las herramientas deben funcionar primero sin IA cuando sea razonable.

## Alcance

- Diagnóstico de `/biblia`, `/biblia/notas`, `/estudios` y `/estudios/profundo`.
- Revisión de Comparar, traducciones, notas, favoritos, audio y fuentes actuales.
- Inventario de datos locales, tablas de Supabase, APIs y dependencias externas.
- Modelo para contexto histórico y cultural con referencias.
- Comparaciones ampliadas y herramientas de análisis.
- Cronologías y mapas.
- Asistencia de IA con límites, trazabilidad y control de costos.

## Fuera de alcance

- Rediseño visual global o corrección fina de textos de toda la app.
- Optimización transversal de rendimiento, seguridad y escalabilidad.
- Cambios en el Centro Pastoral que no sean necesarios para integrar una función bíblica ya validada.
- Automatizaciones o agentes que puedan publicar interpretación bíblica sin revisión humana.

## Orden de trabajo

1. Diagnóstico del sistema actual y sus fuentes. — **COMPLETADO**
2. Arquitectura de datos, atribución y privacidad. — **COMPLETADO**
3. Contexto histórico y cultural. — **EN PROGRESO**
4. Comparaciones y herramientas de estudio ampliadas. — PENDIENTE
5. Cronologías y mapas. — PENDIENTE
6. IA bíblica avanzada. — PENDIENTE
7. Pruebas, documentación y cierre. — PENDIENTE

## Bloque 1 completado — Diagnóstico y arquitectura

El diagnóstico confirmó:

- Biblia general estable sobre HelloAO;
- Comparar limitado actualmente a dos traducciones;
- notas bíblicas nuevas almacenadas localmente;
- notas de Estudio Profundo protegidas en Supabase;
- proveedor de IA configurado con un modelo retirado;
- ausencia de recuperación y citas de fuentes antes de generar;
- caché sin versión de modelo, prompt o fuentes;
- política de inserción que no exigía propiedad explícita.

Primer incremento entregado:

- modelo configurable y rechazo de modelos retirados;
- valor predeterminado `gemini-3.6-flash`;
- salida JSON con esquema obligatorio y validación de once secciones;
- prompt responsable que prohíbe fuentes inventadas;
- errores técnicos ocultos al usuario;
- caché versionado por modelo, prompt y fuentes;
- índices de caché y cuota;
- RLS que exige `generado_por = auth.uid()`;
- aviso visible sobre el estado provisional de las citas.

Evidencia:

- diagnóstico: `docs/FASE_D_DIAGNOSTICO_Y_ARQUITECTURA.md`;
- migración: `fase_d_endurecer_cache_estudios_ia`;
- preview: `dpl_9Mfawd7aiUCvCtjqD2cQR4TRPMZZ` — `READY`;
- Next.js y TypeScript: correctos;
- rutas generadas: 32 de 32.

## Bloque 2 completado — Fuentes, atribución y privacidad

Se entregó:

- tabla `public.biblical_sources` con proveedor, tipo, idioma, sitio, licencia, versión, atribución y revisión;
- RLS y privilegios de solo lectura para cuentas activas;
- dos fuentes aprobadas y dos fuentes registradas pero deshabilitadas;
- servicio exclusivo de servidor para recuperar metadatos aprobados;
- versión SHA-256 abreviada del catálogo;
- atribución visible dentro de `/estudios/profundo`;
- exclusión documentada de notas, bosquejos y contenido pastoral privado;
- matriz de seguridad 4 de 4 en producción.

Evidencia:

- documento: `docs/FASE_D_REGISTRO_FUENTES.md`;
- migración: `registro_fuentes_biblicas`;
- preview completo: `dpl_BHyb9dnF9UGFvcsq3N9BLRgUmdGq` — `READY`;
- producción: `dpl_DN5g5tLwJdhNLbkMngMsjUJJcn5V` — `READY`;
- commit de `main`: `d33daca536549b912a4f9a9fb246e1060fb0ee77`;
- confirmación visual: recibida el 2026-07-31.

## Bloque 3 activo — Contexto histórico y cultural

### Objetivo

Crear una capa verificable de contexto histórico y cultural asociada a pasajes bíblicos, sin presentar inferencias como hechos, sin importar contenido con licencia no aprobada y sin enviar datos privados a servicios externos.

### Alcance del bloque

- modelo de datos para fragmentos históricos y culturales;
- relación explícita con una fuente aprobada;
- referencias canónicas por libro, capítulo y rango de versículos;
- clasificación por periodo, lugar, pueblo, práctica, institución y tema;
- atribución y licencia heredadas de la fuente;
- estado de revisión antes de mostrar o usar un fragmento;
- servicio de lectura exclusivamente en servidor;
- paquete de evidencia pequeño, trazable y determinista;
- interfaz inicial separada de la Biblia general.

### Primer incremento permitido

Definir e implementar la arquitectura mínima de fragmentos contextuales y su servicio de recuperación. No conectar todavía el contenido a la generación de IA ni importar comentarios completos.

### Reglas de evidencia

- Cada fragmento debe enlazar a un registro aprobado de `biblical_sources`.
- Una URL por sí sola no constituye evidencia recuperada.
- El texto debe conservar atribución, licencia, versión y referencia de origen.
- Los datos históricos se mostrarán como información de la fuente; las síntesis se etiquetarán como inferencias.
- Las fuentes pendientes o deshabilitadas no pueden entregar fragmentos.
- Notas privadas, bosquejos, biblioteca pastoral y materiales no publicados quedan fuera del paquete.

### Criterio para avanzar

El Bloque 3 se completa cuando el modelo de contexto, sus políticas, el servicio de recuperación y una visualización inicial estén documentados y validados en producción con fuentes aprobadas.
