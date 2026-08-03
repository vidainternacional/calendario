#!/usr/bin/env python3
"""Registra la migración activa validada de Nahúm en el documento maestro."""
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")

OLD = """No se creó una migración activa, no se aplicó el borrador y no se importó Nahúm en Supabase.

El Bloque 4 continúa activo. El siguiente incremento autorizado es convertir mecánicamente el borrador validado en una migración activa versionada y repetir la prueba completa desde la función OBA/RUT/HAG exacta. No aplicar la migración ni importar Nahúm hasta que esa segunda validación sea aprobada y registrada.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

NEW = """No se creó una migración activa durante la validación del borrador y no se importó Nahúm en Supabase.

### Avance confirmado del Bloque 4 — migración activa de Nahúm validada

El borrador aprobado de Nahúm fue convertido mecánicamente en una migración activa versionada y validado nuevamente en PostgreSQL 16.

Resultado:

- migración activa: `supabase/migrations/20260803043000_generalizar_importador_payload_tahot_nahum.sql`;
- función base OBA/RUT/HAG: `619b0249f70e6ac373256da724a89033cb3ecb566ad26f2ac9709ee0b6f9977d`;
- función resultante OBA/RUT/HAG/NAM: `69045240e658995cd0e1ba3557e54a2700b623078b36125e73ed1ada64f5139c`;
- 47 textos, 558 palabras visibles, 828 ocurrencias, 387 identificadores y 8 variantes;
- cuatro variantes ortográficas y cuatro sustituciones Qere/Ketiv;
- payload adulterado rechazado sin escrituras;
- rollback completo;
- importación exacta e idempotencia aprobadas;
- `anon` y `authenticated` sin ejecución;
- `service_role` como único rol con `EXECUTE`.

La conversión inicial fue comparada byte a byte con el borrador. Después se retiraron el borrador, el activador, el marcador y los workflows temporales. El repositorio conserva una sola ruta activa y la validación permanente se ejecuta directamente sobre ella.

Evidencia:

- PR #113;
- commit `dce300122738ccdb1f6d38ca66b8917dc69671f0`;
- workflow `Validar migración activa TAHOT de Nahúm`;
- ejecución inicial `30783726966` — `success`;
- ejecución limpia `30784026725` — `success`;
- reconfirmación final `30784093014` — `success`;
- artefacto limpio `stepbible-nahum-active-migration-validation`, ID `8844622756`;
- digest limpio `sha256:6d177970ef2bf6811a00eaeab392b8592c38e26737bf21dcb9360ae7352cc380`;
- `docs/FASE_D_MIGRACION_ACTIVA_NAHUM.md`.

La migración todavía no se ha aplicado a Supabase y Nahúm no se ha importado en producción.

El Bloque 4 continúa activo. El siguiente incremento autorizado es aplicar esta migración exacta de forma controlada en Supabase, importar únicamente Nahúm desde el payload canónico y ejecutar una auditoría independiente de conteos, hashes, variantes, permisos, RLS, recuperación y seguridad. No solicitar validación visual hasta completar y registrar esa auditoría técnica.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""


def main() -> int:
    text = MASTER.read_text(encoding="utf-8")
    if NEW in text:
        print("Documento maestro ya actualizado")
        return 0
    if text.count(OLD) != 1:
        raise SystemExit("No se encontró un único marcador de migración activa de Nahúm")
    MASTER.write_text(text.replace(OLD, NEW, 1), encoding="utf-8")
    print("Documento maestro actualizado con la migración activa de Nahúm")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
