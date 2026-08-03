from pathlib import Path

path = Path('__VIDA_INTERNACIONAL.md')
text = path.read_text(encoding='utf-8')
marker = '### Avance confirmado del Bloque 5 — importador candidato de Roma validado'
if marker in text:
    raise SystemExit('El hito ya está registrado')

section = '''\n\n### Avance confirmado del Bloque 5 — importador candidato de Roma validado\n\nEl importador candidato y su recuperación quedaron validados fuera de producción mediante el PR #152 y el commit de fusión `5c8e63d0d7218abba32f7e0aea1209430094d6f5`.\n\nResultado:\n\n- importador SQL candidato aislado fuera de `supabase/migrations`;\n- recuperación condicionada a filas `pending` y deshabilitadas;\n- primera importación validada en PostgreSQL 17;\n- segunda ejecución idempotente, sin duplicados y con UUID estables;\n- filas invisibles mediante RLS mientras continúan pendientes y deshabilitadas;\n- recuperación completa validada;\n- fuente Pleiades y fragmentos históricos preservados;\n- CI temporal y workflow específico de Roma en `success`;\n- cero datos de Roma importados en Supabase.\n\nArchivos:\n\n- `docs/sql-candidates/FASE_D_BLOQUE_5_ROMA_DATA_IMPORT_CANDIDATE.sql`;\n- `docs/sql-candidates/FASE_D_BLOQUE_5_ROMA_DATA_RECOVERY_CANDIDATE.sql`;\n- `scripts/fase_d/validate_rome_data_import_candidate.sql`;\n- `docs/FASE_D_BLOQUE_5_IMPORTADOR_CANDIDATO_ROMA.md`.\n\n**Siguiente punto autorizado:** preparar una migración activa revisable para importar exclusivamente el paquete piloto fijado de Roma, manteniendo todas las filas `pending` y deshabilitadas, junto con una migración de recuperación equivalente. No aplicar ninguna de las dos a Supabase, no habilitar filas, no conectar la interfaz y no avanzar al Bloque 6 hasta completar una validación específica y registrar una autorización posterior en este documento maestro. Las instrucciones anteriores del Bloque 5 quedan subordinadas a este estado más reciente.\n'''

path.write_text(text.rstrip() + section + '\n', encoding='utf-8')
