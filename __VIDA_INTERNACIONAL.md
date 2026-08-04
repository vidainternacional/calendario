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

## Privacidad de la analítica

Puede registrarse únicamente sesión piloto, ruta visitada, finalización del recorrido, estado de notificaciones, acciones operativas agregadas y reportes voluntarios.

No debe registrarse contenido de notas bíblicas, búsquedas privadas, contraseñas, mensajes pastorales, conversaciones ni textos escritos en formularios.

## Permisos que deben conservarse

### Administrador y pastor

- Gestión global según las reglas existentes.
- Acceso al Centro de Análisis.
- Selección de participantes.
- Revisión y clasificación de reportes.

### Líder

- Administración únicamente de los ministerios donde figura como líder.
- Creación de eventos y avisos dentro de esos ministerios.
- Sin acceso al análisis global.

### Servidor y congregante

- Consulta y participación según membresía y asignaciones.
- Sin creación administrativa, gestión de miembros ni aprobación de solicitudes.

# Bloques del piloto

## Bloque P1 — Base de análisis y acompañamiento

Estado: **PRODUCCIÓN READY — VALIDACIÓN FUNCIONAL EN CURSO**.

Incluye:

- cuatro tablas con RLS para participantes, onboarding, eventos mínimos de uso y reportes;
- Centro de Análisis;
- selección de participantes;
- onboarding por rol;
- repetición del recorrido desde Perfil;
- reporte de problemas;
- ejemplos en avisos y notificaciones;
- manual por jerarquía.

### Evidencia técnica confirmada

- migraciones `piloto_analitica_onboarding` y `piloto_revoke_anon_manager` aplicadas;
- RLS habilitada en las cuatro tablas nuevas;
- ejecución anónima revocada en el helper de gestión;
- PR #180 fusionado mediante commit `4c1dffcb67f0623c53c8808fd42b5958f2dee8ab`;
- build final del bloque: run `30939906829` — `success`;
- corrección de selección de fechas: PR #182 y commit `40723b45abbb300c027d544ec9aca8d5f80df541`;
- build de la corrección: run `30946777843` — `success`;
- preview `dpl_2UsVhUkPcWuPMSfeKj9ubHxVzP9m` — `READY`;
- producción `dpl_2UN2e4eiCvPo9gMVrrhqiYfoTZKF` — `READY`;
- errores runtime observados después del despliegue: 0.

### Corrección confirmada del calendario

El contrato visual de selección quedó unificado:

- fecha seleccionada: círculo morado sólido;
- hoy no seleccionado: aro morado;
- aplicación en Mes, Agenda, Semana y Día;
- fondo tenue conservado como señal secundaria;
- `aria-pressed` incorporado.

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

- recorrido inicial comprobado en la cuenta administradora;
- acceso manual a Administración → Centro de Análisis;
- aparición de las tres cuentas de la cohorte;
- reporte de prueba visible y clasificable;
- recorrido comprobado en las dos cuentas de servidor;
- al menos una cuenta de líder o pastor disponible y validada;
- comprobación visual de la selección de fechas en iPhone.

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
- PR #182 — selección consistente de fechas;
- historial anterior en `docs/VIDA_INTERNACIONAL_HISTORICO_2026-08-03.md`.

# Siguiente punto autorizado

1. El usuario cierra y vuelve a abrir la aplicación con su cuenta administradora.
2. Completa o avanza el recorrido inicial.
3. Entra en Administración → Centro de Análisis y verifica la cohorte.
4. Comprueba Mes, Agenda, Semana y Día seleccionando una fecha distinta de hoy.
5. Envía un reporte de prueba desde Perfil.
6. Define qué cuenta usaremos como líder o pastor para completar la jerarquía de P1.

No reanudar el estudio bíblico avanzado, no iniciar P2 y no crear un cuaderno separado durante este bloque.