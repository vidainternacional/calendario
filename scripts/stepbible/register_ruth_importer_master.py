#!/usr/bin/env python3
"""Registra el importador transaccional validado de Rut en el documento maestro."""
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")

OLD = """El Bloque 4 continúa activo. El siguiente incremento autorizado es diseñar y validar fuera de producción el importador transaccional e idempotente de Rut, incluyendo rollback, conteos exactos, hashes y tratamiento de variantes. No se escribirá Rut en Supabase hasta que el importador haya sido aprobado.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

NEW = """### Avance confirmado del Bloque 4 — importador transaccional de Rut validado

El importador TAHOT generalizado para Abdías y Rut quedó derivado, versionado y validado fuera de producción en PostgreSQL 16.

Contratos cerrados:

- Abdías: 21 referencias, 291 palabras visibles, 434 ocurrencias, 184 identificadores léxicos y 3 variantes;
- Rut: 85 referencias, 1,293 palabras visibles, 2,026 ocurrencias, 373 identificadores léxicos y 29 variantes;
- identidad completa fijada por libro, código STEPBible, dataset, archivo fuente, paquete y payload;
- ningún tercer libro ni combinación parcial es aceptada.

Validación de Rut:

- payload adulterado rechazado sin escrituras parciales;
- rollback explícito aprobado;
- importación exacta aprobada;
- segunda ejecución idempotente;
- campos editoriales españoles nulos;
- `anon` y `authenticated` sin permiso de ejecución;
- `service_role` con permiso de ejecución;
- Rut 3:12 conserva el Ketiv `אִם` como variante `addition`, sin lectura base, ancla ni ocurrencia artificial.

Evidencia:

- PR #76;
- commit `b1765bdd1ce9143f9f9f6a342bc56747ba5dc418`;
- workflow final `30775560259` — `success`;
- artefacto `stepbible-ruth-importer-validation`;
- digest `sha256:55b34064b60fe3b0f8426b1c70d6d9d30a1d4f7d50c431353f31ab84219dbb43`;
- `docs/FASE_D_IMPORTADOR_TAHOT_RUT.md`;
- borrador `supabase/migration-drafts/20260803003000_importador_payload_tahot_rut.sql`.

No se modificó Supabase, RLS, la interfaz ni producción durante esta validación.

El Bloque 4 continúa activo. El siguiente incremento autorizado es convertir el borrador validado en una migración activa, aplicarla de forma controlada a Supabase e importar únicamente Rut. Después deberán auditarse independientemente conteos, hashes, permisos, lote, Qere/Ketiv, recuperación exclusiva desde servidor y visualización antes de ampliar a otro libro.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""


def main() -> int:
    text = MASTER.read_text(encoding="utf-8")
    if NEW in text:
        print("Documento maestro ya actualizado")
        return 0
    if text.count(OLD) != 1:
        raise SystemExit("No se encontró un único marcador del importador de Rut")
    MASTER.write_text(text.replace(OLD, NEW, 1), encoding="utf-8")
    print("Documento maestro actualizado con el importador de Rut")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
