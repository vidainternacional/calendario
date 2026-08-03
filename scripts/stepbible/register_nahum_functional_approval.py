#!/usr/bin/env python3
"""Registra la aprobación visual de Nahúm y habilita el siguiente incremento seguro."""
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")
AUDIT = Path("docs/FASE_D_APLICACION_NAHUM_SUPABASE.md")

AUDIT_OLD = """## Estado pendiente

Falta validar manualmente en producción:

- Biblia → Estudio: Nahúm 1:1, 1:3, 1:15, 2:5 y 3:3;
- Estudio Profundo: al menos Nahúm 1:1, 1:3 y 1:15;
- texto hebreo RTL y transliteración;
- agrupación palabra por palabra;
- Strong, lemas y morfología;
- las ocho variantes en sus cuatro referencias;
- ausencia correcta de variantes en Nahúm 1:1;
- fuente, atribución y licencia;
- regresión de Hageo 1:8, Rut 3:12, Abdías 1:1 y Juan 3:16;
- ausencia de pantallas en blanco, cargas infinitas, desbordamiento lateral o cambios no aprobados de interfaz.

No ampliar a otro libro ni avanzar al Bloque 5 hasta registrar esa validación funcional."""

AUDIT_NEW = """## Validación funcional aprobada

El usuario aprobó la validación visual completa el 2026-08-02.

Cobertura confirmada en **Biblia → Estudio**:

- Nahúm 1:1: 6 palabras base, texto hebreo RTL, transliteración, Strong, lemas y morfología; ausencia correcta de variantes;
- Nahúm 1:3: 15 palabras base y dos variantes en la posición 4;
- Nahúm 1:15: 21 palabras base y dos variantes en la posición 17;
- Nahúm 2:5: 8 palabras base y dos variantes en la posición 4;
- Nahúm 3:3: 15 palabras base y dos variantes en la posición 14;
- cuatro variantes ortográficas y cuatro sustituciones Qere/Ketiv visibles sin duplicar palabras del texto principal;
- fuente STEPBible, atribución y licencia CC BY 4.0 visibles.

Cobertura confirmada en **Estudio Profundo**:

- Nahúm 1:3 y 1:15 recuperados correctamente;
- evidencia textual, contexto aprobado y variantes coincidentes con Biblia → Estudio;
- texto original RTL, transliteración, Strong, lemas y morfología visibles.

Regresiones aprobadas:

- Hageo 1:8 conserva sus dos variantes;
- Rut 3:12 conserva 11 palabras y la adición Ketiv `אִם` sin palabra artificial;
- Abdías 1:1 conserva sus 18 palabras y análisis completo;
- Juan 3:16 conserva el análisis griego y sus herramientas textuales;
- no hubo pantallas en blanco, cargas infinitas, desbordamiento lateral ni cambios no aprobados de interfaz.

La indicación «Secuencia literal de glosas: No disponible» permanece deliberadamente mientras esa capa editorial española no haya sido revisada.

La importación, auditoría técnica, recuperación segura y visualización funcional de Nahúm están completas."""

MASTER_OLD = """La importación, auditoría técnica, recuperación segura y validación funcional de datos están completas.

El Bloque 4 continúa activo. El único siguiente punto autorizado es la validación visual manual de Nahúm en Biblia → Estudio y Estudio Profundo, incluyendo Nahúm 1:1, 1:3, 1:15, 2:5 y 3:3, las ocho variantes y la regresión de Hageo 1:8, Rut 3:12, Abdías 1:1 y Juan 3:16. No ampliar a otro libro hasta registrar esa aprobación.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

MASTER_NEW = """La importación, auditoría técnica, recuperación segura y validación funcional de datos están completas.

### Avance confirmado del Bloque 4 — validación funcional de Nahúm aprobada

La validación manual de Nahúm fue aprobada por el usuario el 2026-08-02.

Cobertura confirmada:

- Nahúm 1:1: 6 palabras base y ausencia correcta de variantes;
- Nahúm 1:3: 15 palabras base y dos variantes en la posición 4;
- Nahúm 1:15: 21 palabras base y dos variantes en la posición 17;
- Nahúm 2:5: 8 palabras base y dos variantes en la posición 4;
- Nahúm 3:3: 15 palabras base y dos variantes en la posición 14;
- cuatro variantes ortográficas y cuatro sustituciones Qere/Ketiv visibles sin duplicación artificial;
- hebreo RTL, transliteración, Strong, lemas, morfología, fuente, atribución y licencia visibles;
- Nahúm 1:3 y 1:15 recuperados correctamente en Estudio Profundo;
- regresión aprobada para Hageo 1:8, Rut 3:12, Abdías 1:1 y Juan 3:16;
- sin pantallas en blanco, cargas infinitas, desbordamiento lateral ni cambios no aprobados de interfaz.

La indicación «Secuencia literal de glosas: No disponible» permanece deliberadamente mientras esa capa editorial española no haya sido revisada.

Evidencia permanente:

- `docs/FASE_D_APLICACION_NAHUM_SUPABASE.md`;
- validación funcional aprobada por el usuario el 2026-08-02.

La importación, auditoría técnica, recuperación segura y visualización funcional de Nahúm están completas.

El Bloque 4 continúa activo. El siguiente incremento autorizado es ejecutar una auditoría reproducible de solo lectura sobre los libros restantes de TAHOT y seleccionar el quinto libro según la política ya aprobada de integridad estructural y menor riesgo editorial. No generar paquete, payload o migración ni escribir en Supabase hasta registrar esa selección.

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
