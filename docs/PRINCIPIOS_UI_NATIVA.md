# Principios de interfaz nativa — VIDA Internacional

## Regla principal

Los módulos principales de VIDA Internacional deben sentirse como pantallas nativas de una sola aplicación. No deben presentarse como páginas externas, iframes visuales, paneles flotantes o tarjetas grandes incrustadas dentro de otra pantalla.

## Aplicación obligatoria

Esta regla aplica a:

- Calendario.
- Panel pastoral.
- Biblia y Estudio Profundo.
- Avisos.
- Solicitudes.
- Ministerios.
- Perfil.
- Cualquier módulo futuro.

## Criterios visuales

1. **Pantalla completa:** el contenido principal usa el ancho disponible hasta las zonas seguras del dispositivo.
2. **Integración:** encabezado, navegación, contenido y barra inferior pertenecen a una misma superficie visual.
3. **Sin doble contenedor:** evitar una página con fondo y dentro otra tarjeta grande que simula una segunda aplicación.
4. **Jerarquía nativa:** títulos grandes, controles compactos, divisores sutiles y contenido directamente sobre la superficie.
5. **Tarjetas solo para entidades:** una tarjeta puede representar un evento o elemento individual, pero no debe encerrar todo un módulo.
6. **Consistencia móvil:** respetar `safe-area-inset-*`, evitar scroll horizontal y mantener controles táctiles cómodos.
7. **Tema adaptable:** el diseño debe funcionar en modo claro y quedar preparado para modo nocturno global.
8. **Referencias visuales:** cuando el usuario proporcione capturas, se debe replicar su estructura, proporciones, densidad y comportamiento; no solo colores o elementos aislados.

## Calendario

El calendario debe ser la pantalla, no un widget dentro de ella:

- mes, semana y agenda ocupan todo el ancho útil;
- la cuadrícula mensual no se encierra en una tarjeta redondeada;
- los días se separan con líneas sutiles y espacio, como una vista nativa;
- los eventos se muestran con puntos, barras o filas integradas;
- al seleccionar un día, sus eventos aparecen como continuación natural de la pantalla;
- los controles de periodo y cambio de vista son compactos;
- la creación y detalle de eventos deben usar hojas inferiores o pantallas completas, no ventanas externas.

## Regla para nuevas conversaciones

Antes de modificar un módulo visual, revisar este documento. Si una propuesta introduce una ventana dentro de otra ventana, un contenedor general con sombra o una tarjeta que encierra todo el módulo, debe reconsiderarse antes de implementarse.
