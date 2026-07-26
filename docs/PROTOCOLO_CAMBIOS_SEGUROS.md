# Protocolo de cambios seguros y prevención de regresiones

Última actualización: 2026-07-26

## Objetivo

Evitar que una mejora visual o técnica dañe funciones que ya están aprobadas y operativas.

Este protocolo es obligatorio para cambios en componentes compartidos, navegación, Biblia, Panel Pastoral, temas, formularios, tablas y estados globales.

## Clasificación del riesgo

### Bajo riesgo

- documentación;
- textos sin lógica;
- estilos aislados por componente;
- corrección de accesibilidad que no cambia eventos.

### Riesgo medio

- estilos compartidos con alcance explícito;
- cambios de layout responsive;
- estados de carga, vacío o error;
- nuevas variantes visuales.

### Alto riesgo

- lógica de favoritos o persistencia;
- autenticación y permisos;
- server actions;
- Supabase y RLS;
- observadores DOM;
- listeners externos;
- CSS global;
- layouts compartidos;
- cambios de tema global;
- navegación y redirecciones.

Los cambios de riesgo alto deben desarrollarse en una rama o detrás de una bandera experimental cuando sea posible.

## Regla principal

> No reemplazar una solución estable hasta demostrar que la nueva conserva todas sus funciones y ofrece una mejora comprobable.

## Antes de modificar

1. Confirmar fase activa en `VIDA_INTERNACIONAL.md` y documento de fase.
2. Leer `docs/MEMORIA_TECNICA_Y_VISUAL.md`.
3. Identificar archivos y componentes relacionados.
4. Revisar si existen helpers, observers, estilos globales o listeners con el mismo alcance.
5. Definir qué comportamiento actual debe permanecer intacto.
6. Anotar el commit estable de referencia.
7. Elegir estrategia de rollback.

## Estrategia obligatoria para experimentos visuales

- No aplicar directamente a toda la aplicación.
- Crear una ruta, componente, variante o feature flag de laboratorio.
- Mantener el diseño actual como valor por defecto.
- Probar primero en una pantalla representativa.
- Comparar capturas y comportamiento.
- Recoger aprobación del usuario.
- Expandir por módulos, no mediante una sustitución global inmediata.

## Lista de regresión mínima

### Navegación

- La ruta abre correctamente.
- Volver funciona.
- La navegación inferior permanece accesible.
- No aparecen pestañas nuevas sin necesidad.
- La ruta de destino se conserva después de autenticación.

### Interacción

- El primer toque responde.
- No hay doble acción.
- No hay iconos duplicados.
- Los botones no cambian de posición durante la acción.
- Los estados optimistas se reconcilian sin parpadeos.

### Persistencia

- El cambio visual corresponde al dato real.
- Recargar conserva el estado cuando debe conservarlo.
- El estado se refleja en todas sus representaciones visibles.

### Móvil

- Sin overflow horizontal de página.
- Sin zoom involuntario en campos.
- Safe areas correctas.
- Modales y paneles permiten scroll.
- Controles principales tienen tamaño táctil adecuado.
- Overscroll usa el fondo correcto.
- Vertical y horizontal no rompen el layout.

### Temas

- Claro, sepia y oscuro mantienen contraste.
- El fondo raíz coincide con la pantalla.
- Iconos, bordes, inputs, modales y navegación son legibles.
- No aparece un flash del tema anterior.

### Carga y errores

- Existe estado de carga sin salto grave.
- El error ofrece recuperación.
- La información guardada no se pierde por un fallo visual.
- No hay errores nuevos en Vercel.

### Permisos

- Congregante, servidor, líder, pastor y administrador conservan su acceso correcto.
- Ningún cambio visual evita las comprobaciones de servidor.
- No se expone información privada.

## Pruebas específicas de Biblia

- Favorito se guarda realmente.
- Estrella del menú y del versículo se activan juntas.
- Solo la estrella es dorada; el círculo no se llena por completo.
- Al quitar favorito, ambas representaciones se desactivan juntas.
- El botón de notas aparece una sola vez.
- Crear nota abre la nota correcta.
- No hay flash al entrar en Notas.
- Los iconos permanecen centrados.
- El menú abre y cierra fluidamente.
- Los tres temas funcionan, incluido overscroll.

## Pruebas específicas de Panel Pastoral

- Centro Pastoral abre.
- Colecciones abre y conserva búsqueda/edición.
- Bosquejos abre y conserva modos Editar, Predicar y Presentar.
- Biblioteca abre recursos privados dentro de la app.
- Materiales de estudio abre publicaciones dentro de la app.
- Carga y error transversal funcionan.
- Permisos se verifican en servidor.

## Flujo de despliegue seguro

1. Cambio pequeño.
2. Revisión del diff.
3. Commit descriptivo.
4. Esperar Vercel `READY`.
5. Revisar logs de build.
6. Validar en producción.
7. Confirmar pruebas de regresión del área afectada.
8. Documentar resultado.

No declarar un bloque terminado mientras el despliegue esté pendiente o con error.

## Rollback

Cada experimento debe indicar:

- commit estable anterior;
- archivos modificados;
- forma de desactivar el experimento;
- datos o migraciones involucradas;
- si el rollback requiere revert, feature flag o restauración de archivo.

Los experimentos puramente visuales no deben exigir migraciones destructivas.

## Regla para CSS global

No usar selectores globales genéricos para resolver una pantalla específica.

Preferir:

- `data-*` de alcance;
- clase raíz del módulo;
- CSS Module;
- componente reutilizable;
- tokens de diseño;
- variante explícita.

## Regla para React y DOM

No usar `innerHTML`, MutationObserver ni listeners imperativos para reemplazar la lógica o los hijos de un componente React controlado.

Solo se permiten integraciones DOM cuando:

- no existe una alternativa React razonable;
- el alcance está documentado;
- hay una sola fuente de modificación;
- existe cleanup completo;
- se prueba reconciliación y navegación.

## Cierre de cada sesión

Registrar:

- qué se cambió;
- qué se verificó;
- qué quedó pendiente;
- commit;
- estado de Vercel;
- nuevas lecciones o regresiones detectadas.
