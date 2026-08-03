#!/usr/bin/env python3
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")
OLD = """El Bloque 4 continúa activo. El siguiente incremento autorizado es convertir mecánicamente este borrador validado en una migración activa versionada y repetir la prueba completa sobre ese archivo exacto. No aplicar la migración ni importar Jonás en Supabase hasta registrar esa segunda validación.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""
NEW = """### Avance confirmado del Bloque 4 — migración activa de Jonás validada

El borrador transaccional aprobado fue convertido mecánicamente en la migración activa `supabase/migrations/20260803063000_generalizar_importador_payload_tahot_jonas.sql` y validado nuevamente en PostgreSQL 16.

Resultado:

- SHA-256 de la migración activa: `2d1122d5fc2502365c28797e33cd6bc36e2cca1fe0a535e5be94527790fb09d9`;
- función base OBA/RUT/HAG/NAM: `69045240e658995cd0e1ba3557e54a2700b623078b36125e73ed1ada64f5139c`;
- función resultante OBA/RUT/HAG/NAM/JON: `0d65c4d8e8ac81368cea6e5b6fd3fb104156cc3e3e3f299426b20752eef7f062`;
- rechazo de payload adulterado y variante artificial: aprobado sin escrituras;
- rollback: aprobado sin residuos;
- importación exacta: 48 textos, 688 palabras visibles, 1,080 ocurrencias, 288 identificadores, 0 variantes y 1 lote;
- segunda ejecución: idempotente;
- permisos: únicamente `service_role` conserva `EXECUTE`;
- reutilización no destructiva de `H3068G` y `H9020`.

Evidencia:

- PR #124;
- commit `cd08de555190b41f158f4cec5a009b61756956f1`;
- workflow `Validar migración activa TAHOT de Jonás`;
- ejecuciones limpias `30791489223` y `30791535253` — `success`;
- `docs/FASE_D_MIGRACION_ACTIVA_JONAS.md`.

La migración todavía no se ha aplicado a Supabase y Jonás no se ha importado en producción.

El Bloque 4 continúa activo. El siguiente incremento autorizado es aplicar esta migración exacta de forma controlada en Supabase, importar únicamente Jonás desde el payload canónico y ejecutar una auditoría independiente de conteos, hashes, permisos, RLS, recuperación y seguridad. No solicitar validación visual hasta completar y registrar esa auditoría técnica.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

text = MASTER.read_text(encoding="utf-8")
if NEW in text:
    print("Documento maestro ya actualizado")
elif text.count(OLD) != 1:
    raise SystemExit("No se encontró un único marcador de migración activa de Jonás")
else:
    MASTER.write_text(text.replace(OLD, NEW, 1), encoding="utf-8")
    print("Documento maestro actualizado con la migración activa de Jonás")
