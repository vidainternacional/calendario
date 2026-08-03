#!/usr/bin/env python3
"""Registra el paquete TAHOT reproducible de Hageo en el documento maestro."""
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")

OLD = """El Bloque 4 continúa activo. El siguiente incremento autorizado es habilitar Hageo en el extractor y generar dos veces un paquete por libro, comprobando referencias completas, hashes idénticos, variantes, Qere, morfología y ausencia de palabras artificiales. No generar payload ni importar datos hasta que el paquete haya sido auditado y registrado.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

NEW = """### Avance confirmado del Bloque 4 — paquete TAHOT reproducible de Hageo

Hageo quedó habilitado en el extractor genérico y fue generado dos veces con bytes, manifiestos y auditorías idénticos.

Resultado:

- 2 capítulos;
- 38 referencias;
- 600 filas fuente y palabras visibles;
- 911 componentes morfológicos;
- 2 filas con variantes;
- 1 Qere;
- 0 omisiones Qere;
- 0 filas arameas;
- 0 texto restaurado;
- 0 adiciones reconstruidas desde la LXX;
- 0 desalineaciones;
- 0 idiomas desconocidos;
- 0 hashes de línea inválidos;
- 0 palabras visibles artificiales.

Reproducibilidad:

- archivo `hag.json.gz`: 113,722 bytes;
- SHA-256: `bc8e1caebce9a2e55d34b3be4770f3591e430b3aa217208324dee1bdbdd54e38`;
- Hageo 1:8 conserva el Qere `וְאֶכָּבְדָ֖ה` y el Ketiv `וְאֶכָּבֵד` en el índice visible 9;
- Hageo 1:10 conserva la variante ortográfica `שָמַ֖יִם` / `שָׁמַ֖יִם` en el índice visible 5.

Evidencia:

- PR #82;
- workflow `Validar paquete TAHOT de Hageo`;
- ejecución `30777253377` — `success`;
- artefacto `stepbible-haggai-package`;
- ID `8842436792`;
- digest `sha256:154835a7fede83e2784328db06223aa0a9426e806f68ed4058727306e4f45e1e`;
- `docs/FASE_D_PAQUETE_TAHOT_HAGEO.md`.

No se generó payload, no se modificó el importador y no se escribió en Supabase, RLS, interfaz o producción.

El Bloque 4 continúa activo. El siguiente incremento autorizado es inspeccionar los componentes léxicos de Hageo y fijar únicamente las políticas canónicas de afijos que falten. No generar payload ni importar Hageo hasta completar esa inspección y validación.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""


def main() -> int:
    text = MASTER.read_text(encoding="utf-8")
    if NEW in text:
        print("Documento maestro ya actualizado")
        return 0
    if text.count(OLD) != 1:
        raise SystemExit("No se encontró un único marcador del paquete de Hageo")
    MASTER.write_text(text.replace(OLD, NEW, 1), encoding="utf-8")
    print("Documento maestro actualizado con el paquete de Hageo")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
