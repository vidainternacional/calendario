# VIDA INTERNACIONAL — Documento maestro de fases

Última actualización: 2026-08-07

Fase / prioridad activa: **PULIDO DE EXPERIENCIA — Entrada limpia y fluidez del Calendario**

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

## Estado de fases

| Fase | Objetivo principal | Estado |
|---|---|---|
| FASE A | Experiencia profesional mobile first | COMPLETADA |
| FASE B | Optimización de UX, transiciones, carga, errores y retroalimentación | COMPLETADA |
| FASE C | Panel Pastoral, versículos, bosquejos, biblioteca y materiales | **COMPLETADA — 2026-07-29** |
| FASE D | IA Bíblica Avanzada, fuentes, contexto, comparaciones, cronologías y mapas | **EN PAUSA OPERATIVA — BLOQUE 5 CONSERVADO** |
| FASE E | Rendimiento, seguridad, escalabilidad, pruebas y documentación | PENDIENTE |
| FASE F | Evolución correlativa de Biblia → Notas | PENDIENTE |

# PRIORIDAD ACTIVA — PULIDO DE EXPERIENCIA

El usuario decidió el 2026-08-07 retirar temporalmente el modo piloto de la experiencia normal porque su onboarding y acompañamiento interfieren con las pruebas iniciales de la aplicación.

## Objetivo inmediato

Dejar VIDA libre de interferencias del piloto y conseguir que las transiciones del Calendario sean fluidas en dispositivos móviles, especialmente iPhone, antes de continuar con nuevas superficies de producto.

## Alcance autorizado

1. Desactivar de forma no destructiva el modo piloto en la experiencia visible y en el arranque normal.
2. Desactivar el onboarding/gate, telemetría y controles visibles exclusivos del piloto mientras esta prioridad siga activa.
3. Conservar tablas, migraciones, RLS, datos, código histórico y evidencia del piloto para poder retomarlo más adelante.
4. Optimizar las animaciones del Calendario, eliminando trabajo de layout innecesario y priorizando transformaciones aceleradas por GPU.
5. Reducir el coste de render de vistas largas del Calendario sin cambiar su contrato funcional.
6. Respetar `prefers-reduced-motion` y conservar accesibilidad.
7. Verificar build y despliegue productivo antes de declarar cada bloque terminado.

## Criterio de cierre de esta prioridad

- la aplicación abre sin onboarding, gate ni interferencias del modo piloto;
- la navegación habitual sigue funcionando por rol y permisos existentes;
- el Calendario mantiene Año, Mes, Día, 2 días, Lista/Agenda y sus controles;
- Año → Mes y retornos se perciben fluidos, sin saltos ni bloqueos notorios en iPhone;
- build y producción quedan en estado aprobado;
- validación visual del usuario completada.

# SIGUIENTE BLOQUE PROPUESTO — RECORRIDO GUIADO POR SECCIONES

Estado: **DOCUMENTADO, NO INICIAR HASTA CERRAR EL PULIDO ACTIVO**.

Cuando el usuario apruebe la fluidez y entrada limpia, se construirá un recorrido de primera entrada que explique la aplicación por secciones.

Principios ya definidos:

- se mostrará a una persona en su primera entrada;
- explicará para qué sirve cada sección y qué acciones puede realizar según su rol;
- será recorrible por partes, evitando bloquear toda la aplicación con un único onboarding largo;
- podrá repetirse manualmente desde un punto de ayuda o perfil;
- la misma fuente estructurada de contenidos servirá para generar posteriormente el manual escrito de VIDA;
- el recorrido no dependerá del antiguo modo piloto ni de una cohorte de prueba.

No implementar este recorrido antes de que la prioridad activa de pulido esté cerrada y aprobada.

# PILOTO OPERATIVO — EN PAUSA

Estado desde 2026-08-07: **PAUSADO POR DECISIÓN DEL USUARIO**.

El piloto no se elimina de la base técnica. Se conserva para una futura reactivación controlada.

Se preserva:

- tablas de participantes, onboarding, eventos mínimos de uso y reportes;
- migraciones y políticas RLS;
- Centro de Análisis y código asociado;
- datos ya generados;
- Ayuda Solidaria, que es una función operativa independiente y no debe borrarse por pausar el piloto;
- evidencia técnica y manuales existentes.

Mientras esté en pausa:

- no debe aparecer onboarding automático del piloto;
- no debe ejecutarse telemetría exclusiva del piloto en la navegación normal;
- no debe bloquearse una sesión por pertenencia o estado de la cohorte;
- no avanzar P1, P2 ni P3;
- no modificar roles o liderazgo para completar una cohorte.

## Estado conservado del piloto

P1 había alcanzado producción con infraestructura de análisis, onboarding, selección de participantes, reporte de problemas y Ayuda Solidaria. La cohorte inicial contenía 1 administrador y 2 servidores. Faltaba validar una cuenta independiente de líder o pastor y completar pruebas reales por rol.

La reactivación futura deberá comenzar desde ese estado conservado, no desde cero.

# FASE D — ESTADO CONSERVADO EN PAUSA

La FASE D permanece detenida en **Bloque 5 — Cronologías y Mapas**.

Estado preservado:

- esquema de lugares, periodos, eventos y relaciones aplicado con RLS;
- paquete `rome-pilot-v1` publicado y aprobado;
- 1 lugar, 1 periodo, 2 eventos y 2 relaciones habilitados;
- interfaz todavía no conectada;
- Bloque 6 no iniciado.

Cuando este documento reactive FASE D, el siguiente punto será integrar el servicio de cronologías y mapas en una superficie visual limitada a Roma. No ampliar el catálogo antes de validar ese piloto.

# Notas bíblicas y futura FASE F

**Biblia → Notas** ya es la base funcional del cuaderno. La FASE F no debe crear otro cuaderno; se redefine como evolución del espacio existente con sincronización entre dispositivos, respaldo en Supabase, número correlativo de prédica, fecha, serie, lugar, predicador, estado y exportación.

# Evidencia reciente del Calendario

- contrato visual de fechas y eventos aprobado durante el pulido anterior;
- icono inferior de Calendario refinado en commit `f7eda6c5c78e66ac09a21da5a15274745b2fa3e1`;
- primera transición Año → Mes con spring implementada en commit `d3ba0c2e04ec01f7695dd637c8451275c955b52f`;
- el usuario confirmó que la dirección visual es correcta pero reportó tirones y falta de fluidez, por lo que esa implementación debe optimizarse antes de continuar.

# Siguiente punto autorizado

1. Desactivar la experiencia automática y telemetría visible/exclusiva del piloto sin borrar sus datos.
2. Identificar y corregir los cuellos de botella de animación en Calendario.
3. Desplegar y validar el bloque optimizado en producción.
4. Solicitar validación visual del usuario en iPhone.
5. Solo después de su aprobación, preparar el recorrido guiado por secciones y su fuente común para el futuro manual.

No reanudar el piloto operativo, FASE D, FASE E, FASE F ni el recorrido guiado mientras este bloque de pulido no esté cerrado.