# Requisito diferido — Centro de Estudio y analíticas

Registrado: 2026-08-11

Este requisito fue solicitado durante FASE D — Bloque 5: Cronologías y Mapas. No debe ampliar el punto activo de Roma ni iniciar un módulo nuevo antes del cierre formal del bloque.

## Objetivo de experiencia

El Centro de Estudio debe poder entenderse con facilidad por una persona que no tenga conocimientos técnicos o académicos. La interfaz debe priorizar lenguaje humano, jerarquía clara y explicación progresiva, manteniendo disponibles las fuentes, certeza, precisión textual e información especializada en un segundo nivel.

## Historial de estudios

Toda consulta ejecutada como estudio debe quedar registrada de forma persistente para permitir análisis posteriores de uso. Como mínimo, el modelo futuro debe poder distinguir:

- usuario autenticado que realiza la consulta, sujeto a la política de privacidad que se apruebe;
- consulta escrita originalmente;
- referencia canónica o tema resuelto cuando exista;
- tipo de consulta: pasaje, palabra, tema o pregunta;
- fecha y hora;
- resultado disponible/no disponible/error;
- superficie desde la que se abrió el estudio;
- reaperturas o consultas repetidas sin duplicar artificialmente sesiones.

## Analíticas solicitadas

El sistema debe permitir conocer de forma agregada:

- versículos y pasajes más estudiados;
- libros bíblicos más consultados;
- palabras, temas y preguntas más buscados;
- tendencias por periodo;
- búsquedas sin resultado útil;
- estudios que generan más reaperturas;
- tiempo de permanencia aproximado dentro de cada estudio;
- secciones del estudio en las que las personas permanecen o interactúan más tiempo, cuando pueda medirse de forma responsable.

## Principios de privacidad y calidad

- Las analíticas pastorales deben priorizar datos agregados sobre vigilancia individual.
- No registrar contenido de notas personales como telemetría de análisis.
- No inferir estado espiritual, salud mental, pecado, orientación, intención privada u otras categorías sensibles a partir de una búsqueda.
- El tiempo de permanencia debe medirse como interacción aproximada y no como lectura real garantizada.
- Evitar contar tiempo cuando la pestaña/PWA está en segundo plano o sin actividad.
- Evitar eventos de telemetría excesivos; preferir sesiones de estudio con inicio, interacción significativa y cierre/heartbeat limitado.
- Definir retención, acceso por rol y RLS antes de habilitar analíticas identificables.

## Relación con el historial actual

`EstudioProfundoClient` ya consume `obtenerHistorial()` y vuelve a cargarlo después de un estudio exitoso. Antes de crear tablas paralelas, auditar el historial existente y reutilizarlo o evolucionarlo cuando sea posible.

## Estado

REQUISITO REGISTRADO — DIFERIDO HASTA QUE EL DOCUMENTO MAESTRO AUTORICE SU IMPLEMENTACIÓN.
