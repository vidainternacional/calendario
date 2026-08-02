# FASE D — Visualización del piloto léxico

Fecha: 2026-08-01

Estado: **IMPLEMENTADO EN PREVIEW — PENDIENTE DE PRODUCCIÓN Y VALIDACIÓN VISUAL**

## Objetivo

Mostrar el piloto léxico aprobado dentro de **Biblia → Estudio** sin modificar las funciones ya validadas de Leer, Comparar, Notas, audio, autoría o contexto histórico.

## Alcance

La visualización se limita a:

- Salmos 23:1;
- Juan 3:16.

En los demás pasajes el nuevo panel no aparece y la experiencia existente permanece sin cambios.

## Arquitectura

Archivos:

- `lib/estudios/biblical-lexical-reference.ts`;
- `app/actions/lexico-biblico.ts`;
- `components/biblia/BibleLexicalPanel.tsx`;
- conexión aislada desde `components/biblia/BibleHistoricalContextPanel.tsx`.

Flujo:

1. La referencia proviene del estado React ya existente en la Biblia.
2. Un analizador limitado reconoce Salmos y Juan.
3. Una acción de servidor solicita las ocurrencias aprobadas mediante `listarPalabrasBiblicasParaReferencia()`.
4. RLS, cuenta activa y fuente aprobada continúan controlando la lectura.
5. El cliente recibe únicamente campos normalizados y serializables.
6. Los datos no se añaden a ningún prompt de IA.

## Interfaz

El panel se titula **Palabras clave del texto original**.

Muestra:

- palabra original;
- sentido breve en español;
- transliteración;
- lema;
- número Strong;
- categoría gramatical;
- código y resumen morfológico cuando existen;
- glosa original de la fuente;
- indicación de que la glosa española es traducción editorial;
- fuente, atribución, licencia y enlace;
- versión SHA-256 del paquete.

Cada palabra funciona como un control expandible. La primera aparece abierta al cargar y puede cerrarse o sustituirse por otra sin modificar el pasaje bíblico.

## Reglas preservadas

- no hay marcas permanentes sobre el texto de Leer;
- no se modifica la comparación de versiones;
- no se modifica el audio;
- no se modifica la autoría;
- no se modifica el panel histórico existente;
- no se importan más datos;
- no se conecta el léxico a la IA;
- los pasajes sin cobertura no muestran un panel vacío.

## Validación técnica inicial

Preview del primer commit visual:

- commit: `9bc5095dc226c0e8c881db9af74a78a3d2ec5b06`;
- deployment: `dpl_3bVTZj9oWxidsUEgsUSnizE51TCz`;
- estado: `READY`;
- Next.js 16.2.10 compiló correctamente;
- TypeScript terminó sin errores;
- 32 de 32 páginas generadas;
- `/biblia` y `/estudios/profundo` incluidas.

Se añadió después una corrección aislada para que cerrar una ficha retire también su estado visual activo.

## Validación pendiente

- validar el commit final de la rama;
- integrar en `main`;
- confirmar producción `READY`;
- comprobar visualmente Salmos 23:1 y Juan 3:16 en **Biblia → Estudio**;
- verificar que un pasaje sin cobertura no muestre el panel.

El Bloque 4 permanece activo. No se avanzará al Bloque 5 hasta completar y validar la cobertura y las herramientas ampliadas definidas en el documento maestro.
