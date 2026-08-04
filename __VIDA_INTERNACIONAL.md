# VIDA INTERNACIONAL — Documento maestro de fases

Última actualización: 2026-08-04

Fase activa: **PILOTO OPERATIVO — Validación funcional con cuentas reales**

Este archivo es el control oficial y versionado del proyecto. Antes de trabajar debe leerse este estado y continuar únicamente con la fase o prioridad marcada como activa.

El registro técnico acumulado hasta el 2026-08-03 se conserva íntegro en:

- `docs/VIDA_INTERNACIONAL_HISTORICO_2026-08-03.md`.

## Reglas de ejecución

1. Trabajar exclusivamente sobre los objetivos de la prioridad activa.
2. No reanudar una fase en pausa ni iniciar una fase posterior mientras este documento no lo autorice expresamente.
3. Cada cierre debe incluir evidencia técnica, validación funcional y documentación.
4. Los hallazgos fuera de alcance se documentan para una fase posterior, sin ampliar el bloque activo.
5. No declarar una función lista para el piloto sin build aprobado y validación en producción.
6. Los cambios de permisos, roles, liderazgo o datos sensibles requieren una decisión explícita y recuperación definida.

## Estado de fases

| Fase | Objetivo principal | Estado |
|---|---|---|
| FASE A | Experiencia profesional mobile first | COMPLETADA |
| FASE B | Optimización de UX, transiciones, carga, errores y retroalimentación | COMPLETADA |
| FASE C | Panel Pastoral, versículos, bosquejos, biblioteca y materiales | **COMPLETADA — 2026-07-29** |
| FASE D | IA Bíblica Avanzada, fuentes, contexto, comparaciones, cronologías y mapas | **EN PAUSA OPERATIVA — BLOQUE 5 CONSERVADO** |
| FASE E | Rendimiento, seguridad, escalabilidad, pruebas y documentación | PENDIENTE |
| FASE F | Evolución correlativa de Biblia → Notas | PENDIENTE |

# PRIORIDAD ACTIVA — PILOTO OPERATIVO EN LA IGLESIA

El usuario autorizó el 2026-08-04 pausar temporalmente la ampliación de IA Bíblica Avanzada para preparar VIDA para una prueba real con pastores, líderes y servidores seleccionados.

## Objetivo

Validar VIDA con personas reales antes de ampliar funciones, midiendo adopción, permisos, facilidad de uso, notificaciones y recorridos operativos completos.

## Alcance autorizado

- Centro de Análisis del piloto.
- Selección explícita de participantes.
- Recorrido inicial diferente para administrador, pastor, líder, servidor y congregante.
- Activación y validación de notificaciones push.
- Pruebas completas de calendario, asignaciones, avisos, ministerios e intercambios.
- Reporte de problemas desde Perfil.
- Clasificación de incidencias como nuevas, en revisión o resueltas.
- Textos de ejemplo que desaparecen al escribir y nunca se guardan automáticamente.
- Manuales y tareas de prueba por jerarquía.
- Validación en iPhone y Android.
- Centro de Análisis interactivo con detalle real por período, participante, pantalla y operación.
- Ayuda Solidaria para solicitar bolsa alimenticia, registrar donaciones o siembras y dar seguimiento privado.

## Privacidad de la analítica

Puede registrarse únicamente sesión piloto, ruta visitada, finalización del recorrido, estado de notificaciones, acciones operativas agregadas y reportes voluntarios.

No debe registrarse contenido de notas bíblicas, búsquedas privadas, contraseñas, mensajes pastorales, conversaciones ni textos escritos en formularios.

Las solicitudes de Ayuda Solidaria son información sensible. El Centro de Análisis únicamente puede mostrar cantidades agregadas. Los nombres, motivos, teléfonos y respuestas quedan limitados al solicitante y al equipo pastoral o administrativo autorizado.

## Permisos que deben conservarse

### Administrador y pastor

- Gestión global según las reglas existentes.
- Acceso al Centro de Análisis.
- Selección de participantes.
- Revisión y clasificación de reportes.
- Gestión privada de solicitudes y aportes de Ayuda Solidaria.

### Líder

- Administración únicamente de los ministerios donde figura como líder.
- Creación de eventos y avisos dentro de esos ministerios.
- Sin acceso al análisis global.
- Sin acceso al detalle privado de Ayuda Solidaria, salvo autorización pastoral futura expresamente documentada.

### Servidor y congregante

- Consulta y participación según membresía y asignaciones.
- Sin creación administrativa, gestión de miembros ni aprobación de solicitudes.
- Puede enviar una solicitud propia o registrar un aporte propio y consultar únicamente su seguimiento.

# Bloques del piloto

## Bloque P1 — Base de análisis y acompañamiento

Estado: **PRODUCCIÓN READY — VALIDACIÓN FUNCIONAL EN CURSO; EXTENSIÓN INTERACTIVA PENDIENTE DE DESPLIEGUE**.

Incluye:

- cuatro tablas con RLS para participantes, onboarding, eventos mínimos de uso y reportes;
- Centro de Análisis;
- selección de participantes;
- onboarding por rol;
- repetición del recorrido desde Perfil;
- reporte de problemas;
- ejemplos en avisos y notificaciones;
- manual por jerarquía;
- dashboard interactivo con filtros de 7, 30 y 90 días;
- paneles detallados de participantes, onboarding, dispositivos, rutas, problemas, eventos, asignaciones, avisos e intercambios;
- Ayuda Solidaria con solicitud, aporte, seguimiento y administración privada.

### Evidencia técnica confirmada

- migraciones `piloto_analitica_onboarding` y `piloto_revoke_anon_manager` aplicadas;
- RLS habilitada en las cuatro tablas del piloto;
- ejecución anónima revocada en el helper de gestión;
- PR #180 fusionado mediante commit `4c1dffcb67f0623c53c8808fd42b5958f2dee8ab`;
- build final del bloque base: run `30939906829` — `success`;
- corrección inicial de selección de fechas: PR #182 y commit `40723b45abbb300c027d544ec9aca8d5f80df541`;
- build de esa corrección: run `30946777843` — `success`;
- preview `dpl_2UsVhUkPcWuPMSfeKj9ubHxVzP9m` — `READY`;
- producción `dpl_2UN2e4eiCvPo9gMVrrhqiYfoTZKF` — `READY`;
- errores runtime observados después del despliegue base: 0;
- ajuste visual definitivo del calendario fusionado en PR #184, commit `1e5763a304a937097cb41dc6394f34281337a4d9`;
- build del ajuste definitivo: run `30948092161` — `success`;
- despliegue del ajuste definitivo pendiente por límite diario temporal de Vercel;
- migraciones `ayuda_solidaria_solicitudes_aportes` y `optimizar_ayuda_solidaria_rls_indices` aplicadas en Supabase;
- build del dashboard interactivo y Ayuda Solidaria: run `30951024758` — `success`;
- PR #185 abierto y listo para revisión final y fusión.

### Contrato visual definitivo del calendario

Implementado en código y pendiente de validación productiva:

- hoy: círculo morado relleno de forma permanente;
- cualquier otro día seleccionado: aro morado sin relleno;
- seleccionar hoy conserva el relleno;
- puntos o barras de eventos en una franja independiente debajo del número;
- sin fondo completo de celda ni sobreposición entre el aro y el indicador del evento;
- aplicación en Mes, Agenda, Semana y Día;
- `aria-pressed` conservado.

### Extensión interactiva del Centro de Análisis

Implementada en PR #185:

- jerarquía visual oscura inspirada en la referencia entregada, adaptada a mobile first y legibilidad real;
- filtros de 7, 30 y 90 días;
- índice agregado de adopción;
- tarjetas interactivas para participantes, actividad, recorrido y notificaciones;
- detalle de operaciones reales: eventos, asignaciones, avisos e intercambios;
- panel de rutas más visitadas con visitas y personas únicas;
- detalle de problemas reportados;
- enlace a Gestión Solidaria;
- conservación de la gestión de participantes y clasificación de incidencias existentes.

No se implementó un mapa de calor que capture gestos o contenido sensible. Las métricas se construyen únicamente con rutas, acciones permitidas y datos operativos agregados.

### Ayuda Solidaria

Implementada en PR #185:

- ruta personal `/ayuda-solidaria`;
- solicitud privada de bolsa alimenticia;
- registro de donación de alimentos, siembra económica, voluntariado u otro aporte;
- seguimiento personal de estados y respuestas;
- cancelación por el usuario mientras el registro siga en etapa inicial;
- panel privado `/admin/ayuda-solidaria` para pastor o administrador;
- filtros, búsqueda, respuestas y cambios de estado;
- acceso desde Perfil y Administración;
- no procesa pagos dentro de VIDA: registra la intención y permite coordinación posterior.

Seguridad validada:

- usuario autenticado puede insertar y leer únicamente sus propios registros;
- prueba transaccional: servidor vio 1 de 2 solicitudes temporales;
- prueba transaccional: administrador vio las 2 solicitudes temporales;
- las pruebas se ejecutaron con rollback y no dejaron datos falsos;
- RLS activa en ambas tablas;
- políticas optimizadas con `(select auth.uid())`;
- índices añadidos para responsables de revisión;
- nombres y detalles nunca se exponen en el dashboard agregado.

### Cohorte inicial

Se activaron tres cuentas existentes dentro de `piloto-inicial`:

- 1 administrador;
- 2 servidores;
- 5 suscripciones push acumuladas.

El onboarding, los eventos de uso y los reportes comenzarán cuando estas personas vuelvan a abrir la aplicación.

### Bloqueo pendiente

No existe actualmente una cuenta activa de pastor ni una cuenta de líder distinta del administrador.

No cambiar roles o liderazgo sin decisión explícita del usuario, porque eso modifica permisos reales. Para completar P1 debe definirse qué cuenta será pastor o líder, o registrarse una nueva cuenta de prueba.

### Criterio pendiente de cierre

- PR #185 fusionado;
- despliegue productivo del dashboard interactivo y Ayuda Solidaria en estado `READY`;
- recorrido inicial comprobado en la cuenta administradora;
- acceso manual a Administración → Centro de Análisis;
- paneles de detalle comprobados en iPhone;
- aparición de las tres cuentas de la cohorte;
- reporte de prueba visible y clasificable;
- envío y cancelación de una solicitud de Ayuda Solidaria de prueba;
- registro y cancelación de un aporte de prueba;
- gestión pastoral o administrativa de ambos registros;
- recorrido comprobado en las dos cuentas de servidor;
- al menos una cuenta de líder o pastor disponible y validada;
- comprobación visual del contrato definitivo de fechas y puntos de eventos en iPhone.

## Bloque P2 — Recorridos operativos por rol

Estado: PENDIENTE.

Debe validar:

1. Administrador o pastor crea un evento general y un mensaje pastoral.
2. Líder crea un evento ministerial, asigna un servidor y publica un aviso.
3. Servidor recibe la notificación, abre el evento y prueba Intercambio.
4. Congregante consulta avisos y calendario sin controles administrativos.
5. Los accesos directos escritos manualmente no permiten saltar permisos.

No iniciar P2 hasta cerrar P1.

## Bloque P3 — Prueba controlada de siete días

Estado: PENDIENTE.

Debe incluir grupo reducido, revisión diaria de errores críticos, métricas de adopción y notificaciones, correcciones limitadas a bloqueos reales y cierre documentado.

# Notas bíblicas y futura FASE F

**Biblia → Notas** ya es la base funcional del cuaderno. La FASE F no debe crear otro cuaderno; se redefine como evolución del espacio existente con sincronización entre dispositivos, respaldo en Supabase, número correlativo de prédica, fecha, serie, lugar, predicador, estado y exportación.

Esta evolución permanece fuera del piloto actual.

# FASE D — ESTADO CONSERVADO EN PAUSA

La FASE D permanece detenida en **Bloque 5 — Cronologías y Mapas**.

Estado preservado:

- esquema de lugares, periodos, eventos y relaciones aplicado con RLS;
- paquete `rome-pilot-v1` publicado y aprobado;
- 1 lugar, 1 periodo, 2 eventos y 2 relaciones habilitados;
- interfaz todavía no conectada;
- Bloque 6 no iniciado.

Cuando este documento reactive FASE D, el siguiente punto será integrar el servicio de cronologías y mapas en una superficie visual limitada a Roma. No ampliar el catálogo antes de validar ese piloto.

# Evidencia activa

- `docs/PILOTO_IGLESIA_ACTIVO_2026-08-04.md`;
- `docs/MANUAL_PILOTO_POR_ROLES_2026-08-04.md`;
- `docs/PILOTO_P1_PRODUCCION_Y_CALENDARIO_2026-08-04.md`;
- PR #180 — Centro de Análisis y onboarding;
- PR #182 — selección inicial consistente de fechas;
- PR #184 — contrato definitivo de hoy, selección y puntos de eventos;
- PR #185 — dashboard interactivo y Ayuda Solidaria;
- historial anterior en `docs/VIDA_INTERNACIONAL_HISTORICO_2026-08-03.md`.

# Siguiente punto autorizado

1. Fusionar PR #185 después de confirmar sus checks.
2. Esperar o ejecutar el despliegue productivo cuando Vercel libere el límite diario.
3. Comprobar en iPhone el dashboard, sus paneles y la selección definitiva del calendario.
4. Enviar una solicitud y un aporte de prueba; verificar aislamiento y gestión administrativa.
5. Completar o avanzar el recorrido inicial, verificar la cohorte y enviar un reporte de prueba.
6. Define qué cuenta usaremos como líder o pastor para completar la jerarquía de P1.

No reanudar el estudio bíblico avanzado, no iniciar P2 y no crear un cuaderno separado durante este bloque.
