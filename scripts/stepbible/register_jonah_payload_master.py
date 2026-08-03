#!/usr/bin/env python3
"""Registra el payload reproducible de Jonás en el documento maestro."""
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")

OLD = """El Bloque 4 continúa activo. El siguiente incremento autorizado es construir fuera de producción un payload determinista de Jonás y auditar conteos, hashes, unicidad, campos editoriales y ausencia exacta de variantes. No importar Jonás ni activar migraciones hasta validar ese payload y registrar el resultado.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

NEW = """### Avance confirmado del Bloque 4 — payload TAHOT reproducible de Jonás

El paquete reproducible de Jonás y su política canónica de afijos fueron transformados en dos payloads independientes con bytes idénticos, fuera de producción.

Resultado:

- 48 textos;
- 688 palabras visibles;
- 1,080 ocurrencias morfológicas;
- 288 identificadores léxicos;
- roles: 688 palabras, 310 prefijos y 82 sufijos;
- estado textual `leningrad` en las 1,080 ocurrencias;
- 0 filas fuente con variantes;
- 0 variantes estructuradas;
- 0 omisiones Qere;
- 0 claves de ocurrencia o variante duplicadas;
- 0 hashes inválidos;
- 0 palabras artificiales;
- 0 campos editoriales españoles no autorizados.

Reproducibilidad fijada:

- archivo `import-payload.json`;
- tamaño 1,248,309 bytes;
- SHA-256 del archivo `e6bd082a446d29becbafb35a22b94ef9e260e447fe7fc7cea4361d98c5bb835b`;
- huella canónica interna `f986bdd833c86f9f239ddd26e4594aeb33d48a89f72fb05dcc853dbd1d512fc4`;
- estado `validated_outside_production`.

La primera auditoría esperaba incorrectamente el estado `base`; CI la detuvo después de que la doble generación ya había aprobado. La regla se corrigió a `leningrad` sin modificar el generador, los datos, los conteos o las huellas.

Evidencia:

- PR #122;
- workflow `Validar payload de importación de Jonás`;
- corrección validada `30788708776` — `success`;
- validación exacta documentada `30788854404` — `success`;
- reconfirmación final `30788912496` — `success`;
- artefacto `stepbible-jonah-import-payload`, ID `8846266421`;
- digest `sha256:517574fa159fb46a39b951d1fdd90e7e4b2d19554932e24111491065137c3026`;
- `docs/FASE_D_PAYLOAD_TAHOT_JONAS.md`.

No se modificó el importador, no se creó una migración y no se escribió en Supabase, RLS, interfaz o producción.

El Bloque 4 continúa activo. El siguiente incremento autorizado es diseñar y validar fuera de producción la ampliación transaccional e idempotente del importador para aceptar exactamente Jonás. No aplicar migraciones ni importar Jonás hasta aprobar rechazo de payload adulterado, rollback, conteos, hashes, permisos e idempotencia en PostgreSQL 16.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""


def main() -> int:
    text = MASTER.read_text(encoding="utf-8")
    if NEW in text:
        print("Documento maestro ya actualizado")
        return 0
    if text.count(OLD) != 1:
        raise SystemExit("No se encontró un único marcador del payload de Jonás")
    MASTER.write_text(text.replace(OLD, NEW, 1), encoding="utf-8")
    print("Documento maestro actualizado con el payload de Jonás")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
