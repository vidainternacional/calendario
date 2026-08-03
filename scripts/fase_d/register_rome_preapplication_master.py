from pathlib import Path

path = Path('__VIDA_INTERNACIONAL.md')
text = path.read_text(encoding='utf-8')
marker = 'PR #142 fue fusionado mediante el commit `936f1a1b1f06e4b3db7aca13e3e909e7c6c6aee6`'
if marker in text:
    print('El hito de preaplicación ya está registrado')
    raise SystemExit(0)

block = '''

### Avance confirmado del Bloque 5 — migración activa y preaplicación de Roma

La migración activa revisable del esquema vacío quedó fusionada mediante el PR #142 y el commit `936f1a1b1f06e4b3db7aca13e3e909e7c6c6aee6`.

Resultado:

- archivo activo: `supabase/migrations/20260803150000_biblical_chronologies_maps_schema.sql`;
- plan de recuperación: `docs/FASE_D_BLOQUE_5_PLAN_RECUPERACION_MIGRACION_ROMA.md`;
- equivalencia con la candidata auditada confirmada;
- CI temporal y PostgreSQL 17 en `success`;
- cuatro tablas vacías y sin datos embebidos;
- inspección de producción realizada exclusivamente en modo lectura;
- PostgreSQL 17.6 confirmado;
- las cuatro tablas aún no existen en producción;
- `extensions.moddatetime` y `public.cuenta_activa` disponibles.

Evidencia:

- `docs/FASE_D_BLOQUE_5_PREAPLICACION_ROMA.md`.

No se ejecutó DDL, no se aplicó la migración y no se importaron datos.

**Bloqueo actual:** aplicar el esquema vacío a Supabase es una escritura de producción. No ejecutar la migración, `supabase db push` ni SQL equivalente sin autorización explícita del usuario. Una vez autorizada, aplicar únicamente esta migración, auditar inmediatamente tablas, RLS, privilegios, triggers y recuperación, y detenerse si cualquier validación falla. No importar todavía datos de Roma ni avanzar al Bloque 6.
'''

path.write_text(text.rstrip() + block.rstrip() + '\n', encoding='utf-8')
