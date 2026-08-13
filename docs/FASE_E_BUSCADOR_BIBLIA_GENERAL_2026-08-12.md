# FASE E — Buscador rápido en Biblia general — 2026-08-12

Estado: bloque funcional solicitado explícitamente por el usuario durante FASE E; implementación aislada en Preview, pendiente de validación funcional antes de promoción.

## Necesidad operativa

Durante servicios y enseñanzas, los pastores pueden indicar referencias bíblicas que no forman parte de un paquete pastoral previamente preparado. La Biblia general debe permitir localizar esas referencias rápidamente sin recorrer manualmente libro, capítulo y versículo.

## Alcance autorizado

- Añadir búsqueda rápida por referencia únicamente en la Biblia general.
- Admitir referencias completas y abreviaturas comunes, por ejemplo `Juan 3:16`, `Salmos 23:1`, `1 Cor 13:4` y `Mt 5:14`.
- Saltar al libro, capítulo y versículo usando la navegación existente de `BibliaClient`.
- Preservar traducción activa, lector, favoritos, comparación, notas y Estudio Profundo.
- No modificar paquetes pastorales ni Biblia embebida en el flujo pastoral.
- No modificar Supabase, RLS, grants, datos bíblicos ni fuentes.
- No reabrir FASE D ni alterar la cobertura bíblica aprobada.

## Implementación

El buscador se implementa como `BibliaQuickReferenceSearch`, una capa independiente que utiliza los selectores existentes de libro/capítulo/versículo. No modifica la lógica interna de carga de `BibliaClient`.

La interfaz utiliza un botón flotante `Buscar` sobre la navegación inferior. Al abrirlo muestra una hoja/modal móvil con un único campo de referencia. Si la referencia es válida, actualiza en secuencia el libro, capítulo y versículo mediante los controles ya existentes.

## Validación requerida

Antes de promoción:

1. build/TypeScript sin errores;
2. abrir Biblia general en Preview;
3. probar `Juan 3:16`;
4. probar `Salmos 23:1`;
5. probar abreviaciones `1 Cor 13:4` y `Mt 5:14`;
6. comprobar mensaje claro ante libro/capítulo/versículo inexistente;
7. confirmar que la Biblia pastoral/embebida no muestra el buscador;
8. confirmar que Leer, Estudio, Comparar, Notas, Favoritos y voz mantienen comportamiento aprobado.

FASE E permanece activa. Este bloque no autoriza avanzar a FASE F.
