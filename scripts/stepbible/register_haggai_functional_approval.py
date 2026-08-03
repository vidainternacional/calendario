#!/usr/bin/env python3
"""Registra la aprobación funcional de Hageo y habilita el siguiente incremento seguro."""
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")
AUDIT = Path("docs/FASE_D_APLICACION_HAGEO_SUPABASE.md")

AUDIT_OLD = """## Estado pendiente

Falta validar manualmente en producción:

- Biblia → Estudio;
- Estudio Profundo;
- texto hebreo RTL y transliteración;
- agrupación palabra por palabra;
- Strong, lemas y morfología;
- Hageo 1:8 con dos variantes;
- Hageo 1:10 con su variante ortográfica;
- regresión de Abdías, Rut y Juan 3:16.

No ampliar a otro libro ni avanzar al Bloque 5 hasta registrar esa validación funcional.
"""

AUDIT_NEW = """## Validación funcional aprobada

El usuario aprobó la validación manual completa el 2026-08-02.

Cobertura confirmada en **Biblia → Estudio**:

- Hageo 1:1: hebreo RTL, 28 palabras base, transliteración, Strong, lema, morfología, fuente y licencia;
- Hageo 1:8: 11 palabras base, variante ortográfica y sustitución Qere/Ketiv ancladas en la palabra 9, sin duplicar el texto principal;
- Hageo 1:10: 9 palabras base y una variante ortográfica anclada en la palabra 5;
- Hageo 2:23: 20 palabras base, análisis completo y ausencia correcta de variantes.

Cobertura confirmada en **Estudio Profundo**:

- Hageo 1:1, 1:8 y 1:10 recuperados correctamente;
- texto hebreo RTL, transliteración, agrupación palabra por palabra, Strong, lemas y morfología visibles;
- las dos variantes de Hageo 1:8 y la variante de Hageo 1:10 coinciden con la evidencia aprobada;
- fuente y licencia visibles.

Regresiones aprobadas:

- Rut 3:12 conserva 11 palabras y la adición Ketiv `אִם` sin palabra artificial;
- Abdías 1:1 conserva sus 18 palabras y análisis completo;
- Juan 3:16 conserva el análisis griego y sus herramientas textuales;
- no hubo pantallas en blanco, cargas infinitas, desbordamiento lateral ni cambios no aprobados de interfaz.

La indicación «Secuencia literal de glosas: No disponible» permanece deliberadamente cuando la capa editorial española todavía no ha sido revisada.

La importación, auditoría técnica, recuperación segura y visualización funcional de Hageo están completas.
"""

MASTER_OLD = """El Bloque 4 continúa activo. El siguiente punto pendiente es la validación funcional manual de Hageo en Biblia → Estudio y Estudio Profundo, incluyendo texto hebreo RTL, transliteración, agrupación palabra por palabra, Strong, lemas, morfología y las variantes de Hageo 1:8 y 1:10. Después deberá verificarse la regresión de Abdías, Rut y Juan 3:16.

No ampliar a otro libro ni avanzar al Bloque 5 hasta registrar esa validación funcional.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

MASTER_NEW = """### Avance confirmado del Bloque 4 — validación funcional de Hageo aprobada

La validación manual de Hageo fue aprobada por el usuario el 2026-08-02.

Cobertura confirmada:

- Hageo 1:1: hebreo RTL, 28 palabras base, transliteración, Strong, lema, morfología, fuente y licencia;
- Hageo 1:8: 11 palabras base, variante ortográfica y sustitución Qere/Ketiv en la palabra 9, sin duplicar el texto principal;
- Hageo 1:10: 9 palabras base y una variante ortográfica en la palabra 5;
- Hageo 2:23: 20 palabras base, análisis completo y ausencia correcta de variantes;
- Hageo 1:1, 1:8 y 1:10 recuperados correctamente en Estudio Profundo;
- regresión aprobada para Rut 3:12, Abdías 1:1 y Juan 3:16;
- sin pantallas en blanco, cargas infinitas, desbordamiento lateral ni cambios no aprobados de interfaz.

La indicación «Secuencia literal de glosas: No disponible» permanece deliberadamente cuando la capa editorial española no ha sido revisada.

Evidencia permanente:

- PR #89 y documento `docs/FASE_D_APLICACION_HAGEO_SUPABASE.md` para la aplicación y auditoría técnica;
- validación funcional aprobada por el usuario el 2026-08-02.

La importación, auditoría técnica, recuperación segura y visualización funcional de Hageo están completas.

El Bloque 4 continúa activo. El siguiente incremento autorizado es ejecutar una auditoría reproducible de solo lectura sobre los libros restantes de TAHOT y seleccionar el cuarto libro según la política ya aprobada de integridad estructural y menor riesgo editorial. No generar paquete, payload o migración ni escribir en Supabase hasta registrar esa selección.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text(encoding="utf-8")
    if new in text:
        print(f"{path}: ya actualizado")
        return
    if text.count(old) != 1:
        raise SystemExit(f"{path}: no se encontró un único marcador esperado")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")
    print(f"{path}: actualizado")


def main() -> int:
    replace_once(AUDIT, AUDIT_OLD, AUDIT_NEW)
    replace_once(MASTER, MASTER_OLD, MASTER_NEW)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
