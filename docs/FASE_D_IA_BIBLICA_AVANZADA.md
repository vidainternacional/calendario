# FASE D — IA Bíblica Avanzada

Estado: **ACTIVA — BLOQUE 2, FUENTES, ATRIBUCIÓN Y PRIVACIDAD**

Fecha de inicio: 2026-07-29

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
2. Arquitectura de datos, atribución y privacidad. — **EN PROGRESO**
3. Contexto histórico y cultural. — PENDIENTE
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

## Bloque 2 activo — Fuentes, atribución y privacidad

### Objetivo

Crear el registro verificable de fuentes antes de recuperar contenido histórico o entregar citas a la IA.

### Alcance del bloque

- tabla de fuentes aprobadas con tipo, idioma, proveedor, sitio y licencia;
- política de lectura segura y administración controlada;
- catálogo inicial de metadatos de HelloAO;
- clasificación de traducción, comentario, referencia cruzada, perfil y fuente histórica;
- atribución visible y reutilizable;
- versión del conjunto de fuentes;
- prohibición técnica de enviar notas privadas al paquete de evidencia.

### Primer incremento permitido

Registrar metadatos y licencias. No importar comentarios completos ni modificar todavía la experiencia estable de Biblia.

### Criterio para avanzar

El Bloque 2 se completa cuando el registro de fuentes esté en producción, las licencias iniciales estén documentadas y exista un servicio de lectura que entregue metadatos verificables sin incluir contenido privado.
