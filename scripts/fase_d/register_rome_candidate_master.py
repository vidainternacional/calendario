from pathlib import Path

path = Path('__VIDA_INTERNACIONAL.md')
text = path.read_text(encoding='utf-8')
marker = 'PR #137 fusionado mediante commit `1cbb740c94ab958da27c8ddcc572120efed087de`'
if marker in text:
    print('El hito ya está registrado')
    raise SystemExit(0)

block = '''

### Avance confirmado del Bloque 5 — migración candidata de Roma validada

La migración candidata vacía para el piloto de Roma quedó validada fuera de producción el 2026-08-03.

Resultado:

- cuatro tablas propuestas: lugares, periodos, eventos y relaciones evento-lugar;
- restricciones de coordenadas, fechas, referencias y hashes SHA-256;
- índices, triggers `updated_at`, privilegios y RLS alineados con producción;
- `anon` sin lectura, `authenticated` con `SELECT` sujeto a cuenta activa y contenido aprobado, y `service_role` con administración;
- validación reproducible en PostgreSQL 17 con esquema de extensiones equivalente a Supabase;
- inserciones válidas, rechazo de coordenadas y hashes inválidos, lectura autenticada y aislamiento de la candidata aprobados;
- CI temporal y workflow `Validar esquema candidato de Roma` en `success`;
- PR #137 fusionado mediante commit `1cbb740c94ab958da27c8ddcc572120efed087de`.

Archivos:

- `docs/sql-candidates/FASE_D_BLOQUE_5_ROMA_SCHEMA_CANDIDATE.sql`;
- `scripts/fase_d/validate_rome_schema_candidate.sql`;
- `.github/workflows/validar-esquema-candidato-roma.yml`;
- `docs/FASE_D_BLOQUE_5_REGISTRO_CANDIDATA_ROMA.md`.

La candidata permanece fuera de `supabase/migrations`. No se aplicó DDL, no se importaron datos de Roma y no se modificó producción.

**Siguiente punto autorizado:** preparar una migración activa revisable dentro del repositorio, conservando el esquema vacío y un plan de recuperación. No aplicarla a Supabase ni importar datos hasta completar una validación previa específica y registrar autorización posterior en este documento maestro. Las instrucciones anteriores del Bloque 5 quedan subordinadas a este estado más reciente.
'''

path.write_text(text.rstrip() + block + '\n', encoding='utf-8')
