# Calendario — referencia visual y estructural aprobada

Fecha de confirmación: 2026-08-04

La referencia principal es la estructura del calendario nativo de iPhone mostrada en las capturas originales del usuario. El tema actual de VIDA permanece claro; el modo oscuro será global y posterior. La adaptación de color no autoriza a cambiar la estructura.

## Regla principal

> El calendario es la pantalla completa. No es una tarjeta, una ventana incrustada ni una página externa dentro de VIDA.

## Jerarquía obligatoria

1. **Año** como vista inicial:
   - año grande;
   - doce meses en una cuadrícula de tres columnas por cuatro filas;
   - mini calendarios proporcionados, legibles y distribuidos en todo el ancho útil;
   - sin tarjeta exterior ni ancho máximo centrado.
2. **Transición Año → Mes**:
   - el mes pulsado debe expandirse visualmente desde su posición real;
   - no basta un cambio de opacidad o un efecto de botón presionado;
   - al regresar, la pantalla mensual debe contraerse hacia la miniatura del mes.
3. **Mes**:
   - botón de regreso al año arriba a la izquierda;
   - controles compactos de vista, búsqueda y creación arriba a la derecha;
   - título grande del mes;
   - fila de días y semanas a todo el ancho;
   - meses siguientes como continuación vertical natural;
   - indicadores discretos mediante puntos o barras.
4. **Agenda**:
   - calendario mensual compacto arriba;
   - lista del día seleccionado inmediatamente debajo;
   - filas integradas, no tarjetas flotantes.
5. **Semana y Día**:
   - tira superior de siete días;
   - fecha seleccionada claramente identificada;
   - línea de tiempo por horas a todo el ancho;
   - línea de hora actual cuando corresponda.
6. **Nuevo evento**:
   - superficie modal completa inspirada en iOS;
   - título, ubicación, todo el día, inicio, fin, ministerio, participantes, avisos y notas;
   - no añadir tiempo de viaje o videollamada mientras VIDA no tenga soporte funcional real.

## Reglas técnicas permanentes

- La ruta `/calendario` no debe usar un elemento `<main>` dentro del contenido del módulo, porque `app/globals.css` aplica relleno lateral global con `!important` a todos los `main`.
- Ninguna vista del calendario puede depender de `max-width`, `mx-auto`, tarjetas exteriores o márgenes laterales de página.
- Los menús de vista, búsqueda, detalle y creación deben montarse en `document.body` mediante portales y usar posición fija; nunca deben quedar recortados o debajo del calendario.
- Deben respetarse las zonas seguras de iPhone y la barra inferior de navegación de VIDA.
- La barra inferior de VIDA permanece como navegación principal; los controles flotantes del calendario se colocan encima sin taparla.
- El calendario debe conservar asignaciones, intercambio de turnos, recordatorios y permisos RLS.
- La creación de eventos solo se muestra a administrador, pastor o líder autorizado de un ministerio.

## Criterio para otros módulos

El mismo principio aplica a Biblia, Estudio Profundo y Centro Pastoral: una herramienta principal debe sentirse como parte nativa de VIDA, no como una ventana externa agregada dentro de la aplicación.
