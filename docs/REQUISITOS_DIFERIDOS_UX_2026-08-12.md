# Requisitos diferidos de UX y Centro de Estudio — 2026-08-12

Estos requisitos fueron confirmados por el usuario durante FASE D y se conservan para abrirse únicamente cuando `__VIDA_INTERNACIONAL.md` autorice su prioridad correspondiente.

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

## 4. Pronunciación del texto original — DIFERIDA POR DECISIÓN DEL USUARIO

No implementar todavía pronunciación/voz. El usuario decidió el 2026-08-12 dejar esta función para después hasta definir si se utilizará y cuál será la metodología adecuada.

Si se retoma, para hebreo, arameo y griego se podrán evaluar:

- guía de pronunciación legible junto a la transliteración;
- reproducción por voz cuando exista una solución de calidad suficientemente fiable.

La voz deberá presentarse como ayuda pedagógica, no como reconstrucción infalible de pronunciación histórica, y distinguir convenciones modernas o académicas cuando corresponda.

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

## 6. Cuaderno de estudio personal unificado — FASE F

La app debe tener **un solo Cuaderno de estudio por usuario**, accesible desde la pestaña **Estudios**. No deben existir cuadernos independientes que hagan sentir que Biblia, Estudio Profundo y Centro Pastoral guardan notas en sistemas distintos.

Dirección aprobada:

- **Biblia → Notas** es la base funcional existente y debe evolucionar, no duplicarse.
- Una nota creada desde **Biblia**, **Estudio Profundo** o **Centro Pastoral** debe pertenecer al mismo cuaderno personal del usuario.
- Cada nota conserva su origen y contexto: referencia bíblica, pasaje/capítulo, estudio, bosquejo/material pastoral u otra relación real disponible.
- Desde el Cuaderno debe poder verse todo junto y también filtrarse por origen/contexto, por ejemplo **Todas / Biblia / Estudio / Pastoral**, sin duplicar la nota.
- Al abrir una nota debe poder recuperarse el contexto donde nació cuando exista un destino válido.
- El cuaderno es **privado por usuario por defecto**. Ser Administrador, Pastor o Líder no concede acceso automático a las notas personales de otra persona.
- Cualquier función futura de compartir una nota deberá ser explícita por parte del propietario.
- Las notas personales no forman parte de la telemetría pastoral ni de analíticas de comportamiento.
- La futura FASE F podrá añadir sincronización entre dispositivos, respaldo en Supabase, metadatos correlativos de prédica/estudio, fecha, serie, lugar, predicador, estado y exportación sobre este mismo cuaderno.

## 7. Regla permanente de capas bíblicas

**No mostrar capas bíblicas inexistentes.**

Cualquier tarjeta/sección para la que no exista contenido real, aprobado y trazable debe omitirse completamente. No debe mostrarse texto tipo “no disponible”, “próximamente”, “seleccione para ver cuando exista” o relleno equivalente como sustituto de datos.
