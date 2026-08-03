# FASE D · Bloque 5 — Integración visual del piloto de Roma

Fecha: 2026-08-03

Este incremento integra el paquete publicado `rome-pilot-v1` en Estudio Profundo mediante el servicio `server-only` de cronologías y mapas.

## Alcance

- panel “Cronología y mapa” dentro del resultado de estudio;
- recuperación basada en la referencia canónica ya resuelta por el corpus interno;
- únicamente eventos, periodos, lugares y relaciones `approved` y `enabled`;
- sesión autenticada y RLS conservadas;
- título, resumen, rango bíblico, periodo, precisión y certeza visibles;
- coordenadas declaradas como aproximadas;
- enlace externo a OpenStreetMap sin SDK, token ni carga embebida;
- fuente Pleiades y localizador visibles.

## Límites

- catálogo limitado a Roma;
- sin consultas directas a Supabase desde el cliente;
- sin `service_role` en componentes;
- sin ampliación de lugares;
- sin avance al Bloque 6.

La validación funcional requiere consultar Romanos 1, Romanos 16 o Hechos 28 con una sesión activa y confirmar que el panel no aparece en referencias sin eventos aprobados.
