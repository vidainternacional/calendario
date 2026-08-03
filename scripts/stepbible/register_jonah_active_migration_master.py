#!/usr/bin/env python3
"""Registra la migración activa validada de Jonás en el documento maestro."""
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")

OLD = """No se creó una migración activa, no se aplicó el borrador y no se importó Jonás en Supabase.

El Bloque 4 continúa activo. El siguiente incremento autorizado es convertir mecánicamente este borrador validado en una migración activa versionada y repetir la prueba completa sobre ese archivo exacto. No aplicar la migración ni importar Jonás en Supabase hasta registrar esa segunda validación.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

NEW = """No se creó una migración activa durante la validación inicial del borrador y no se importó Jonás en Supabase.

### Avance confirmado del Bloque 4 — migración activa de Jonás validada

El borrador aprobado de Jonás fue convertido mecánicamente en una migración activa versionada y validado nuevamente en PostgreSQL 16.

Resultado:

- migración activa: `supabase/migrations/20260803063000_generalizar_importador_payload_tahot_jonas.sql`;
- SHA-256 de la migración: `2d1122d5fc2502365c28797e33cd6bc36e2cca1fe0a535e5be94527790fb09d9`;
- función base OBA/RUT/HAG/NAM: `69045240e658995cd0e1ba3557e54a2700b623078b36125e73ed1ada64f5139c`;
- función resultante OBA/RUT/HAG/NAM/JON: `0d65c4d8e8ac81368cea6e5b6fd3fb104156cc3e3e3f299426b20752eef7f062`;
- 48 textos, 688 palabras visibles, 1,080 ocurrencias, 288 identificadores y 0 variantes;
- payload adulterado y variante artificial rechazados sin escrituras;
- rollback completo;
- importación exacta e idempotencia aprobadas;
- `anon` y `authenticated` sin ejecución;
- `service_role` como único rol con `EXECUTE`.

La conversión fue comparada byte a byte con el borrador. Después se retiraron el borrador, el activador, el marcador, el materializador temporal y el workflow preliminar. El repositorio conserva una sola ruta activa.

Evidencia:

- PR #124;
- workflow `Validar migración activa TAHOT de Jonás`;
- ejecución inicial `30791049474` — `success`;
- ejecución limpia `30791535253` — `success`;
- artefacto limpio `stepbible-jonah-active-migration-validation`, ID `8847231985`;
- digest limpio `sha256:5e17db7a4f09591b7830eef85f6ce9056dae94fe4d3e2a21e7cfc98f37526392`;
- `docs/FASE_D_MIGRACION_ACTIVA_JONAS.md`.

La migración todavía no se ha aplicado a Supabase y Jonás no se ha importado en producción.

El Bloque 4 continúa activo. El siguiente incremento autorizado es aplicar esta migración exacta de forma controlada en Supabase, importar únicamente Jonás desde el payload canónico y ejecutar una auditoría independiente de conteos, hashes, permisos, RLS, recuperación y seguridad. No solicitar validación visual hasta completar y registrar esa auditoría técnica.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""


def main() -> int:
    text = MASTER.read_text(encoding="utf-8")
    if NEW in text:
        print("Documento maestro ya actualizado")
        return 0
    if text.count(OLD) != 1:
        raise SystemExit("No se encontró un único marcador de migración activa de Jonás")
    MASTER.write_text(text.replace(OLD, NEW, 1), encoding="utf-8")
    print("Documento maestro actualizado con la migración activa de Jonás")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
