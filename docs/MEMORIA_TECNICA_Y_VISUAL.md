# Memoria técnica y visual — Vida Internacional

Última actualización: 2026-07-26

## Propósito

Este documento conserva el estado aprendido del proyecto para evitar repetir errores, perder decisiones aprobadas o dañar funciones estables al realizar mejoras futuras.

Debe leerse al iniciar una nueva conversación junto con `VIDA_INTERNACIONAL.md` y la documentación de la fase activa.

## Estado confirmado del proyecto

- FASE A — Pulido móvil: completada.
- FASE B — Optimización de UX: completada.
- FASE C — Panel Pastoral: implementación técnica completada; pendiente validación visual final y cierre documental.
- No iniciar FASE D hasta que el documento maestro refleje el cierre de FASE C.

## Interfaz aprobada de Biblia

El usuario confirmó como correcta y deseable la dirección visual actual del lector bíblico:

- botones circulares;
- iconografía minimalista;
- controles centrados vertical y horizontalmente;
- estrella favorita dorada sin colorear todo el botón;
- respuesta visual inmediata al guardar favoritos;
- estrella del menú y estrella del versículo sincronizadas;
- un único botón de notas;
- temas claro, sepia y oscuro;
- fondo de overscroll de iOS sincronizado con el tema;
- navegación a Notas sin pantallazo inicial;
- experiencia ligera, limpia y tipo aplicación.

Esta interfaz es una referencia visual aprobada. No debe modificarse de forma global sin una prueba aislada y reversible.

## Errores importantes ya ocurridos

### 1. Modificar controles de React mediante DOM directo

Problema observado:

- reemplazo de contenido con `innerHTML`;
- listeners externos añadidos a botones controlados por React;
- MutationObservers compitiendo con el estado original;
- favoritos que parecían activarse visualmente pero no se guardaban;
- desaparición temporal de estrellas;
- reconciliación tardía o inconsistente.

Regla aprendida:

> No reemplazar hijos, atributos funcionales ni eventos de un control React desde código DOM auxiliar.

La presentación final debe renderizarse preferiblemente desde React y reutilizar los handlers nativos.

### 2. Dos componentes modificando el mismo menú

Problema observado:

- un procesador antiguo reemplazaba iconos mientras otro intentaba conservar el contenido original;
- ambos observaban el mismo DOM;
- aparecieron duplicados, retrasos y parpadeos.

Regla aprendida:

> Una sola fuente de verdad por interacción y por componente visual.

Antes de agregar un nuevo observador, helper o capa de estilos, revisar si ya existe otro componente con el mismo alcance.

### 3. Estado optimista demasiado corto

Problema observado:

- la estrella se encendía;
- se apagaba antes de que React confirmara;
- luego se encendía otra vez.

Regla aprendida:

> El estado optimista debe permanecer hasta que el estado real confirme el mismo resultado o hasta un timeout de seguridad razonable.

No usar temporizadores breves que compitan con acciones de servidor.

### 4. Sincronizar solo una parte de la interfaz

Problema observado:

- la estrella del menú cambiaba inmediatamente;
- la estrella del versículo aparecía después.

Regla aprendida:

> Todas las representaciones visibles del mismo estado deben actualizarse en la misma acción optimista.

### 5. Botón de notas duplicado o eliminado

Problema observado:

- dos componentes agregaban la acción de notas;
- en otra corrección se eliminó por completo.

Regla aprendida:

> Las acciones agregadas dinámicamente deben tener un identificador único y una única responsabilidad de creación.

### 6. Pantallazo al entrar en Notas

Causa identificada:

- tema y contenido se cargaban después del primer render;
- la ruta no estaba precargada.

Solución aplicada:

- precarga de `/biblia/notas`;
- hidratación inicial antes del primer pintado;
- apertura directa de la nota creada mediante parámetro.

### 7. Franja blanca por overscroll en iOS

Causa identificada:

- `html` y `body` conservaban un fondo distinto al tema activo.

Solución aplicada:

- sincronizar `data-biblia-tema` con fondo y `color-scheme` del documento raíz.

### 8. Documento maestro desactualizado respecto al historial

Problema observado:

- el documento maestro mostraba una fase anterior como activa;
- los commits y documentos específicos ya registraban cierres posteriores.

Regla aprendida:

> Antes de comenzar trabajo, comparar siempre documento maestro, documentación de fase, commits de cierre y despliegue vigente.

No inferir la fase activa usando solamente una copia local antigua.

### 9. Cambios globales demasiado amplios

Riesgo observado:

- arreglar una pantalla mediante CSS global puede afectar otras rutas;
- un selector genérico puede alterar controles especiales, iconos o layouts ya optimizados.

Regla aprendida:

> Todo cambio transversal debe estar limitado por un atributo de alcance, ruta, componente o feature flag.

## Decisiones técnicas vigentes

- Next.js como framework.
- Supabase como backend.
- Vercel como despliegue.
- GitHub como fuente versionada oficial.
- Mobile first.
- Componentes reutilizables.
- Estados de carga, error, vacío y retroalimentación son obligatorios.
- Respetar `prefers-reduced-motion`.
- No usar animaciones decorativas que retrasen tareas.
- Mantener acciones táctiles de al menos 44 px cuando corresponda.
- Evitar zoom automático de iOS en formularios.
- Mantener safe areas y navegación inferior.

## Estado estable que no debe romperse

- Favoritos bíblicos guardan realmente y muestran ambas estrellas sincronizadas.
- Menú de acciones de versículos conserva un único botón de notas.
- Notas abre sin flash visible y selecciona la nota recién creada.
- Temas de Biblia mantienen fondo coherente, incluido overscroll.
- Panel Pastoral conserva permisos de servidor.
- Materiales pastorales abren dentro de la aplicación en el flujo normal.
- Biblioteca Pastoral conserva archivos privados y enlaces firmados.
- Estados globales de carga y error permanecen disponibles.

## Uso obligatorio en futuras sesiones

Antes de modificar una función estable:

1. Leer este documento.
2. Identificar la fuente de verdad del estado.
3. Buscar componentes auxiliares que modifiquen el mismo elemento.
4. Confirmar la fase activa.
5. Aplicar un cambio pequeño y reversible.
6. Validar la función original y la nueva mejora.
7. Registrar cualquier nueva lección aquí.
