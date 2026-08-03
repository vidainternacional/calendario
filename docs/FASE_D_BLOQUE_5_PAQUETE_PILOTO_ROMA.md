# FASE D · Bloque 5 — Paquete piloto reproducible de Roma

Fecha: 2026-08-03

## Objetivo

Preparar fuera de producción el primer paquete reproducible de cronología y geografía bíblica, sin importar datos a Supabase ni conectar todavía la interfaz.

## Fuente geográfica

Se reutiliza la fuente ya aprobada:

- slug: `pleiades-gazetteer`;
- nombre: Pleiades: A Gazetteer of Past Places;
- licencia: CC BY 3.0 verificada;
- lugar estable: `https://pleiades.stoa.org/places/423025`;
- identificador Pleiades: `423025`;
- versión interna: `pleiades-place-423025-accessed-2026-07-31`.

El punto representativo de Pleiades se conserva redondeado a seis decimales:

- latitud: `41.889977`;
- longitud: `12.491258`;
- precisión declarada: `approximate`;
- certeza: `high`.

No se presenta el punto representativo como límite exacto de la ciudad antigua.

## Contexto bíblico reutilizado

El paquete referencia dos fragmentos ya aprobados y visibles:

- `roma-capital-romanos` — Romanos 1–16;
- `roma-capital-hechos-28` — Hechos 28:14–31.

Sus hashes existentes se fijan dentro del paquete para detectar cualquier cambio posterior.

## Contenido del piloto

- un lugar: Roma;
- un periodo relativo sin afirmar un año absoluto;
- dos eventos:
  - Roma como destino de la carta a los Romanos;
  - llegada de Pablo a Roma;
- dos relaciones evento-lugar.

Todas las entidades nuevas permanecen:

- `review_status = pending`;
- `enabled = false`;
- sin UUID de producción embebido;
- vinculadas por slugs deterministas;
- con hash SHA-256 por entidad y un hash global del paquete.

## Archivos

- `data/fase_d/rome_pilot/rome_pilot_v1.json`;
- `scripts/fase_d/validate_rome_pilot_package.py`.

## Conteos esperados

- fuentes fijadas: 1;
- fragmentos contextuales reutilizados: 2;
- lugares: 1;
- periodos: 1;
- eventos: 2;
- relaciones: 2;
- hash global: `67efcaa4e4cae2ec6f908f60a97850a1b7fd6ee223496fbc17438a87ea3a0550`.

## Seguridad

Este incremento no incluye importador SQL, migración de datos, escritura en Supabase, componentes de mapa ni conexión con IA.

Antes de importar será obligatorio validar el paquete, revisar nuevamente licencia y fuente, definir idempotencia y documentar recuperación de datos.
