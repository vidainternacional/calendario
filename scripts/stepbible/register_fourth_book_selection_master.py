#!/usr/bin/env python3
"""Registra la selección auditada de Nahúm como cuarto libro TAHOT."""
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")

OLD = """El Bloque 4 continúa activo. El siguiente incremento autorizado es ejecutar una auditoría reproducible de solo lectura sobre los libros restantes de TAHOT y seleccionar el cuarto libro según la política ya aprobada de integridad estructural y menor riesgo editorial. No generar paquete, payload o migración ni escribir en Supabase hasta registrar esa selección.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

NEW = """### Avance confirmado del Bloque 4 — Nahúm seleccionado como cuarto libro

Se evaluaron los 36 libros restantes de TAHOT mediante la misma auditoría reproducible de solo lectura usada para seleccionar Hageo. Abdías, Rut y Hageo fueron excluidos porque su importación y validación funcional ya están completas.

La política exigió referencias válidas, cero desalineaciones y cero idiomas desconocidos; después priorizó ausencia de omisiones Qere, arameo, texto restaurado y adiciones LXX antes del tamaño y la complejidad textual.

Nahúm (`Nam`) quedó seleccionado con:

- 3 capítulos;
- 47 referencias;
- 558 filas fuente y palabras visibles;
- 828 componentes morfológicos;
- 4 filas con variantes;
- 4 filas Qere;
- 0 omisiones Qere;
- 0 filas arameas;
- 0 texto restaurado;
- 0 adiciones reconstruidas desde la LXX;
- 0 idiomas desconocidos;
- 0 desalineaciones.

Jonás quedó segundo con 48 referencias. Aunque no contiene Qere o variantes, la política compara el menor número de referencias después de superar todos los controles estructurales y de riesgo prioritario.

Evidencia:

- PR #93;
- workflow `Seleccionar cuarto libro TAHOT`;
- ejecución `30779908366` — `success`;
- artefacto `stepbible-fourth-ot-book-selection`;
- ID `8843282870`;
- digest `sha256:ec5fa55b98a28f7d0d3cd8072e222c926114d157d2987403d5178ea270b32989`;
- `docs/FASE_D_SELECCION_CUARTO_LIBRO.md`.

Esta auditoría no generó paquetes, payloads o migraciones y no modificó Supabase, RLS, interfaz o producción.

El Bloque 4 continúa activo. El siguiente incremento autorizado es habilitar Nahúm en el extractor genérico y generar dos paquetes independientes para exigir identidad byte a byte, 47 referencias, 558 palabras visibles, 828 componentes y auditoría individual de sus cuatro filas con variantes. No construir payload ni importar Nahúm hasta registrar ese paquete reproducible.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""


def main() -> int:
    text = MASTER.read_text(encoding="utf-8")
    if NEW in text:
        print("Documento maestro ya actualizado")
        return 0
    if text.count(OLD) != 1:
        raise SystemExit("No se encontró un único marcador de selección del cuarto libro")
    MASTER.write_text(text.replace(OLD, NEW, 1), encoding="utf-8")
    print("Documento maestro actualizado con la selección de Nahúm")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
