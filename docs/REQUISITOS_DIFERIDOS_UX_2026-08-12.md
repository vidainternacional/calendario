# Requisitos diferidos de UX y Centro de Estudio — 2026-08-12

Estos requisitos fueron confirmados por el usuario mientras la prioridad activa es **FASE D — Cobertura Bíblica Integral: datos antes de UX**.

No deben implementarse durante el cierre de cobertura salvo cuando el requisito forme parte explícita del checklist activo. Se conservan aquí para retomarlos cuando `__VIDA_INTERNACIONAL.md` autorice nuevamente UX/navegación.

## 1. Navegación entre ministerios

- Entrar a distintos dashboards ministeriales no debe crear una cadena histórica que permita cambiar de ministerio usando el botón Atrás.
- El cambio de ministerio/cuenta debe hacerse únicamente desde la superficie explícita de **Cambiar cuenta** ya existente.
- Desde el dashboard de un ministerio, la acción Atrás debe regresar a **Inicio**, no al ministerio visitado anteriormente.
- Mantener las reglas actuales de acceso y permisos; este requisito es de navegación, no de autorización.

## 2. Filtros visuales de Avisos

Agregar una forma clara de distribuir/filtrar la vista de Avisos. Categorías iniciales a evaluar:

- Todos.
- Generales.
- Por ministerio.
- Importantes.
- No leídos.

Dirección visual solicitada:

- controles redondos/píldora en la parte superior;
- la selección debe verse de forma inmediata;
- las opciones deben poder desplegarse sin sobrecargar la pantalla;
- conservar el significado aprobado del badge de Avisos: publicaciones no leídas, sin mezclar pendientes de otros módulos.

## 3. Recorrido interactivo / manual de la app

Evolucionar la bienvenida hacia un recorrido interactivo que destaque una parte real de la interfaz a la vez y explique brevemente qué hace.

Requisitos:

- recorrido adaptado al rol/rango y a las capacidades reales del usuario;
- pasos cortos, visuales y fáciles de entender;
- posibilidad de omitir/cerrar y volver a abrir después;
- opción **Conocer la app** disponible para todos como manual permanente;
- incluir un paso guiado para activar las notificaciones y explicar qué mensajes de la congregación puede recibir;
- no mostrar funciones que el rol no tenga autorizadas.

## 4. Pronunciación del texto original

Para hebreo, arameo y griego, evaluar dos ayudas complementarias:

- guía de pronunciación legible junto a la transliteración;
- reproducción por voz cuando exista una solución de calidad suficientemente fiable.

La voz debe presentarse como ayuda de pronunciación, no como reconstrucción infalible de pronunciación histórica. Debe distinguirse cuando existan convenciones modernas o académicas diferentes.

## 5. Centro general de Historia y Contexto Bíblico

Además del estudio de un versículo, crear posteriormente una superficie de aprendizaje general sobre la Biblia y su mundo.

Debe permitir comprender, de manera organizada y con fuentes aprobadas:

- historia general de la Biblia y transmisión del texto;
- formación y desarrollo del canon;
- contexto judío e histórico;
- periodos, imperios, pueblos y acontecimientos relevantes;
- qué conocían, leían, pensaban y creían las comunidades de cada época cuando la evidencia lo permita;
- prácticas, costumbres, vida cotidiana, geografía y cultura;
- literatura del entorno y marcos que ayuden a entender los textos sin presentar hipótesis debatidas como hechos;
- cómo la Biblia llegó a las formas/manuscritos/traducciones que hoy conocemos.

Esta superficie es distinta del contexto puntual de cada versículo. Debe funcionar como un **centro de aprendizaje bíblico general**, enlazable desde los estudios cuando corresponda.

## 6. Organización de notas personales de Estudio

Evolucionar las notas personales con una organización desplegable sencilla.

Dirección inicial a validar en UX:

- notas vinculadas al pasaje/estudio actual;
- notas generales de estudio;
- posibilidad de clasificar o mover una nota sin duplicarla;
- mantener integración con el cuaderno existente de Biblia → Notas en vez de crear un segundo sistema aislado;
- respetar el requisito ya documentado de que las notas personales no formen parte de la telemetría pastoral.

## 7. Requisito que sí pertenece a la prioridad activa

**No mostrar capas bíblicas inexistentes.**

Mientras se cierra FASE D, cualquier tarjeta/sección para la que no exista contenido real, aprobado y trazable debe omitirse completamente. No debe mostrarse texto tipo “no disponible”, “próximamente”, “seleccione para ver cuando exista” o relleno equivalente como sustituto de datos.

Este punto forma parte de las reglas y del punto 9 de `__VIDA_INTERNACIONAL.md` y debe resolverse antes del checklist final de cobertura.
