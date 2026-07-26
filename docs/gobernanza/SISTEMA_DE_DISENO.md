# Sistema de Diseño Vida

Estado: BORRADOR CONTROLADO

## Objetivo

Construir una identidad visual coherente para toda la aplicación sin alterar directamente módulos estables.

## Principios

- Mobile First.
- Minimalismo funcional.
- Claridad antes que decoración.
- Acciones táctiles fáciles de reconocer.
- Componentes reutilizables.
- Accesibilidad y contraste adecuados.
- Coherencia entre módulos.

## Referencia aprobada

La Biblia es la referencia principal para futuros experimentos visuales por su:

- uso de botones circulares;
- iconografía sencilla;
- buena organización espacial;
- navegación clara;
- tres temas visuales;
- sensación de aplicación nativa.

## Temas candidatos globales

1. Claro.
2. Sepia.
3. Oscuro.

Estos temas todavía no se consideran globalmente implementados. Deben validarse en laboratorio antes de extenderse.

## Componentes a estandarizar

- botones primarios y secundarios;
- botones circulares de icono;
- tarjetas;
- campos de formulario;
- selectores;
- diálogos y modales;
- barras de navegación;
- encabezados;
- estados vacíos;
- estados de carga;
- mensajes de éxito y error;
- espaciados;
- radios y sombras;
- comportamiento táctil.

## Niveles de estabilidad

### Experimental

Puede cambiar dentro del laboratorio.

### Estable

Puede mejorarse con pruebas de regresión.

### Protegido

Solo puede modificarse mediante propuesta documentada, laboratorio, validación y aprobación.

## Regla de adopción

Un patrón visual probado en un módulo no se copiará directamente al resto de la aplicación. Primero debe convertirse en componente reutilizable, probarse de forma aislada y compararse con la baseline.