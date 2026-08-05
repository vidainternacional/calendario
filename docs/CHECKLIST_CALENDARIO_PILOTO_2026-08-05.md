# Checklist del calendario — Piloto operativo

Fecha: 2026-08-05

Alcance: validación funcional y mobile first del calendario durante el Bloque P1 del piloto. Este checklist no autoriza cambios de roles, RLS, ministerios ni permisos.

## 1. Navegación principal

- [x] Año abre un mes con un toque.
- [x] Mes abre un día con un toque.
- [x] Día regresa a Mes.
- [x] Mes regresa a Año.
- [x] Botones anterior y siguiente cambian el período visible.
- [x] Hoy conserva el contexto actual, excepto Año, que abre Mes.
- [ ] Validar en iPhone que ningún control queda debajo de la barra de estado o navegación inferior.
- [ ] Validar en Android que la navegación no produce overflow horizontal.

## 2. Vistas disponibles

- [x] Año.
- [x] Mes.
- [x] Día.
- [x] Tres días.
- [x] Semana.
- [x] Lista mensual.
- [x] Selector de vistas accesible desde la barra inferior.
- [ ] Confirmar en producción que el selector abre, cambia de vista y se cierra al tocar fuera.
- [ ] Confirmar que las vistas Día, Tres días y Semana pueden desplazarse verticalmente por las 24 horas.

## 3. Fechas y selección

- [x] El día actual conserva el estado visual prioritario.
- [x] Los días externos al mes no reciben interacción.
- [x] Los mini calendarios mantienen seis filas.
- [x] La vista mensual mantiene seis filas para evitar saltos de altura.
- [ ] Revisar visualmente el contrato de hoy y selección definido para el piloto.
- [ ] Comprobar meses que comienzan en sábado o domingo.
- [ ] Comprobar febrero en año normal y bisiesto.

## 4. Eventos y recordatorios

- [x] Los puntos del mes usan el color del calendario.
- [x] Día, Tres días y Semana muestran eventos con hora.
- [x] La franja de todo el día permanece separada de la línea de tiempo.
- [x] Lista agrupa eventos y recordatorios por fecha dentro del mes visible.
- [x] Tocar un elemento abre una ficha básica.
- [x] La ficha muestra fecha, hora, calendario, ministerio, ubicación y descripción cuando existen.
- [x] Los elementos abiertos desde el panel de calendarios llegan a la misma ficha.
- [ ] Probar un evento sin fecha final.
- [ ] Probar un evento de todo el día.
- [ ] Probar dos o más eventos solapados.
- [ ] Probar un recordatorio y un evento en la misma fecha.

## 5. Calendarios, fuentes y colores

- [x] El panel de calendarios permanece conectado.
- [x] La visibilidad de fuentes continúa dependiendo de las suscripciones existentes.
- [x] Los colores se resuelven desde el calendario de origen.
- [ ] Ocultar una fuente y confirmar que sus eventos desaparecen de todas las vistas.
- [ ] Volver a mostrarla y confirmar que reaparece sin recargar manualmente la PWA.

## 6. Creación y permisos

- [x] El botón Crear solo aparece cuando existe al menos un calendario editable.
- [x] La fecha inicial del formulario corresponde al día seleccionado.
- [x] No se modificaron roles, RLS, ministerios ni políticas de acceso.
- [ ] Administrador crea un evento general.
- [ ] Pastor crea un evento permitido.
- [ ] Líder crea únicamente dentro de un ministerio donde figura como líder.
- [ ] Servidor y congregante no reciben controles administrativos.
- [ ] Acceso directo escrito manualmente no permite saltar permisos.

## 7. Búsqueda y detalle

- [x] La búsqueda incluye título, ubicación, descripción, calendario y ministerio.
- [x] Abrir un resultado cierra la búsqueda y abre su ficha.
- [x] La ficha puede cerrarse tocando fuera, usando el botón Cerrar o presionando Escape en escritorio.
- [ ] Probar búsqueda sin resultados.
- [ ] Probar texto con tildes y mayúsculas.
- [ ] Confirmar que cerrar una ficha no cambia la fecha ni la vista activa.

## 8. Rendimiento, caché y despliegue

- [ ] CI y TypeScript aprobados para el bloque.
- [ ] PR fusionado a `main`.
- [ ] Despliegue de Vercel en estado `READY`.
- [ ] Abrir como PWA instalada y confirmar que no muestra una versión anterior.
- [ ] Cerrar y reabrir la app para comprobar restauración estable.
- [ ] Revisar consola y runtime sin errores durante Año → Mes → Día → Semana → Lista.

## Criterio de cierre

El bloque puede considerarse validado únicamente cuando:

1. CI termine correctamente.
2. El despliegue productivo esté en estado `READY`.
3. El recorrido completo funcione en iPhone y Android.
4. Los permisos se comprueben con cuentas reales de las jerarquías disponibles.
5. No existan duplicaciones, contenido inaccesible ni controles superpuestos.
6. Los puntos pendientes queden documentados sin ampliar el alcance del Bloque P1.
