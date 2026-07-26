# Laboratorio — Sistema visual global inspirado en Biblia

Estado: PROPUESTA EXPERIMENTAL. No sustituye el diseño actual.

Última actualización: 2026-07-26

## Idea

Evaluar si el lenguaje visual aprobado del lector bíblico puede convertirse gradualmente en un sistema coherente para toda Vida Internacional.

Elementos de referencia:

- botones circulares;
- iconos minimalistas y centrados;
- superficies limpias;
- jerarquía visual sencilla;
- respuesta inmediata;
- temas claro, sepia y oscuro;
- sensación de aplicación móvil;
- controles consistentes y humanos.

## Principio de seguridad

> Primero se prueba. Después se compara. Solo con aprobación se adopta.

No modificar toda la aplicación mediante CSS global ni reemplazar los componentes actuales de una sola vez.

## Alcance inicial permitido

Crear un prototipo aislado para una sola pantalla representativa que no sea crítica y que pueda activarse o desactivarse sin afectar producción.

Opciones recomendadas para el primer prototipo:

1. Centro Pastoral como laboratorio visual privado para pastor/administrador.
2. Una página interna de demostración `/laboratorio/diseno` protegida por rol.
3. Una variante experimental controlada por configuración únicamente para el usuario administrador.

La opción preferida es una página de laboratorio protegida, porque permite comparar componentes sin alterar flujos reales.

## Componentes a probar

- botón circular de icono;
- botón primario con texto;
- botón secundario;
- botón destructivo;
- tarjeta de módulo;
- input, select y textarea;
- barra superior;
- navegación inferior;
- modal;
- panel desplegable;
- estado vacío;
- skeleton de carga;
- aviso de error recuperable;
- tabla o listado móvil;
- chip o filtro;
- selector de tema.

## Temas propuestos

### Claro

- fondo cálido muy claro;
- superficies blancas;
- texto azul pizarra;
- violeta como acento principal;
- dorado reservado para favoritos o estados especiales.

### Sepia

- fondo papel;
- superficies crema;
- texto café oscuro;
- bordes cálidos;
- acentos moderados.

### Oscuro

- fondo azul muy oscuro;
- superficies slate;
- texto blanco;
- bordes discretos;
- acentos violeta y dorado con contraste accesible.

## Reglas de color

- No usar dorado para todas las acciones.
- Dorado debe conservar significado especial: favorito, destacado o contenido espiritual marcado.
- Primario general: violeta/índigo.
- Destructivo: rojo/rose.
- Éxito: verde.
- Neutral: slate.
- El estado activo debe poder entenderse sin depender únicamente del color.

## Tokens que deberían evaluarse

- fondo de aplicación;
- superficie principal;
- superficie secundaria;
- texto principal;
- texto secundario;
- borde;
- acento;
- favorito;
- éxito;
- advertencia;
- error;
- radio pequeño, mediano y circular;
- sombra pequeña y elevada;
- altura táctil mínima;
- duración de transición;
- easing;
- espacios base.

## Arquitectura recomendada

- variables CSS o tokens semánticos;
- atributo de tema en `html`;
- componentes React reutilizables;
- evitar duplicar clases extensas en cada pantalla;
- evitar observers DOM para tematización;
- persistir preferencia del usuario;
- detectar tema antes del primer pintado para evitar flashes;
- mantener `color-scheme` y fondo raíz sincronizados;
- respetar `prefers-reduced-motion`.

## Feature flag

El experimento debe estar detrás de una bandera como:

- `visual_system_experiment`;
- valor desactivado por defecto;
- activación limitada a administrador;
- posibilidad de regresar al diseño actual sin revertir código.

No se recomienda almacenar esta preferencia en una migración irreversible durante la primera prueba. Puede comenzar como configuración local o parámetro protegido.

## Plan gradual

### Etapa 1 — Inventario

Documentar componentes actuales, variantes repetidas y diferencias entre módulos.

### Etapa 2 — Prototipo aislado

Construir la página de laboratorio con los tres temas y componentes principales.

### Etapa 3 — Validación visual

Comparar en iPhone, Android, tablet y escritorio.

Revisar:

- legibilidad;
- tamaño táctil;
- contraste;
- densidad;
- fluidez;
- coherencia;
- sensación de aplicación;
- preferencia del usuario.

### Etapa 4 — Piloto en un módulo

Aplicar componentes aprobados a un módulo no crítico manteniendo rollback.

### Etapa 5 — Expansión por módulos

Migrar uno por uno, con checklist de regresión y aprobación.

### Etapa 6 — Consolidación

Retirar estilos antiguos únicamente cuando todos los módulos dependientes hayan sido migrados y verificados.

## Criterios para aprobar el sistema

- Se percibe más coherente que el diseño actual.
- No aumenta pasos ni complejidad.
- No reduce legibilidad.
- No rompe permisos, navegación ni persistencia.
- Funciona en los tres temas sin flashes.
- Mantiene rendimiento aceptable.
- Puede revertirse de forma simple.
- El usuario aprueba visualmente el prototipo.

## Criterios para rechazar o ajustar

- demasiados círculos dificultan entender acciones;
- iconos sin etiqueta generan confusión;
- el tema sepia reduce contraste en formularios;
- el tema oscuro produce fondos inconsistentes;
- aumenta el tiempo de carga;
- requiere hacks DOM;
- obliga a reescribir módulos estables sin beneficio claro.

## Decisión actual

La idea queda registrada y autorizada únicamente como experimento futuro.

No debe iniciarse antes de cerrar la fase activa documentada, salvo que el documento maestro la incorpore explícitamente como objetivo de una fase o como prueba autorizada sin afectar producción.
