# Piloto operativo en la iglesia — estado activo

Fecha de decisión: 2026-08-04

## Prioridad aprobada

El desarrollo de **FASE D — IA Bíblica Avanzada** queda en pausa temporal, conservando intacto todo el avance confirmado hasta el Bloque 5.

La prioridad operativa actual es preparar VIDA Internacional para pruebas reales dentro de la iglesia, comenzando por:

1. Calendario y asignaciones.
2. Comunicación y avisos de ministerios.
3. Dashboards de ministerios.
4. Recorridos móviles de líderes, servidores y congregantes.

No se debe continuar ampliando Biblia Profunda mientras esta prioridad permanezca activa.

## Criterio visual obligatorio

Los módulos principales deben sentirse como superficies nativas de una sola aplicación:

- ocupar el ancho útil completo;
- respetar las áreas seguras de iPhone;
- evitar páginas externas incrustadas o ventanas innecesarias;
- usar jerarquía tipográfica clara, controles compactos y separadores discretos;
- mantener funciones y permisos reales, sin botones decorativos sin soporte;
- conservar la identidad configurable de cada ministerio sin perder consistencia global.

## Calendario confirmado

El calendario fue aprobado visualmente por el usuario el 2026-08-04 con:

- Año, Mes, Semana, Día y Agenda;
- transición Año → Mes;
- búsqueda;
- creación de eventos según permisos;
- detalle de evento;
- intercambio de turnos;
- superficie edge-to-edge inspirada en iOS.

El ajuste Mes → Año quedó implementado sin reducir físicamente la pantalla mensual: ahora utiliza una salida breve y una aparición limpia de la vista anual.

## Ministerios — bloque actual

Primer bloque autorizado e integrado:

- safe area y jerarquía corregidas en **Avisos y noticias**;
- encabezado grande y lista agrupada inspirada en iOS;
- dashboard compartido de ministerios con composición minimalista;
- portada, avatar, colores, fuentes, accesos, eventos, publicaciones y panel del líder conservados;
- permisos, RLS, flujos de ingreso y lógica de publicación sin cambios.

## Permisos que deben conservarse

- Administrador y pastor: gestión global según las reglas existentes.
- Líder: administración únicamente de sus ministerios.
- Servidor y congregante: acceso de consulta y participación según membresía, sin controles administrativos.

## Evidencia del bloque

- PR #175;
- commit funcional fusionado `a2bd80c5e3bc36640cd68aee20df77975a222c57`;
- preview Vercel `dpl_AzehFAXu93irfAQZtK9GZPNa2hbz` — `READY`;
- cambio limitado a calendario, avisos, dashboard compartido y documentación del piloto.
