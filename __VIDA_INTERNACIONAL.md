# VIDA INTERNACIONAL — Documento maestro de fases

Última actualización: 2026-09-07

Fase / prioridad activa: **EXPANSIÓN FUNCIONAL FINAL ANTES DE FASE I · BLOQUE 4 — DISCIPULADO**

Decisión vigente: **FASE I — GUÍA INTERACTIVA Y AYUDA CONTEXTUAL POR ROL queda DIFERIDA HASTA EL CIERRE FINAL DE LA APLICACIÓN.** La guía se desarrollará únicamente cuando las herramientas, módulos y flujos de VIDA estén terminados y aprobados, para evitar documentar o enseñar superficies que todavía puedan cambiar.

Este archivo es el control oficial y versionado del proyecto. Antes de trabajar debe leerse este estado y continuar únicamente con la fase o prioridad marcada como activa.

El registro técnico acumulado hasta el 2026-08-03 se conserva íntegro en:

- `docs/VIDA_INTERNACIONAL_HISTORICO_2026-08-03.md`.

La evidencia del piloto operativo iniciado el 2026-08-04 se conserva en:

- `docs/PILOTO_IGLESIA_ACTIVO_2026-08-04.md`;
- `docs/MANUAL_PILOTO_POR_ROLES_2026-08-04.md`;
- `docs/PILOTO_P1_PRODUCCION_Y_CALENDARIO_2026-08-04.md`.

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
14. **Primer estado de superficies desplegables nuevas:** cualquier opción, sección o grupo desplegable nuevo debe iniciar contraído y volver a iniciar contraído cuando la persona sale de la página y regresa, salvo que exista una razón funcional explícita para abrirlo automáticamente.
15. **Badge como guía de pendiente:** cuando se implemente un badge nuevo, debe ayudar a conducir desde el acceso general hasta el elemento concreto pendiente. La extensión de esta regla a módulos ya cerrados queda diferida hasta terminar los bloques funcionales pendientes.

## REGLAS ESTRICTAS DE PRESERVACIÓN Y EJECUCIÓN

1. Un pedido del usuario es un contrato literal de alcance. Modificar únicamente lo solicitado.
2. Está prohibido aprovechar un cambio para:
   - rediseñar otras áreas;
   - reorganizar código no relacionado;
   - renombrar componentes;
   - cambiar estilos globales;
   - actualizar dependencias;
   - limpiar código ajeno al problema;
   - agregar mejoras no solicitadas.
3. Antes de modificar, identificar el componente y la causa real. Si existen parches anteriores interfiriendo, consolidarlos únicamente cuando afecten directamente el cambio pedido.
4. Todo lo que ya funciona se considera BLOQUEADO POR DEFECTO. Esto incluye datos, guardado, navegación, permisos, historial, Biblia, Estudios, Hebreo, Centro Pastoral, Ministerios, Calendario, notificaciones, imágenes, textos, capas y cualquier comportamiento previamente aprobado.
5. Si para cumplir el pedido fuera indispensable alterar una funcionalidad aprobada, DETENERSE antes de modificarla y explicar exactamente por qué.
6. Cuando una clase, componente o función compartida pueda afectar otras pantallas, aislar primero el cambio para evitar efectos secundarios.
7. No marcar un cambio como corregido solo porque el código compiló. Verificar:
   - diff exacto;
   - build;
   - Preview correspondiente al head nuevo.
8. Máximo UN Preview por bloque de trabajo.
9. No enviar avances intermedios salvo bloqueo real. Ejecutar directamente y entregar resultado.
10. La entrega normal será únicamente:
    - qué cambió;
    - Preview exacto;
    - checklist breve;
    - qué falta verificar.
11. Si no existe validación visual directa, usar exactamente:
    “Cambio aplicado y compilado; falta validación visual tuya.”
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

Cerrada y validada. Pushes, destinos directos, solicitudes de ingreso, bienvenida ministerial, identidades de Avisos y badges derivados de estado real permanecen como comportamiento aprobado.

## Identidad Comunitaria y Perfil

Cerrada y validada. `profiles.avatar_url`, almacenamiento de avatar, encuadre, ficha integral de miembro y reutilización de identidad visual permanecen como comportamiento aprobado.

## Pulido de experiencia / Calendario e Inicio

Cerrado y estabilizado. Calendario e Inicio conservan su base móvil aprobada y no deben degradarse.

# PILOTO OPERATIVO — EN PAUSA

Estado desde 2026-08-07: **PAUSADO POR DECISIÓN DEL USUARIO**.

Se conservan tablas, RLS, Centro de Análisis, datos, reportes, onboarding y Ayuda Solidaria, pero no debe ejecutarse telemetría exclusiva del piloto ni reactivarse P1/P2/P3 mientras esta prioridad siga en pausa.

# FASES D–H — CIERRES PRESERVADOS

Las FASES D, E, F, G y H permanecen cerradas y aprobadas según sus evidencias y migraciones ya versionadas. No deben reabrirse salvo bug comprobable o una prioridad futura explícitamente documentada.

# FASE I — DIFERIDA HASTA EL CIERRE FINAL — GUÍA INTERACTIVA Y AYUDA CONTEXTUAL POR ROL

FASE I se realizará al final del desarrollo de VIDA Internacional, cuando la aplicación y sus herramientas hayan quedado terminadas y aprobadas.

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

## Centro Pastoral — Editor visual · CERRADO Y APROBADO — 2026-09-01

El Centro Pastoral queda funcional y visualmente aprobado. No reabrir salvo bug comprobable o nueva prioridad explícitamente documentada.

# PRIORIDAD ACTIVA — EXPANSIÓN FUNCIONAL FINAL ANTES DE FASE I

Esta prioridad reúne las últimas funciones nuevas que deben completarse antes de iniciar FASE I — Guía interactiva y ayuda contextual por rol.

## Bloque 1 — Versículo del día y Planes de lectura — COMPLETADO Y APROBADO — 2026-09-02

Versículo diario, recordatorio configurable y catálogo de planes temáticos con progreso quedaron aprobados.

## Bloque 2 — Ayuda y Sembrar — COMPLETADO Y APROBADO — 2026-09-03

Centro de Ayuda unificado, privacidad, conversaciones directas, inventario, siembras y badge-guía quedaron aprobados.

## Bloque 3 — Experiencia para músicos — COMPLETADO Y APROBADO — 2026-09-07

Objetivo:
Convertir el repertorio/programación musical existente en una herramienta utilizable durante el servicio y no únicamente en una lista de canciones.

Alcance aprobado:
- Setlist ordenado del servicio.
- Vista práctica de canción, tono, acordes y contenido necesario para tocar.
- Navegación rápida entre canción actual, anterior y siguiente.
- Posibilidad de transponer las notas/acordes cuando sea necesario.
- El líder autorizado puede cambiar tono, transponer y modificar la versión oficial de acordes.
- Los músicos pueden consultar y utilizar la versión preparada, pero no alterar la versión oficial sin permiso.
- Preservar Programación Ministerial, repertorio, permisos e historial existentes.

## Bloque 4 — Discipulado — ACTIVO

Objetivo:
Permitir que miembros asignados completen un curso de discipulado dentro de VIDA, mediante lecciones en video, evaluación y aprobación pastoral.

Alcance previsto:
- Pastor/Administrador puede crear y administrar cursos de discipulado o asignar una persona autorizada para gestionarlos.
- Cada curso puede contener lecciones ordenadas con video mediante enlace y contenido complementario breve.
- Pastor/Administrador autorizado puede crear preguntas y respuestas para una evaluación final o por curso.
- El usuario asignado puede recorrer las lecciones y posteriormente presentar la evaluación dentro de la app.
- El sistema guarda avance, intento y calificación real por usuario.
- Pastor/Administrador autorizado puede revisar la calificación y aprobar o rechazar el discipulado de la persona.
- Una persona aprobada obtiene un indicador discreto visible en su perfil que confirma que completó el discipulado.
- El estado de discipulado no sustituye roles, liderazgo ni permisos ministeriales existentes.
- Antes de implementar nuevas tablas, RLS, permisos, asignaciones o estados de aprobación se presentará exactamente el cambio, impacto y reversión para aprobación explícita.

## Bloque 5 — Alertas pastorales urgentes — EN PAUSA / PENDIENTE DE DECISIÓN

Este bloque queda diferido por decisión del usuario debido a privacidad, permisos y notificaciones sensibles.

Objetivo conservado:
Diferenciar una consulta normal de una situación que necesita atención pastoral rápida.

No implementar este bloque mientras permanezca en pausa.

FASE I continúa DIFERIDA hasta completar, validar y cerrar los bloques funcionales finales que el usuario mantenga autorizados.

# Siguiente prioridad autorizada

**Bloque 4 — Discipulado — ACTIVO.**