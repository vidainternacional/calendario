from pathlib import Path

path = Path('__VIDA_INTERNACIONAL.md')
text = path.read_text(encoding='utf-8')
marker = 'versión Supabase `20260803151613`'
if marker in text:
    print('El hito de aplicación de Roma ya está registrado')
    raise SystemExit(0)

block = '''

### Avance confirmado del Bloque 5 — esquema de Roma aplicado y auditado

El esquema vacío de cronologías y mapas fue aplicado en Supabase el 2026-08-03 después de autorización explícita del usuario.

Resultado:

- migración `biblical_chronologies_maps_schema` aplicada;
- versión Supabase `20260803151613`;
- cuatro tablas creadas y todavía vacías;
- RLS habilitada en las cuatro tablas;
- una política `SELECT` por tabla para `authenticated`;
- `anon` sin acceso;
- `authenticated` únicamente con `SELECT`;
- `service_role` con administración;
- un trigger `updated_at` por tabla;
- cero datos de Roma importados;
- índices de cobertura añadidos para `biblical_timeline_event_places.source_id` y `biblical_timeline_events.end_book_code`;
- migración `index_biblical_chronologies_maps_foreign_keys` aplicada.

Evidencia:

- `docs/FASE_D_BLOQUE_5_AUDITORIA_POSTAPLICACION_ROMA.md`;
- `docs/FASE_D_BLOQUE_5_APLICACION_ROMA.md`;
- PR #146 y commit de fusión `f493c3ed5b4b353673f9824ed56a22b3e7d671d8`.

No se conectó la interfaz, no se importaron datos de Roma y no se avanzó al Bloque 6.

**Siguiente punto autorizado:** preparar fuera de producción un paquete piloto reproducible de Roma con fuentes, hashes, coordenadas, precisión, certeza, periodos, eventos y relaciones. No importarlo a Supabase hasta completar validación específica, revisión de licencias y un plan de recuperación de datos. Las instrucciones anteriores del Bloque 5 quedan subordinadas a este estado más reciente.
'''

path.write_text(text.rstrip() + block.rstrip() + '\n', encoding='utf-8')
