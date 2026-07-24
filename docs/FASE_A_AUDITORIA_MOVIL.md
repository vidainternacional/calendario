# FASE A — Auditoría de pulido móvil

Estado: EN PROGRESO

Objetivo: lograr una experiencia profesional y consistente en teléfonos, sin introducir funcionalidades nuevas fuera del alcance de la fase activa definida en `VIDA_INTERNACIONAL.md`.

## Reglas de ejecución

- Cambios pequeños y aislados.
- No modificar lógica funcional cuando el objetivo sea visual o de interacción.
- Validar el despliegue antes de continuar con el siguiente bloque.
- Mantener una ruta clara de reversión por commit.
- Probar especialmente iPhone, iPad y Android.

## Criterios de revisión por pantalla

- Sin overflow horizontal.
- Márgenes y safe areas consistentes.
- Botones y controles con áreas táctiles cómodas.
- Modales visibles, con scroll interno y cierre seguro.
- Menús emergentes accesibles y desplazables.
- Formularios utilizables con el teclado abierto.
- Tablas adaptadas a pantallas pequeñas.
- Navegación inferior sin cubrir contenido.
- Estados de carga y error sin bloquear la interfaz.

## Estado por módulo

| Módulo | Overflow | Modales / menús | Botones | Formularios / tablas | Navegación | Estado |
|---|---|---|---|---|---|---|
| Inicio | Revisado | No presenta bloqueos | Revisado | No aplica | Validada | Completado |
| Calendario | Corregido en contenedor base | En revisión | En revisión | En revisión | Validada | En revisión |
| Avisos | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Biblia | En revisión | Favoritos corregido | En revisión | En revisión | En revisión | Parcial |
| Perfil | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Ministerios | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Configuración | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Navegación global | Corregido | Compatible con diálogos | Revisado | No aplica | Validada en producción | Completado |

## Hallazgos resueltos

### Navegación global

- La barra inferior fija podía cubrir el final del contenido.
- Se añadió una reserva de espacio equivalente a su altura y safe area inferior.
- Se respetan safe areas laterales en iPhone/iPad.
- Se reforzaron anchos flexibles, truncado de etiquetas y atributos de accesibilidad.
- Despliegue de producción validado y mejora de fluidez confirmada.

### Inicio

- Se revisaron contenedor, tarjetas, grids, áreas táctiles, textos largos, estados vacíos y padding inferior.
- No se encontraron bloqueos reproducibles ni overflow horizontal que requiriera cambios adicionales.
- La navegación inferior ya no cubre su contenido final.

### Calendario — contenedor base

- Se sustituyó el padding inferior fijo por uno que incluye `safe-area-inset-bottom`.
- Se añadieron límites de ancho y protección contra overflow horizontal.
- El encabezado y contenido respetan safe areas laterales.
- El módulo permanece en revisión hasta validar vistas, controles y modales.

### Biblia — Favoritos

- El panel quedaba fuera del viewport en iPhone/iPad.
- Se movió el renderizado a un portal bajo `document.body`.
- Se añadió scroll interno estable.
- Se bloqueó el scroll del fondo mientras el panel está abierto.
- Se añadió cierre seguro y restauración del scroll.
- Se mantuvieron intactas las consultas y acciones de favoritos.

## Orden de trabajo

1. Navegación global y contenedores base. ✅
2. Inicio. ✅
3. Calendario. En revisión.
4. Avisos.
5. Biblia.
6. Perfil.
7. Ministerios.
8. Configuración.
9. Revisión final transversal en iPhone, iPad y Android.

## Definición de terminado de la FASE A

La fase podrá proponerse como completada únicamente cuando:

- todos los módulos estén revisados;
- no existan bloqueos de contenido por modales o menús;
- no exista overflow horizontal reproducible;
- formularios, tablas y navegación sean utilizables en móvil;
- los cambios estén desplegados y validados en producción;
- `VIDA_INTERNACIONAL.md` refleje formalmente la finalización de la fase.
