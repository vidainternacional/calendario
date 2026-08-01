# FASE D — Contexto histórico y cultural

Fecha de inicio: 2026-07-31

Estado: **SEGUNDO INCREMENTO IMPLEMENTADO — VALIDACIÓN EN CURSO**

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

## Seguridad y privacidad

Se mantienen las reglas del primer incremento:

- cuenta autenticada y activa;
- fragmento aprobado y habilitado;
- fuente aprobada y habilitada;
- `anon` sin lectura;
- clientes sin escritura;
- notas, bosquejos, biblioteca y contenido pastoral fuera del paquete;
- ninguna evidencia recuperada se añade todavía al prompt de IA.

## Validación pendiente

Antes de cerrar el Bloque 3 se debe confirmar:

- migración aplicada;
- fuente Pleiades aprobada y visible en el registro;
- dos fragmentos aprobados y recuperables;
- fragmentos fuera de rango no visibles;
- preview `READY`;
- producción `READY`;
- visualización correcta para Romanos 8:28 y Hechos 28:16;
- ausencia de advertencias nuevas asociadas a las tablas del bloque.

La integración con la IA permanece reservada para el Bloque 6.
