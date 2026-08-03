#!/usr/bin/env python3
"""Registra la selección auditada de Jonás como quinto libro TAHOT."""
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")

OLD = """El Bloque 4 continúa activo. El siguiente incremento autorizado es ejecutar una auditoría reproducible de solo lectura sobre los libros restantes de TAHOT y seleccionar el quinto libro según la política ya aprobada de integridad estructural y menor riesgo editorial. No generar paquete, payload o migración ni escribir en Supabase hasta registrar esa selección.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

NEW = """### Avance confirmado del Bloque 4 — Jonás seleccionado como quinto libro

Se evaluaron los 35 libros restantes de TAHOT mediante la misma auditoría reproducible de solo lectura usada para seleccionar Hageo y Nahúm. Abdías, Rut, Hageo y Nahúm fueron excluidos porque su importación y validación funcional ya están completas.

La política exigió referencias válidas, cero desalineaciones y cero idiomas desconocidos; después priorizó ausencia de omisiones Qere, arameo, texto restaurado y adiciones LXX antes del tamaño y la complejidad textual.

Jonás (`Jon`) quedó seleccionado con:

- 4 capítulos;
- 48 referencias;
- 688 filas fuente y palabras visibles;
- 1,080 componentes morfológicos;
- 0 filas con variantes;
- 0 filas Qere;
- 0 omisiones Qere;
- 0 filas arameas;
- 0 texto restaurado;
- 0 adiciones reconstruidas desde la LXX;
- 0 idiomas desconocidos;
- 0 desalineaciones.

Jonás ocupa el primer lugar porque supera todos los controles estructurales y de riesgo prioritario y tiene el menor número de referencias entre los candidatos restantes. Su ausencia total de Qere y variantes reduce además el riesgo del paquete siguiente.

Evidencia:

- PR #119;
- workflow `Seleccionar quinto libro TAHOT`;
- ejecución `30787248088` — `success`;
- artefacto `stepbible-fifth-ot-book-selection`;
- ID `8845674061`;
- digest `sha256:e4f5b2b564c03141a0153d43e051105aeb4657a6b17cdec695952bee3e94d68a`;
- `docs/FASE_D_SELECCION_QUINTO_LIBRO.md`.

Esta auditoría no generó paquetes, payloads o migraciones y no modificó Supabase, RLS, interfaz o producción.

El Bloque 4 continúa activo. El siguiente incremento autorizado es habilitar Jonás en el extractor genérico y generar dos paquetes independientes para exigir identidad byte a byte, 48 referencias, 688 palabras visibles, 1,080 componentes y ausencia exacta de variantes o Qere. No construir payload ni importar Jonás hasta registrar ese paquete reproducible.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""


def main() -> int:
    text = MASTER.read_text(encoding="utf-8")
    if NEW in text:
        print("Documento maestro ya actualizado")
        return 0
    if text.count(OLD) != 1:
        raise SystemExit("No se encontró un único marcador de selección del quinto libro")
    MASTER.write_text(text.replace(OLD, NEW, 1), encoding="utf-8")
    print("Documento maestro actualizado con la selección de Jonás")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
