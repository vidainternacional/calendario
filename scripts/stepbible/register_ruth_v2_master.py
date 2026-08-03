#!/usr/bin/env python3
"""Registra el paquete TAHOT v2 de Rut en el documento maestro."""
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")

OLD = """El Bloque 4 continúa activo. El siguiente incremento autorizado es preparar una ampliación controlada del corpus textual del Antiguo Testamento reutilizando el importador validado, comenzando por un libro pequeño y sin avanzar todavía al Bloque 5.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

NEW = """### Avance confirmado del Bloque 4 — paquete TAHOT reproducible de Rut v2

Rut quedó generado y auditado con el extractor TAHOT actual, después de validar funcionalmente Abdías como primer libro completo del Antiguo Testamento.

Resultado:

- capítulos: 4;
- referencias: 85;
- filas fuente: 1,294;
- palabras visibles: 1,293;
- componentes morfológicos: 2,029;
- filas con variantes: 19;
- casos Qere: 13;
- omisiones Qere: 1;
- filas hebreas: 1,293;
- filas arameas: 0;
- desalineaciones: 0;
- hashes de línea inválidos: 0.

La omisión Qere de Rut 3:12 conserva evidencia Ketiv de `אִם`, pero no genera forma visible, índice de lectura ni palabra artificial.

Reproducibilidad:

- dos generaciones produjeron archivos y manifiestos idénticos;
- tamaño de `rut.json.gz`: 247,609 bytes;
- SHA-256: `80a79abd038de9159a90e7aa572f1d4ff6a0c7f1ca8bfb4195875ffd5a7ca20c`;
- PR #70;
- commit `715c9192724faa95cc25c96a74acc2307ef43e78`;
- workflow final `30774042371` — `success`;
- ejecución documentada `30773995300` — `success`;
- artefacto `stepbible-tahot-ruth-package-v2`;
- digest documentado `sha256:68513b8267fe04356453652a0d85f2269720b4195df93ce0a376064e2e0b23d3`;
- `docs/FASE_D_PAQUETE_TAHOT_RUT_V2.md`.

No se modificó Supabase, la interfaz, RLS ni producción durante este incremento.

El Bloque 4 continúa activo. El siguiente incremento autorizado es diseñar y validar fuera de producción un generador de payload e importador transaccional reutilizable para Rut. No se escribirá Rut en Supabase hasta aprobar conteos, hashes, omisiones Qere, variantes, rollback e idempotencia.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""


def main() -> int:
    text = MASTER.read_text(encoding="utf-8")
    if NEW in text:
        print("Documento maestro ya actualizado")
        return 0
    if text.count(OLD) != 1:
        raise SystemExit("No se encontró un único marcador de avance para Rut v2")
    MASTER.write_text(text.replace(OLD, NEW, 1), encoding="utf-8")
    print("Documento maestro actualizado con Rut v2")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
