#!/usr/bin/env python3
"""Registra en el documento maestro el paquete TAHOT validado de Rut."""
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")

OLD = """El Bloque 4 continúa activo. El siguiente recorrido es generar paquetes reproducibles por libro con texto, morfemas, transliteración, glosas, idioma, Qere/Ketiv, restauraciones, adiciones LXX, referencias y hashes. El primer paquete completo será un libro pequeño y deberá aprobarse antes de importar contenido a Supabase o ampliar el proceso a los 39 libros.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

NEW = """### Avance confirmado del Bloque 4 — paquete TAHOT completo de Rut

Rut quedó generado y auditado como primer paquete reproducible completo del Antiguo Testamento.

Resultado:

- capítulos: 4;
- referencias: 85;
- filas fuente: 1,294;
- tokens visibles de lectura: 1,293;
- filas hebreas: 1,293;
- filas arameas: 0;
- estados Leningrado: 1,281;
- estados Qere: 13;
- omisiones Qere: 1;
- SHA-256 canónico del paquete: `7f4ae92f1e1aa3e76f5e0f8a2efafbedfcc8c8f9bf673e12af8448780c24e8a1`.

Los trece Qere conservan evidencia Ketiv estructurada. La única omisión Qere corresponde a Rut 3:12 y no crea una palabra visible artificial.

Validación:

- PR #65;
- workflow `Validar paquete TAHOT de Rut`;
- ejecución `30771696828` — `success`;
- artefacto `stepbible-tahot-ruth-package`;
- digest `sha256:1254c03a203e05a739205af073ea6bc401a8829cf135666b596390120d172d10`;
- `docs/FASE_D_PAQUETE_TAHOT_RUT.md`.

No se modificó Supabase, la interfaz ni producción durante la generación y auditoría del paquete.

El Bloque 4 continúa activo. El siguiente recorrido es diseñar y probar la importación transaccional de Rut en Supabase, manteniendo RLS, procedencia, hashes, morfemas y separación Qere/Ketiv. Solo después de validar Rut en la aplicación se ampliará el proceso a los demás libros del Antiguo Testamento.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""


def main() -> int:
    text = MASTER.read_text(encoding="utf-8")
    if NEW in text:
        print("Documento maestro ya actualizado")
        return 0
    if text.count(OLD) != 1:
        raise SystemExit("No se encontró un único cierre esperado del Bloque 4")
    MASTER.write_text(text.replace(OLD, NEW, 1), encoding="utf-8")
    print("Documento maestro actualizado")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
