# VIDA INTERNACIONAL — Documento maestro de fases

Última actualización: 2026-09-03

Fase / prioridad activa: **EXPANSIÓN FUNCIONAL FINAL ANTES DE FASE I · BLOQUE 3 — EXPERIENCIA PARA MÚSICOS**

Decisión vigente: **FASE I — GUÍA INTERACTIVA Y AYUDA CONTEXTUAL POR ROL queda DIFERIDA HASTA EL CIERRE FINAL DE LA APLICACIÓN.** La guía se desarrollará únicamente cuando las herramientas, módulos y flujos de VIDA estén terminados y aprobados, para evitar documentar o enseñar superficies que todavía puedan cambiar.

Este archivo es el control oficial y versionado del proyecto. Antes de trabajar debe leerse este estado y continuar únicamente con la fase o prioridad marcada como activa.

El registro técnico acumulado hasta el 2026-08-03 se conserva íntegro en:

- `docs/VIDA_INTERNACIONAL_HISTORICO_2026-08-03.md`.

La evidencia del piloto operativo iniciado el 2026-08-04 se conserva íntegramente en los documentos históricos ya versionados del repositorio.

## Reglas de ejecución

1. Trabajar exclusivamente sobre los objetivos de la prioridad activa.
2. No reanudar una fase o prioridad en pausa mientras este documento no lo autorice expresamente.
3. Cada cierre debe incluir evidencia técnica, validación funcional y documentación.
4. Los hallazgos fuera de alcance se documentan para una fase posterior, sin ampliar el bloque activo.
5. No borrar datos, migraciones o estructuras de una fase pausada cuando basta con desactivar su experiencia visible.
6. Los cambios de permisos, roles, liderazgo o datos sensibles requieren una decisión explícita y recuperación definida.
7. Durante FASE E, preservar íntegramente las funcionalidades y UX aprobadas; optimizar sin degradar comportamientos cerrados.
8. No reabrir cobertura bíblica, Programación Ministerial, Calendario, Notificaciones u otras prioridades cerradas salvo bug comprobable.
9. Los cambios sensibles de seguridad/RLS/grants deben presentarse con alcance y recuperación antes de aplicarse cuando puedan afectar producción.
10. **Principio visual global:** priorizar superficies integradas, jerarquía por espaciado, tipografía, color y separadores; evitar contenedores o tarjetas anidadas tipo “cuadro dentro de cuadro” cuando no exista una necesidad funcional clara. En móvil, conservar la mayor superficie útil posible sin reducir las áreas táctiles a tamaños incómodos.
11. **Navegación móvil global:** la barra principal pertenece al layout de la aplicación y no a cada módulo. La aparición del teclado no debe levantarla ni hacerla flotar sobre el contenido de trabajo; en iOS debe permanecer en el borde inferior del layout y quedar cubierta por el teclado cuando corresponda.
12. **Historial reversible:** cuando una superficie exponga Deshacer/Rehacer, toda acción que modifique contenido o metadatos creados por el usuario debe entrar en el mismo historial reversible; no limitar el historial únicamente al texto visible.
13. **Repriorización obligatoriamente documentada:** cualquier decisión de repriorización tomada en un PR debe reflejarse en este documento maestro antes de continuar trabajando; no basta con que quede mencionada solo en el PR.

## REGLAS ESTRICTAS DE PRESERVACIÓN Y EJECUCIÓN

1. Un pedido del usuario es un contrato literal de alcance. Modificar únicamente lo solicitado.
2. Está prohibido aprovechar un cambio para rediseñar otras áreas, reorganizar código no relacionado, renombrar componentes, cambiar estilos globales, actualizar dependencias, limpiar código ajeno al problema o agregar mejoras no solicitadas.
3. Antes de modificar, identificar el componente y la causa real. Si existen parches anteriores interfiriendo, consolidarlos únicamente cuando afecten directamente el cambio pedido.
4. Todo lo que ya funciona se considera BLOQUEADO POR DEFECTO. Esto incluye datos, guardado, navegación, permisos, historial, Biblia, Estudios, Hebreo, Centro Pastoral, Ministerios, Calendario, notificaciones, imágenes, textos, capas y cualquier comportamiento previamente aprobado.
5. Si para cumplir el pedido fuera indispensable alterar una funcionalidad aprobada, DETENERSE antes de modificarla y explicar exactamente por qué.
6. Cuando una clase, componente o función compartida pueda afectar otras pantallas, aislar primero el cambio para evitar efectos secundarios.
7. No marcar un cambio como corregido solo porque el código compiló. Verificar diff exacto, build y Preview correspondiente al head nuevo.
8. Máximo UN Preview por bloque de trabajo.
9. No enviar avances intermedios salvo bloqueo real. Ejecutar directamente y entregar resultado.
10. La entrega normal será únicamente qué cambió, Preview exacto, checklist breve y qué falta verificar.
11. Si no existe validación visual directa, usar exactamente: “Cambio aplicado y compilado; falta validación visual tuya.”
12. No hacer merge ni producción sin autorización explícita.
13. No modificar Supabase/RLS/permisos/datos sensibles sin presentar antes cambio exacto, impacto y reversión y recibir aprobación explícita.
14. Al iniciar una conversación nueva, `__VIDA_INTERNACIONAL.md` de `main` es la única fuente oficial. No reconstruir el estado mediante suposiciones ni pedir nuevamente información que ya está documentada.
15. Trabajar de forma puntual: revisión mínima necesaria → causa real → cambio mínimo → diff → compilación → un Preview → checklist. Evitar auditorías generales y explicaciones largas salvo que el usuario las solicite.

## Estado de fases

| Fase | Objetivo principal | Estado |
|---|---|---|
| FASE A | Experiencia profesional mobile first | COMPLETADA |
| FASE B | Optimización de UX, transiciones, carga, errores y retroalimentación | COMPLETADA |
| FASE C | Panel Pastoral, versículos, bosquejos, biblioteca y materiales | **COMPLETADA — 2026-07-29** |
| FASE D | IA Bíblica Avanzada, fuentes, contexto, comparaciones, cronologías y mapas | **COMPLETADA — 2026-08-12** |
| FASE E | Rendimiento, seguridad, escalabilidad, pruebas y documentación | **COMPLETADA — 2026-08-13** |
| FASE F | Evolución correlativa de Biblia → Notas | **COMPLETADA — 2026-08-17** |
| FASE G | Validación integral y cierre de deudas transversales | **COMPLETADA — 2026-08-18** |
| FASE H | Centro de Hebreo Bíblico | **COMPLETADA Y APROBADA — 2026-08-23** |
| FASE I | Guía interactiva y ayuda contextual por rol | **DIFERIDA HASTA EL CIERRE FINAL DE LA APP — 2026-08-26** |

# PRIORIDADES RECIENTES CERRADAS

## Programación Ministerial: Alabanza y equipos de servicio

Cerrada el 2026-08-11 tras validación funcional, endurecimiento RLS de reemplazos, protección del historial y producción READY. La migración final está versionada en `supabase/migrations/20260811140500_endurecer_rls_intercambios_programacion.sql`. No reabrir salvo bug comprobable.

## Administración: control y eliminación permanente

Cerrada el 2026-08-09. Administrador conserva eliminación permanente protegida de usuarios/ministerios, Centro de Análisis, fichas administrativas y navegación modular. No reabrir salvo bug comprobable.

## Notificaciones y Badges Reales

Cerrada el 2026-08-11 tras validación funcional en iPhone. Pushes, destinos directos, solicitudes de ingreso, bienvenida ministerial, identidades de Avisos y badges derivados de estado real quedaron operativos. Producción validada en `48efda443e719279fac267e64931b1c5f36e8a07`.

Pendiente transversal diferido: extender después de completar los bloques funcionales el patrón de badge-guía para conducir al usuario desde el acceso general hasta el punto exacto pendiente, reutilizando el comportamiento validado en Ayuda Solidaria y sin reabrir módulos cerrados mientras tanto.

## Identidad Comunitaria y Perfil

Cerrada y validada. `profiles.avatar_url`, almacenamiento de avatar, encuadre, ficha integral de miembro y reutilización de identidad visual permanecen como comportamiento aprobado.

## Pulido de experiencia / Calendario e Inicio

Cerrado y estabilizado. Calendario conserva su base móvil aprobada y no debe degradarse.

# PILOTO OPERATIVO — EN PAUSA

Estado desde 2026-08-07: **PAUSADO POR DECISIÓN DEL USUARIO**.

Se conservan tablas, RLS, Centro de Análisis, datos, reportes, onboarding y Ayuda Solidaria, pero no debe ejecutarse telemetría exclusiva del piloto ni reactivarse P1/P2/P3 mientras esta prioridad siga en pausa. La futura guía interactiva por rol de FASE I sustituye la necesidad práctica de usar el piloto como mecanismo principal de orientación dentro de la app, sin borrar la evidencia histórica del piloto.

# FASE D — COMPLETADA Y APROBADA — 2026-08-12

FASE D queda formalmente cerrada. Incluye la cobertura bíblica integral auditada y la UX/navegación final del Centro de Estudio aprobadas. No reabrir salvo bug comprobable o una prioridad futura explícitamente documentada.

# FASE E — COMPLETADA — RENDIMIENTO, SEGURIDAD, ESCALABILIDAD, PRUEBAS Y DOCUMENTACIÓN — 2026-08-13

FASE E queda cerrada y preservada. La evidencia técnica detallada permanece versionada en los documentos históricos correspondientes del repositorio.

# FASE F — COMPLETADA — EVOLUCIÓN CORRELATIVA DE BIBLIA → NOTAS — 2026-08-17

FASE F queda cerrada y preservada. El cuaderno personal, privacidad por defecto, sincronización, soporte offline, predicación correlativa, metadatos y exportación permanecen aprobados.

# FASE G — COMPLETADA — VALIDACIÓN INTEGRAL Y CIERRE DE DEUDAS TRANSVERSALES — 2026-08-18

FASE G queda **COMPLETADA Y APROBADA — 2026-08-18** y no debe reabrirse salvo bug comprobable o una prioridad futura explícitamente documentada.

# FASE H — COMPLETADA Y APROBADA — CENTRO DE HEBREO BÍBLICO — 2026-08-23

Los cuatro bloques de FASE H quedan **COMPLETADOS Y APROBADOS**. El Centro de Hebreo Bíblico conserva la arquitectura didáctica, cobertura léxica española completa, búsqueda inteligente, traductor práctico, lectura bíblica, gramática progresiva, Repaso, teclado hebreo, práctica adaptativa, progreso privado y checkpoint oral validados. FASE H no debe reabrirse salvo bug comprobable o una prioridad futura explícitamente documentada.

# FASE I — DIFERIDA HASTA EL CIERRE FINAL — GUÍA INTERACTIVA Y AYUDA CONTEXTUAL POR ROL

FASE I se realizará al final del desarrollo de VIDA Internacional, cuando la aplicación y sus herramientas hayan quedado terminadas y aprobadas.

La razón de esta decisión es funcional: la guía debe enseñar la versión definitiva de la aplicación. No debe desarrollarse mientras todavía se reorganizan, pulen o completan herramientas, porque eso obligaría a rehacer recorridos y explicaciones posteriormente.

El alcance ya definido para FASE I se conserva íntegramente y no se elimina. Queda simplemente diferido hasta el cierre final de la aplicación.

## Objetivo

Dar a cada persona una guía dentro de VIDA sin depender de capacitación presencial ni reactivar el Piloto Operativo.

## Alcance

1. Recorrido inicial opcional por primera vez mediante globos/contextos breves anclados a herramientas reales.
2. Contenido dinámico por rol y permisos: Administrador, Pastor, Líder y Servidor solo verán explicaciones de funciones que realmente pueden utilizar.
3. Posibilidad de omitir el recorrido y volver a iniciarlo manualmente desde Ayuda/Perfil.
4. Centro de guía interactiva con explicaciones cortas por módulo, acciones frecuentes y recorridos específicos cuando una superficie sea compleja.
5. El recorrido debe usar la interfaz real, no una réplica separada que pueda quedar desactualizada.
6. Sin telemetría del Piloto por defecto; cualquier medición futura deberá ser explícita, agregada y respetuosa con la privacidad.
7. Accesibilidad, áreas táctiles cómodas, lenguaje breve y coherencia con la experiencia mobile-first de VIDA.

## Centro Pastoral — Editor visual · checkpoint aprobado — 2026-08-31

1. Fondos conserva la galería general aprobada y amplía personalización mediante Rueda de color con tono, saturación, luminosidad y texturas seleccionables.
2. Las texturas personalizadas se muestran como muestras circulares dentro de Rueda de color.
3. Se incorpora Degradados junto a Rueda de color e Imágenes, con creación de degradados lineales, radiales y cónicos, dirección configurable, segundo color y opción para guardar el resultado en la galería general.
4. Las imágenes conservan conversión Imagen ↔ Fondo sin duplicar la misma instancia cuando corresponde.
5. Capas abre directamente sin subpestaña redundante y concentra Nueva capa, Opacidad y Fusión en una sola fila horizontal compacta.
6. Las miniaturas de Capas muestran el contenido real de cada capa y el swipe izquierdo conserva acciones contextuales.
7. Los fondos desbloqueados pueden moverse y escalarse mediante gestos igual que las imágenes.
8. Los textos y versículos insertados en el lienzo permanecen editables directamente mediante cursor, selección y borrado de contenido parcial.
9. Biblia conserva español y texto original; AT usa hebreo y NT griego. En hebreo se mantiene jerarquía propia del libro y exploración puntual de palabras.
10. La exploración léxica prioriza datos bíblicos existentes de VIDA; cuando una explicación no está disponible, la IA integrada puede actuar como respaldo claramente identificado como explicación IA.
11. Se confirma persistencia real del Editor Pastoral: Guardar y autoguardado conservan páginas, textos, imágenes, capas, posiciones, opacidad, fusión, fondos y degradados lineales, radiales y cónicos. El estado de guardado se comunica únicamente mediante el check superior, sin toast de “Proyecto guardado”.
12. Checkpoint técnico aprobado del bloque: `f3d54260f998e83c93440622df26ef34aa1f0052`; PR #287 permaneció OPEN · DRAFT durante la validación y fue cerrado al preparar la integración final aprobada.

## CENTRO PASTORAL · REORGANIZACIÓN Y CIERRE DEL EDITOR VISUAL — CERRADO Y APROBADO — 2026-09-01

El Centro Pastoral queda funcional y visualmente aprobado.

Cierre confirmado:
- Editor visual estable preservando Fondos, Texto, Capas, Biblia, imágenes, guardado y Deshacer/Rehacer.
- Navegación principal del editor: Editar · Presentar · Compartir.
- Presentar integra Horizontal y Vertical; pantalla completa muestra únicamente la diapositiva.
- Vista vertical y experiencia para la congregación integradas dentro de VIDA, sin superficies tipo “card dentro de card”.
- Paquetes pastorales muestran Presentación y Estudio.
- Enviar paquete al Cuaderno abre directamente el paquete guardado dentro del Cuaderno, seleccionado y listo para trabajar.
- Los paquetes utilizan icono de libro.
- Marcar como importante se representa mediante destello dorado.
- Skeleton del Centro Pastoral alineado con la estructura visual actual.
- Interacción táctil del paquete de Inicio aislada correctamente sin afectar los efectos de Ministerios.
- Preview de validación estable: `https://calendario-git-agent-centro-pastoral-cb1651-vida-internacional.vercel.app`.
- Integración a `main` y publicación en producción autorizadas explícitamente por el usuario el 2026-09-01.

No reabrir Centro Pastoral salvo bug comprobable o una nueva prioridad explícitamente documentada.

### Ajuste posterior aprobado — Organización del Centro Pastoral

La portada del Centro Pastoral queda organizada así:
- En preparación: muestra borradores recientes para continuar trabajando.
- Nuevo proyecto: crea directamente un proyecto nuevo.
- Proyectos: único lugar para administrar todos los proyectos existentes.
- Proyectos incluye búsqueda, filtros Todos · Borradores · Listos · No publicados · Publicados y vistas Tarjetas · Lista · Miniaturas.
- La antigua separación “Mis proyectos / Publicados” queda eliminada por redundancia.
- Estudio y Biblioteca permanecen como herramientas auxiliares.
- Bosquejos, colecciones de versículos y Biblia permanecen disponibles internamente, pero fuera del nivel principal.

### Ajuste posterior aprobado — Analíticas de Estudio, Theographic y geografía bíblica

- Analíticas avanzadas de Estudio habilitadas para pasajes, libros, temas, búsquedas, recurrencia, sesiones anónimas, resultados y tiempo de uso, sin mostrar usuarios, perfiles ni notas personales.
- Corpus Theographic habilitado con 450 eventos narrativos y 17,570 referencias aprobadas, presentado dentro de VIDA como Secuencia narrativa, con títulos en español y sin exponer metadata técnica.
- Geografía bíblica incorpora recorridos gráficos del Éxodo, los tres viajes misioneros de Pablo y el viaje de Pablo a Roma.
- Los recorridos se muestran sobre mapa geográfico real, con paradas numeradas, lugar bíblico, identificación actual cuando existe, nivel de certeza y acceso a la ubicación actual.
- Las líneas representan el orden narrativo de las paradas y no se presentan como reconstrucción exacta de caminos históricos.
- Tabla histórica de respaldo de FASE H asegurada mediante RLS y retiro de acceso público/autenticado, conservando íntegramente sus datos.
- Limpieza técnica realizada sobre PR antiguos correspondientes a fases ya cerradas.
- Preview validado por el usuario: `https://calendario-git-agent-centro-pastoral-cb1651-vida-internacional.vercel.app`.

# PRIORIDAD ACTIVA — EXPANSIÓN FUNCIONAL FINAL ANTES DE FASE I

Esta prioridad reúne las últimas funciones nuevas que deben completarse antes de iniciar FASE I — Guía interactiva y ayuda contextual por rol.

Orden aprobado:

## Bloque 1 — Versículo del día y Planes de lectura — COMPLETADO Y APROBADO — 2026-09-02

Objetivo:
Hacer VIDA útil también para personas que todavía no pertenecen a la iglesia, de manera que puedan acercarse a la Biblia y conocer VIDA posteriormente por medio de la utilidad real de la aplicación.

Alcance:
- Versículo del día utilizando contenido bíblico aprobado.
- Posibilidad de recibir el versículo mediante recordatorio/notificación configurable.
- Planes de lectura bíblica progresivos.
- Planes accesibles también para personas que no pertenecen a VIDA Internacional.
- Integración natural con Biblia y Centro de Estudio existentes, sin crear motores bíblicos paralelos.
- Hebreo Bíblico, Biblia, Estudio y estas nuevas herramientas forman parte de la capa de utilidad abierta de VIDA.
- Las funciones internas de iglesia, ministerios y administración conservan sus permisos actuales.
- El objetivo no es convertir la portada en publicidad de la iglesia, sino permitir que una persona conozca VIDA mediante herramientas útiles y después pueda descubrir actividades y comunidad.

Cierre aprobado:
Versículo diario y recordatorio configurable integrados con la Biblia aprobada. Catálogo de 12 planes temáticos con progreso y rachas. Centro Pastoral permite a Pastor/Admin crear, editar, autoguardar, publicar y eliminar sus planes, conservando borradores parciales y bloqueando publicación hasta completar todos los días. Los planes son accesibles a cualquier usuario con cuenta, pertenezca o no a VIDA Internacional.

## Bloque 2 — Ayuda y Sembrar — COMPLETADO Y APROBADO — 2026-09-03

Objetivo:
Hacer que pedir ayuda sea sencillo, privado, digno y empático, y que ayudar también sea fácil.

Alcance aprobado:
- Entrada clara “Necesito ayuda” sin lenguaje que haga sentir vergüenza a la persona.
- Posibilidad de explicar una necesidad de manera sencilla y discreta.
- “Quiero sembrar” permite preguntar cómo ayudar cuando la persona no sabe qué hace falta.
- Mostrar necesidades reales de la despensa, priorizando aquello que actualmente tenga menor existencia.
- Permitir sembrar no solo alimentos: tiempo, transporte, herramientas, objetos, conocimientos, oficios, habilidades u otras formas de servicio.
- Facilitar comunicación directa únicamente con las personas autorizadas necesarias.
- Preservar privacidad y no mostrar públicamente información sensible de quien solicita ayuda.

Cierre aprobado:
- Centro de Ayuda unificado para usuario y equipo autorizado, sin accesos redundantes para Pastor/Administrador.
- Paquete de despensa y otra ayuda simplificados; conversaciones privadas integradas como chat directo.
- Inventario de despensa, composición de paquetes y descuento automático al registrar entrega.
- Necesidades no materiales administrables — habilidades, oficios, transporte, conocimiento y otras formas de servicio.
- Historial privado de siembras y agradecimientos sin rankings públicos.
- Datos bancarios oficiales centralizados en Configuración avanzada para reutilización controlada dentro de la app.
- Experiencias desplegables nuevas inician contraídas y vuelven a ese estado al reingresar.
- Contraste de campos y textos corregido dentro del Centro de Ayuda.
- Sistema de badge-guía validado en Ayuda Solidaria: un pendiente conduce desde el acceso general hasta la conversación exacta y desaparece al marcarse como leído.
- La extensión de este patrón de badges a otras áreas queda diferida hasta completar los bloques funcionales pendientes.

## Bloque 3 — Experiencia para músicos — ACTIVO

Objetivo:
Convertir el repertorio/programación musical existente en una herramienta utilizable durante el servicio y no únicamente en una lista de canciones.

Alcance previsto:
- Setlist ordenado del servicio.
- Vista práctica de canción, tono, acordes y contenido necesario para tocar.
- Navegación rápida entre canción actual, anterior y siguiente.
- Posibilidad de transponer las notas/acordes cuando sea necesario.
- El líder autorizado puede cambiar tono, transponer y modificar la versión oficial de acordes.
- Los músicos pueden consultar y utilizar la versión preparada, pero no alterar la versión oficial sin permiso.
- Preservar Programación Ministerial, repertorio, permisos e historial existentes.

## Bloque 4 — Alertas pastorales urgentes

Este bloque se desarrollará de forma separada debido a privacidad, permisos y notificaciones sensibles.

Objetivo:
Diferenciar una consulta normal de una situación que necesita atención pastoral rápida.

Alcance previsto:
- Mensajes normales siguen su flujo habitual.
- Situaciones urgentes pueden elevarse a un nivel de atención pastoral.
- Situaciones críticas de bienestar, fallecimiento u otras emergencias pueden generar una alerta simultánea para pastores/líderes autorizados.
- No diagnosticar automáticamente a una persona.
- Mantener privacidad y mostrar únicamente la información necesaria a quienes tengan autorización.
- Antes de implementar cambios de permisos, RLS, destinatarios de alertas o datos sensibles se presentará exactamente el cambio, impacto y reversión para aprobación explícita.

FASE I continúa DIFERIDA hasta completar, validar y cerrar estos cuatro bloques.

# Siguiente prioridad autorizada

**Bloque 3 — Experiencia para músicos — ACTIVO.**