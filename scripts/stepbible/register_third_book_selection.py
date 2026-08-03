#!/usr/bin/env python3
"""Registra la selección auditada de Hageo en el documento maestro."""
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")

OLD = """El Bloque 4 continúa activo. El siguiente incremento autorizado es seleccionar y auditar fuera de producción un tercer libro pequeño del Antiguo Testamento con criterios explícitos de tamaño, variantes, Qere/Ketiv y compatibilidad con el importador. No generar payload, activar migraciones ni escribir en Supabase hasta que ese paquete haya sido reproducido y auditado.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

NEW = """### Avance confirmado del Bloque 4 — Hageo seleccionado como tercer libro

Se evaluaron los 37 libros restantes del Antiguo Testamento mediante una auditoría reproducible de solo lectura sobre las cuatro fuentes TAHOT fijadas.

La política priorizó integridad estructural sobre tamaño: cero desalineaciones e idiomas desconocidos, seguida por ausencia de omisiones Qere, arameo, texto restaurado y adiciones LXX; después se compararon referencias, Qere, variantes, morfemas y filas fuente.

Hageo (`Hag`) quedó seleccionado con:

- 2 capítulos;
- 38 referencias;
- 600 palabras visibles;
- 911 componentes morfológicos;
- 2 filas con variantes;
- 1 fila Qere;
- 0 omisiones Qere;
- 0 filas arameas;
- 0 texto restaurado;
- 0 adiciones reconstruidas desde la LXX;
- 0 desalineaciones;
- 0 idiomas desconocidos.

Evidencia:

- PR #81;
- workflow `Seleccionar tercer libro TAHOT`;
- ejecución `30777005082` — `success`;
- artefacto `stepbible-next-ot-book-selection`;
- ID `8842366155`;
- digest `sha256:bad8cb7ec61bb24768b9fdecdb295afecfa6651ac66314e772cb8964102cb35a`;
- `docs/FASE_D_SELECCION_TERCER_LIBRO.md`.

Esta auditoría no generó paquetes, payloads o migraciones y no modificó Supabase, RLS, la interfaz ni producción.

El Bloque 4 continúa activo. El siguiente incremento autorizado es habilitar Hageo en el extractor y generar dos veces un paquete por libro, comprobando referencias completas, hashes idénticos, variantes, Qere, morfología y ausencia de palabras artificiales. No generar payload ni importar datos hasta que el paquete haya sido auditado y registrado.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""


def main() -> int:
    text = MASTER.read_text(encoding="utf-8")
    if NEW in text:
        print("Documento maestro ya actualizado")
        return 0
    if text.count(OLD) != 1:
        raise SystemExit("No se encontró un único marcador para la selección del tercer libro")
    MASTER.write_text(text.replace(OLD, NEW, 1), encoding="utf-8")
    print("Documento maestro actualizado con la selección de Hageo")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
