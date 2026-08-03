#!/usr/bin/env python3
"""Registra la política canónica de afijos de Hageo en el documento maestro."""
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")

OLD = """El Bloque 4 continúa activo. El siguiente incremento autorizado es inspeccionar los componentes léxicos de Hageo y fijar únicamente las políticas canónicas de afijos que falten. No generar payload ni importar Hageo hasta completar esa inspección y validación.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

NEW = """### Avance confirmado del Bloque 4 — política canónica de afijos de Hageo

El paquete reproducible de Hageo fue inspeccionado componente por componente antes de construir un payload.

Resultado:

- identificadores léxicos distintos: 235;
- con lema hebreo explícito en la fuente: 224;
- requieren política canónica explícita: 11;
- conflictos de lema fuente: 0;
- identificadores requeridos y proporcionados: 11 de 11;
- claves faltantes: 0;
- claves sobrantes: 0;
- valores inválidos o no hebreos: 0;
- estado: `approved_for_payload_build`.

Política fijada:

- `H9020 → ־י`;
- `H9023 → ־וֹ`;
- `H9024 → ־הָ`;
- `H9026 → ־כֶם`;
- `H9028 → ־הֶם`;
- `H9030 → ־נִי`;
- `H9031 → ־ךָ`;
- `H9033 → ־וֹ`;
- `H9036 → ־כֶם`;
- `H9046 → ־כֶם`;
- `H9048 → ־ם`.

Nueve decisiones reutilizan lemas ya aprobados en el catálogo textual. `H9026` y `H9046` se fijaron únicamente para la forma y función 2mp observadas en Hageo.

Evidencia:

- PR #83;
- workflow `Inspeccionar política de afijos de Hageo`;
- ejecución final `30777536703` — `success`;
- artefacto `haggai-affix-policy-inspection`;
- ID `8842543159`;
- digest `sha256:f845a51406148e8f5da171e7ffd242012fa6e20e8c8a54e9fa80c35c477d39d7`;
- `docs/FASE_D_POLITICA_AFIJOS_HAGEO.md`.

No se construyó payload, no se modificó el importador y no se escribió en Supabase, RLS, interfaz o producción.

El Bloque 4 continúa activo. El siguiente incremento autorizado es construir fuera de producción un payload determinista de Hageo y auditar conteos, hashes, variantes, Qere/Ketiv y campos editoriales. No importar Hageo ni activar migraciones hasta validar ese payload y registrar el resultado.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""


def main() -> int:
    text = MASTER.read_text(encoding="utf-8")
    if NEW in text:
        print("Documento maestro ya actualizado")
        return 0
    if text.count(OLD) != 1:
        raise SystemExit("No se encontró un único marcador de la política de Hageo")
    MASTER.write_text(text.replace(OLD, NEW, 1), encoding="utf-8")
    print("Documento maestro actualizado con la política de Hageo")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
