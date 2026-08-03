#!/usr/bin/env python3
"""Registra la validación funcional aprobada de Rut en el documento maestro."""
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")

OLD = """El Bloque 4 continúa activo. El siguiente punto pendiente es la validación funcional manual de Rut en Biblia → Estudio y Estudio Profundo, incluyendo texto hebreo RTL, transliteración, agrupación palabra por palabra, Strong, lemas, morfología, variantes y el caso de Rut 3:12. Después deberá verificarse la regresión de Abdías y Juan 3:16.

No ampliar a otro libro ni avanzar al Bloque 5 hasta registrar esa validación funcional.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

NEW = """### Avance confirmado del Bloque 4 — validación funcional de Rut aprobada

La validación manual de Rut fue aprobada por el usuario el 2026-08-02.

Cobertura confirmada:

- Rut 1:1: hebreo RTL, 19 palabras base, transliteración, Strong, lema, morfología, fuente y licencia;
- Rut 1:8: 18 palabras base, variante ortográfica y sustitución Ketiv sin duplicar el texto principal;
- Rut 3:12: 11 palabras base y una adición Ketiv `אִם`, sin ancla ni palabra visible artificial;
- Rut 4:22: 8 palabras base, análisis completo y ausencia correcta de variantes;
- Rut 1:1, 1:8 y 3:12 recuperados correctamente en Estudio Profundo;
- regresión aprobada para Abdías 1:1 y Juan 3:16;
- sin pantallas en blanco, cargas infinitas ni cambios no aprobados de interfaz.

La indicación «Secuencia literal de glosas: No disponible» permanece deliberadamente cuando la capa editorial española no ha sido revisada.

Evidencia permanente:

- PR #79 y commit `8db47f7b816a8e89f4c2c6eb683a61f30e892e23` para la aplicación y auditoría técnica;
- `docs/FASE_D_APLICACION_RUT_SUPABASE.md`, actualizado con la aprobación funcional.

La importación, auditoría técnica, recuperación segura y visualización funcional de Rut están completas.

El Bloque 4 continúa activo. El siguiente incremento autorizado es seleccionar y auditar fuera de producción un tercer libro pequeño del Antiguo Testamento con criterios explícitos de tamaño, variantes, Qere/Ketiv y compatibilidad con el importador. No generar payload, activar migraciones ni escribir en Supabase hasta que ese paquete haya sido reproducido y auditado.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""


def main() -> int:
    text = MASTER.read_text(encoding="utf-8")
    if NEW in text:
        print("Documento maestro ya actualizado")
        return 0
    if text.count(OLD) != 1:
        raise SystemExit("No se encontró un único marcador de validación funcional de Rut")
    MASTER.write_text(text.replace(OLD, NEW, 1), encoding="utf-8")
    print("Documento maestro actualizado con la validación funcional de Rut")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
