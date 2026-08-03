#!/usr/bin/env python3
"""Registra la política canónica de afijos de Jonás en el documento maestro."""
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")

OLD = """El Bloque 4 continúa activo. El siguiente incremento autorizado es inspeccionar de forma reproducible los 1,080 componentes léxicos de Jonás, medir identificadores y afijos, reutilizar la política canónica ya aprobada y fijar únicamente los lemas faltantes. No construir payload, migración ni importar Jonás hasta registrar esa auditoría léxica.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

NEW = """### Avance confirmado del Bloque 4 — política canónica de afijos de Jonás

El paquete reproducible de Jonás fue inspeccionado componente por componente antes de construir un payload.

Resultado:

- identificadores léxicos distintos: 288;
- con lema hebreo explícito en la fuente: 275;
- requieren política canónica explícita: 13;
- conflictos de lema fuente: 0;
- identificadores requeridos y proporcionados: 13 de 13;
- claves faltantes: 0;
- claves sobrantes: 0;
- valores inválidos o no hebreos: 0;
- estado: `approved_for_payload_build`.

Las trece decisiones reutilizan lemas ya aprobados y habilitados en el catálogo textual. No fue necesaria ninguna decisión nueva.

Evidencia:

- PR #121;
- workflow `Inspeccionar política de afijos de Jonás`;
- inspección inicial `30788172076` — `success`;
- validación final `30788289087` — `success`;
- artefacto final `jonah-affix-policy-inspection`, ID `8846060972`;
- digest `sha256:204af7ce019c01827f77eb1979f9feddb5b73df37ec94cb8c86caf9b74d18ea4`;
- `docs/FASE_D_POLITICA_AFIJOS_JONAS.md`.

No se construyó payload, no se modificó el importador y no se escribió en Supabase, RLS, interfaz o producción.

El Bloque 4 continúa activo. El siguiente incremento autorizado es construir fuera de producción un payload determinista de Jonás y auditar conteos, hashes, unicidad, campos editoriales y ausencia exacta de variantes. No importar Jonás ni activar migraciones hasta validar ese payload y registrar el resultado.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""


def main() -> int:
    text = MASTER.read_text(encoding="utf-8")
    if NEW in text:
        print("Documento maestro ya actualizado")
        return 0
    if text.count(OLD) != 1:
        raise SystemExit("No se encontró un único marcador de política de Jonás")
    MASTER.write_text(text.replace(OLD, NEW, 1), encoding="utf-8")
    print("Documento maestro actualizado con la política de Jonás")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
