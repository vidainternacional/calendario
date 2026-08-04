# Piloto P1 en producción y corrección de selección del calendario

Fecha: 2026-08-04

## Alcance

Este registro documenta dos avances vinculados a la prioridad activa del piloto:

1. despliegue productivo del Bloque P1 — Centro de Análisis, onboarding por rol, telemetría mínima y reporte de problemas;
2. corrección de la fecha seleccionada en las vistas del calendario.

## Producción

El commit `40723b45abbb300c027d544ec9aca8d5f80df541` contiene el Bloque P1 fusionado previamente y la corrección final del calendario.

Deployment de producción:

- ID: `dpl_2UN2e4eiCvPo9gMVrrhqiYfoTZKF`;
- estado: `READY`;
- alias principal: `calendario-vida-internacional.vercel.app`;
- runtime errors observados después del despliegue: 0.

Validación automatizada de la corrección:

- PR #182;
- GitHub Actions `CI temporal`;
- run `30946777843` — `success`;
- preview `dpl_2UsVhUkPcWuPMSfeKj9ubHxVzP9m` — `READY`.

## Corrección del calendario

Problema observado en iPhone:

- Mes mostraba un círculo morado para la fecha actual o seleccionada;
- Agenda mostraba únicamente un fondo tenue;
- Semana y Día podían hacer parecer que la selección se había perdido.

Contrato visual corregido:

- fecha seleccionada: círculo morado sólido;
- fecha de hoy cuando no está seleccionada: aro morado;
- fondo tenue de la celda: apoyo secundario;
- comportamiento compartido por Mes, Agenda, Semana y Día;
- controles de fecha con `aria-pressed`.

No se modificaron eventos, asignaciones, permisos, Supabase ni navegación.

## Cohorte inicial activada

Se activaron las tres cuentas existentes y habilitadas dentro de `piloto-inicial`:

- 1 administrador;
- 2 servidores;
- 5 suscripciones push acumuladas entre las tres cuentas.

Todas las filas fueron creadas o reactivadas de manera idempotente en `public.pilot_participants` con el administrador existente como invitador.

Estado posterior:

- participantes activos: 3;
- progreso de onboarding: 0, pendiente de que cada persona abra la aplicación;
- eventos de uso del piloto: 0 antes del primer acceso;
- reportes del piloto: 0 antes de la primera prueba.

## Bloqueo real pendiente

Actualmente no existe una cuenta activa de pastor ni una cuenta que figure como líder de ministerio distinta del administrador.

Para validar completamente el recorrido por jerarquía se necesita una decisión del usuario:

- crear o activar una cuenta de pastor;
- designar una cuenta existente como líder de un ministerio;
- o registrar una nueva cuenta de líder para la prueba.

No debe modificarse el rol o liderazgo de una persona sin esa decisión explícita, porque cambiaría sus permisos reales y no solamente el recorrido del piloto.

## Siguiente validación manual

1. Cerrar y volver a abrir la aplicación en la cuenta administradora.
2. Completar o avanzar el recorrido inicial.
3. Entrar en Administración → Centro de Análisis.
4. Confirmar que aparecen las tres personas de la cohorte.
5. Abrir Calendario y comprobar Mes, Agenda, Semana y Día seleccionando una fecha distinta de hoy.
6. Enviar un reporte de prueba desde Perfil y confirmar su aparición en el Centro de Análisis.
7. Repetir el recorrido en las dos cuentas de servidor.

El Bloque P1 permanece en validación funcional hasta completar estas comprobaciones y disponer de una cuenta de líder o pastor para cubrir la jerarquía pendiente.
