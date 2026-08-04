# Piloto operativo en la iglesia — estado activo

Fecha de decisión: 2026-08-04

## Prioridad aprobada

El desarrollo de **FASE D — IA Bíblica Avanzada** queda en pausa temporal, conservando intacto todo el avance confirmado hasta el Bloque 5.

La prioridad operativa actual es preparar VIDA Internacional para pruebas reales dentro de la iglesia, comenzando por:

1. Calendario y asignaciones.
2. Comunicación y avisos de ministerios.
3. Dashboards de ministerios.
4. Recorridos móviles de líderes, servidores y congregantes.
5. Centro de Análisis, onboarding y reporte de problemas del piloto.

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

## Ministerios — bloque integrado

- safe area y jerarquía corregidas en **Avisos y noticias**;
- encabezado grande y lista agrupada inspirada en iOS;
- dashboard compartido de ministerios con composición minimalista;
- portada, avatar, colores, fuentes, accesos, eventos, publicaciones y panel del líder conservados;
- permisos, RLS, flujos de ingreso y lógica de publicación sin cambios;
- navegación inferior montada sobre el viewport para permanecer fija durante el scroll.

## Bloque activo — preparación del piloto por roles

Se autoriza un piloto controlado con pastores, líderes y servidores seleccionados. El bloque debe incluir:

- selección explícita de participantes;
- recorrido inicial distinto por jerarquía;
- activación guiada de notificaciones;
- ejemplos visibles que desaparecen al escribir y nunca se guardan automáticamente;
- registro mínimo de sesiones y pantallas visitadas, sin contenido sensible;
- Centro de Análisis para pastores y administradores;
- reporte de problemas desde Perfil;
- clasificación de reportes como nuevo, revisando o resuelto;
- documentación de las tareas de prueba por rol.

### Privacidad del piloto

La analítica no debe registrar:

- contraseñas;
- contenido de notas bíblicas;
- búsquedas o textos bíblicos privados;
- contenido pastoral;
- mensajes escritos dentro de formularios;
- información de otras personas que no sea necesaria para la operación.

Solo se registran eventos funcionales mínimos, como inicio de sesión piloto, pantalla visitada, finalización del recorrido y reportes enviados voluntariamente.

## Notas bíblicas y futura FASE F

El espacio **Biblia → Notas** ya cubre la mayor parte del objetivo funcional del cuaderno de predicaciones: notas por versículo, estudio, predicación o uso personal; referencias; paquetes pastorales; búsqueda; filtros y guardado automático.

La futura FASE F no debe crear otro cuaderno duplicado. Debe evolucionar el espacio existente con:

- sincronización segura entre dispositivos;
- respaldo en Supabase;
- número correlativo de prédica;
- fecha, serie, lugar, predicador y estado;
- exportación o impresión.

Esta evolución permanece fuera del bloque piloto actual.

## Permisos que deben conservarse

- Administrador y pastor: gestión global según las reglas existentes.
- Líder: administración únicamente de sus ministerios.
- Servidor y congregante: acceso de consulta y participación según membresía, sin controles administrativos.

## Evidencia previa

- PR #175;
- commit funcional fusionado `a2bd80c5e3bc36640cd68aee20df77975a222c57`;
- preview Vercel `dpl_AzehFAXu93irfAQZtK9GZPNa2hbz` — `READY`;
- cambio limitado a calendario, avisos, dashboard compartido y documentación del piloto.
