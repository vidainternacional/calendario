#!/usr/bin/env python3
"""Registra el payload reproducible de Rut en el documento maestro."""
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")

OLD = """El Bloque 4 continúa activo. El siguiente incremento autorizado es diseñar y validar fuera de producción un generador de payload e importador transaccional reutilizable para Rut. No se escribirá Rut en Supabase hasta aprobar conteos, hashes, omisiones Qere, variantes, rollback e idempotencia.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

NEW = """### Avance confirmado del Bloque 4 — payload TAHOT reproducible de Rut

El payload determinista de Rut quedó construido y validado fuera de producción.

Resultado:

- referencias: 85;
- palabras visibles: 1,293;
- ocurrencias morfológicas: 2,026;
- identificadores léxicos: 373;
- filas fuente con variantes: 19;
- variantes estructuradas: 29;
- omisiones Qere: 1;
- raíces/palabras: 1,295;
- prefijos: 559;
- sufijos: 172.

La omisión Qere de Rut 3:12 se representa como variante `addition`, con lectura base y ancla visibles nulas, Ketiv `אִם` y cero ocurrencias artificiales.

Reproducibilidad:

- paquete `rut.json.gz`: `80a79abd038de9159a90e7aa572f1d4ff6a0c7f1ca8bfb4195875ffd5a7ca20c`;
- archivo payload: `454d57e805cd55eaf59d1d7635eb2fe913858ff03f293b18d0db315222178913`;
- huella interna: `d88763cef355dc05d3251438f3adce08a99feed389b82502e8c8f1263d7b79ee`;
- PR #73;
- commit `0cd0aca0758c2bd8b92ee9a0378053ca7c4d6f32`;
- workflow final `30774849778` — `success`;
- `docs/FASE_D_PAYLOAD_TAHOT_RUT.md`.

No se modificó Supabase, RLS, la interfaz ni producción durante este incremento.

El Bloque 4 continúa activo. El siguiente incremento autorizado es diseñar y validar fuera de producción el importador transaccional e idempotente de Rut, incluyendo rollback, conteos exactos, hashes y tratamiento de variantes. No se escribirá Rut en Supabase hasta que el importador haya sido aprobado.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""


def main() -> int:
    text = MASTER.read_text(encoding="utf-8")
    if NEW in text:
        print("Documento maestro ya actualizado")
        return 0
    if text.count(OLD) != 1:
        raise SystemExit("No se encontró un único marcador del siguiente incremento de Rut")
    MASTER.write_text(text.replace(OLD, NEW, 1), encoding="utf-8")
    print("Documento maestro actualizado con el payload de Rut")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
