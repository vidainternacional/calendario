#!/usr/bin/env python3
from pathlib import Path

path = Path('__VIDA_INTERNACIONAL.md')
text = path.read_text(encoding='utf-8')
old = """El Bloque 4 continúa activo. El siguiente recorrido es diseñar y versionar una migración piloto transaccional e idempotente para Obadías. La migración deberá resolver la política de lemas de afijos y separar de forma explícita los datos fuente ingleses del contenido editorial español. No se aplicará a Supabase hasta pasar una revisión estática y una prueba de rollback.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""
new = """### Avance confirmado del Bloque 4 — migración piloto de Obadías validada

El borrador de importación transaccional e idempotente de Obadías quedó validado en PostgreSQL 16 sin aplicarse todavía a Supabase.

Resultado:

- instalación del borrador SQL aprobada;
- rollback forzado sin residuos;
- segunda ejecución idempotente;
- 21 textos;
- 291 palabras visibles;
- 434 ocurrencias;
- 184 identificadores léxicos;
- 3 variantes estructuradas;
- 1 lote de importación;
- 0 duplicados tras la segunda ejecución;
- `anon` y `authenticated` sin permiso de ejecución;
- política canónica de afijos conservada;
- campos ingleses de fuente separados de la capa editorial española.

Validación:

- PR #64;
- commit `7cc40f55cb40d86e3a397438aa49276a8ce77802`;
- workflow `Validar borrador de migración de Obadías`;
- ejecución `30771903625` — `success`;
- artefacto `obadiah-migration-draft-validation`;
- digest `sha256:43a7ecf6f4a8bc853f583aa7684b1edf17b61b87dceb0dc37f77f3e447b74632`;
- `docs/FASE_D_MIGRACION_PILOTO_OBADIAS.md`.

El SQL continúa en `supabase/migration-drafts`; no se modificó Supabase, la interfaz ni producción durante esta validación.

El Bloque 4 continúa activo. El siguiente recorrido es convertir el borrador validado en migración activa, aplicarla de forma controlada a Supabase y realizar una auditoría posterior independiente de conteos, permisos, hashes y recuperación desde el servidor. No se ampliará a otros libros hasta validar Obadías en la aplicación.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""
if new in text:
    print('Documento maestro ya actualizado')
elif text.count(old) == 1:
    path.write_text(text.replace(old, new, 1), encoding='utf-8')
    print('Documento maestro actualizado')
else:
    raise SystemExit('No se encontró un único cierre esperado del Bloque 4')
