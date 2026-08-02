#!/usr/bin/env python3
"""Actualiza el punto confirmado del esquema TAHOT en el documento maestro."""
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")

OLD = """El Bloque 4 continúa activo. El siguiente recorrido es interpretar de forma verificable las 17 columnas y las filas continuadas de TAHOT, distinguir hebreo y arameo, modelar Ketiv/Qere y generar paquetes por libro. Después se importará primero un libro pequeño y se validará antes de ampliar a los 39.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

NEW = """### Avance confirmado del Bloque 4 — esquema y contrato TAHOT

La estructura tabulada de los cuatro archivos TAHOT quedó interpretada y validada de forma reproducible.

Resultado:

- 12 columnas activas y 5 columnas reservadas vacías;
- 80 filas tabuladas pertenecientes únicamente al preámbulo;
- 46,517 separadores vacíos posteriores a los datos;
- 0 filas lingüísticas sin referencia explícita;
- 300,811 filas hebreas identificadas por `Grammar=H...`;
- 4,827 filas arameas identificadas por `Grammar=A...`;
- 14 posiciones Qere sin forma visible, conservadas como omisiones con Ketiv variante;
- tratamiento separado para Leningrado, Qere/Ketiv, texto restaurado y adiciones reconstruidas desde la LXX;
- referencias inglesas y hebreas alternativas preservadas por separado;
- contrato reutilizable en `scripts/stepbible/tahot_schema.py`.

Validación:

- PR #60;
- workflow `Validar esquema observado de TAHOT`;
- ejecución `30768672102` — `success`;
- artefacto `stepbible-ot-schema-observation`;
- digest `sha256:1645c2707ea3d2760bfc181235991a8600e802ed94a3a38dc7bbb8a2f4abde53`;
- `docs/FASE_D_ESQUEMA_TAHOT.md`.

No se modificó Supabase, la interfaz ni producción durante esta validación.

El Bloque 4 continúa activo. El siguiente recorrido es generar paquetes reproducibles por libro con texto, morfemas, transliteración, glosas, idioma, Qere/Ketiv, restauraciones, adiciones LXX, referencias y hashes. El primer paquete completo será un libro pequeño y deberá aprobarse antes de importar contenido a Supabase o ampliar el proceso a los 39 libros.

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
