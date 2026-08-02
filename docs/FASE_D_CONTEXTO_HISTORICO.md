# FASE D — Contexto histórico y cultural

Fecha de inicio: 2026-07-31

Estado: **TERCER INCREMENTO IMPLEMENTADO — VALIDACIÓN VISUAL FINAL PENDIENTE**

## Objetivo

Crear una capa verificable de fragmentos históricos y culturales asociados a pasajes bíblicos, sin enviar contenido privado a servicios externos y sin presentar inferencias como hechos documentados.

## Primer incremento — arquitectura

El primer incremento quedó integrado en `main` y validado en producción:

- tabla `public.biblical_context_fragments`;
- relación obligatoria con `biblical_sources`;
- referencias por libro, capítulo y rango de versículos;
- distinción entre cita, resumen editorial e inferencia;
- RLS de solo lectura;
- servicio exclusivo de servidor;
- versión SHA-256 del paquete recuperado.

Evidencia:

- migración: `contexto_historico_biblico`;
- matriz de seguridad: 5 de 5;
- PR: #11;
- commit de `main`: `bb23b0290b0f954dbef695ef18576f510a2e56c6`;
- producción: `dpl_A5dyMWwNbUbY43z6dGr33nKVt1wS` — `READY`;
- Next.js y TypeScript correctos;
- 32 de 32 páginas generadas.

## Segundo incremento — Pleiades y Roma

### Fuente aprobada

Se registra `Pleiades: A Gazetteer of Past Places` como fuente histórica aprobada.

Razones:

- repertorio académico de lugares antiguos;
- contenido publicado de acceso abierto;
- URIs estables por lugar;
- API JSON de solo lectura;
- licencia Creative Commons Attribution 3.0;
- atribución institucional y editorial visible.

Registro:

- slug: `pleiades-gazetteer`;
- tipo: `historical`;
- proveedor: `Pleiades`;
- licencia: CC BY 3.0;
- estado: aprobado y habilitado;
- importación: únicamente resúmenes editoriales limitados y trazables.

### Primeros fragmentos

Se incorporan dos resúmenes editoriales basados en el registro estable de Roma, Pleiades ID `423025`:

- `roma-capital-romanos`, asociado a Romanos 1–16;
- `roma-capital-hechos-28`, asociado a Hechos 28:14–31.

Cada fragmento conserva:

- URI canónico de Pleiades;
- localizador de API;
- descripción de origen;
- versión de consulta;
- hash SHA-256 del resumen;
- atribución y licencia de la fuente;
- nota explícita de que la relación con el pasaje es editorial.

No se importó un comentario completo ni se presentó una síntesis editorial como cita literal.

## Visualización inicial

Componente: `components/estudios/ContextoHistoricoVerificado.tsx`

Ubicación: `/estudios/profundo`

La interfaz:

- muestra ejemplos cuando no existe una referencia compatible;
- reconoce inicialmente Romanos y Hechos;
- recupera fragmentos exclusivamente desde el servidor;
- muestra tipo de contenido, referencia, lugar y periodo;
- muestra fuente, atribución, licencia y enlace estable;
- muestra la versión del paquete;
- declara que el contenido no se envía todavía a la IA.

El analizador de referencia está en `lib/estudios/biblical-reference.ts` y solo admite los libros cubiertos por fragmentos aprobados en este incremento.

## Tercer incremento — integración en Biblia → Estudio

El contexto histórico aprobado se integra en la experiencia bíblica unificada, sin crear otra sección de Biblia y sin consultar el DOM.

Archivos:

- `app/actions/contexto-biblico.ts`;
- `components/biblia/BibleHistoricalContextPanel.tsx`;
- `components/biblia/BibliaClient.tsx`.

Comportamiento:

- el pasaje proviene directamente del estado React de libro, capítulo y versículo;
- el cliente llama una acción de servidor que reutiliza `listarContextoBiblicoParaReferencia`;
- RLS y autenticación siguen siendo la fuente de autorización;
- Romanos 1–16 y Hechos 28:14–31 muestran los fragmentos aprobados;
- pasajes sin cobertura muestran un estado vacío claro;
- fuente, atribución, licencia, localizador y versión del paquete permanecen visibles;
- la evidencia se mantiene separada y no se envía al proveedor de IA;
- Leer, Comparar y Notas no fueron modificados por este incremento.

Preview funcional:

- commit: `421396e93eb15b4c2d1f6ac0750d69e0caf78025`;
- deployment: `dpl_3pmjtEoTaG7nqLgEKeh7JpchEFom` — `READY`;
- Next.js y TypeScript correctos;
- 32 de 32 páginas generadas;
- rutas `/biblia` y `/estudios/profundo` incluidas.

## Seguridad y privacidad

Se mantienen las reglas del primer incremento:

- cuenta autenticada y activa;
- fragmento aprobado y habilitado;
- fuente aprobada y habilitada;
- `anon` sin lectura;
- clientes sin escritura;
- notas, bosquejos, biblioteca y contenido pastoral fuera del paquete;
- ninguna evidencia recuperada se añade todavía al prompt de IA.

Revalidación de datos realizada el 2026-08-01:

- Pleiades aprobada y habilitada: 1;
- fragmentos aprobados: 2;
- fragmentos de Roma esperados: 2;
- fragmentos sin localizador: 0;
- fragmentos aprobados vinculados a fuentes no aprobadas: 0;
- sin advertencias nuevas del asesor asociadas a `biblical_context_fragments` o `biblical_sources`.

Los avisos preexistentes de otras tablas y funciones permanecen fuera del alcance del Bloque 3 y se reservan para la Fase E.

## Validación pendiente

Antes de cerrar el Bloque 3 falta únicamente:

- integrar el tercer incremento en `main` y validar producción;
- confirmar visualmente en **Biblia → Estudio** que Romanos 8:28 y Hechos 28:16 muestran el panel, la fuente Pleiades y la licencia CC BY 3.0.

La integración con la IA permanece reservada para el Bloque 6. Las concordancias, léxicos y herramientas lingüísticas pertenecen al Bloque 4 y no se activarán hasta que el documento maestro registre el cierre del Bloque 3.
