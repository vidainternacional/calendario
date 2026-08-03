# FASE D · Bloque 4 — Importador transaccional de Nahúm

Fecha: 2026-08-02

Documento iniciado para validar fuera de producción el borrador derivado del importador de Nahúm. Los resultados se completarán únicamente con evidencia de PostgreSQL 16.

El validador compara las ocho variantes en orden numérico por capítulo y versículo, no por orden lexicográfico de sus claves.

El SQL permanece en `supabase/migration-drafts`; no se aplica ninguna migración ni se escribe en Supabase, RLS, interfaz o producción.
