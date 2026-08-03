#!/usr/bin/env python3
"""Registra la política canónica de afijos de Nahúm en el documento maestro."""
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")

OLD = """El Bloque 4 continúa activo. El siguiente incremento autorizado es inspeccionar los componentes léxicos de Nahúm y fijar únicamente los lemas canónicos de afijos que la fuente no expresa en hebreo. No construir payload ni importar Nahúm hasta completar y registrar esa política.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

NEW = """### Avance confirmado del Bloque 4 — política canónica de afijos de Nahúm

El paquete reproducible de Nahúm fue inspeccionado componente por componente antes de construir un payload.

Resultado:

- identificadores léxicos distintos: 387;
- con lema hebreo explícito en la fuente: 373;
- requieren política canónica explícita: 14;
- conflictos de lema fuente: 0;
- identificadores requeridos y proporcionados: 14 de 14;
- claves faltantes: 0;
- claves sobrantes: 0;
- valores inválidos o no hebreos: 0;
- estado: `approved_for_payload_build`.

Trece decisiones reutilizan lemas ya aprobados y habilitados en el catálogo textual. `H9040 → ־נִי` es la única decisión nueva y se restringe a dos ocurrencias `Sp1bs`, ambas con forma `נִי`.

Evidencia:

- PR #100;
- workflow `Inspeccionar política de afijos de Nahúm`;
- ejecución final `30781392252` — `success`;
- artefacto final `nahum-affix-policy-inspection`;
- `docs/FASE_D_POLITICA_AFIJOS_NAHUM.md`.

No se construyó payload, no se modificó el importador y no se escribió en Supabase, RLS, interfaz o producción.

El Bloque 4 continúa activo. El siguiente incremento autorizado es construir fuera de producción un payload determinista de Nahúm y auditar conteos, hashes, variantes, Qere/Ketiv y campos editoriales. No importar Nahúm ni activar migraciones hasta validar ese payload y registrar el resultado.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""


def main() -> int:
    text = MASTER.read_text(encoding="utf-8")
    if NEW in text:
        print("Documento maestro ya actualizado")
        return 0
    if text.count(OLD) != 1:
        raise SystemExit("No se encontró un único marcador de política de Nahúm")
    MASTER.write_text(text.replace(OLD, NEW, 1), encoding="utf-8")
    print("Documento maestro actualizado con la política de Nahúm")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
