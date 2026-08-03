#!/usr/bin/env python3
"""Registra el paquete reproducible de Jonás en el documento maestro."""
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")

OLD = """El Bloque 4 continúa activo. El siguiente incremento autorizado es habilitar Jonás en el extractor genérico y generar dos paquetes independientes para exigir identidad byte a byte, 48 referencias, 688 palabras visibles, 1,080 componentes y ausencia exacta de variantes o Qere. No construir payload ni importar Jonás hasta registrar ese paquete reproducible.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

NEW = """### Avance confirmado del Bloque 4 — paquete TAHOT reproducible de Jonás

Jonás (`Jon` / `JON`) fue habilitado en el extractor genérico y generado dos veces de forma independiente desde la fuente TAHOT fijada.

Resultado estructural:

- 4 capítulos y 48 referencias completas;
- 688 filas fuente y palabras visibles;
- 1,080 componentes morfológicos;
- estado textual `leningrad` en las 688 filas;
- 0 variantes;
- 0 filas Qere y 0 omisiones Qere;
- 0 filas arameas;
- 0 texto restaurado;
- 0 adiciones reconstruidas desde la LXX;
- 0 idiomas desconocidos;
- 0 desalineaciones;
- 688 hashes de línea válidos y únicos;
- 0 palabras visibles artificiales.

Reproducibilidad fijada:

- archivo `jon.json.gz`;
- tamaño exacto: 131,092 bytes;
- SHA-256: `083b869fe7d10493deaeee392babd9811e9dffb91f0db816d2f21a22b2135915`;
- paquete, manifiesto y auditoría idénticos byte a byte en dos ejecuciones;
- fuente `TAHOT Isa-Mal` con SHA-256 `f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5`.

El primer auditor esperaba incorrectamente el estado `base`; CI lo detuvo al observar `leningrad` en Jonás 1:1. La regla fue corregida para reflejar el contrato real de TAHOT sin modificar el extractor, los datos, los conteos o la huella del paquete. La validación completa posterior aprobó.

Evidencia:

- PR #120;
- workflow `Validar paquete TAHOT de Jonás`;
- primera generación reproducible `30787726852`;
- validación completa `30787820694` — `success`;
- artefacto `stepbible-jonah-package`;
- ID `8845878474`;
- digest `sha256:10b71681dd4dda3ddfff617631998a34d105ffcaa208ffa04d40264fc0881ad0`;
- `docs/FASE_D_PAQUETE_TAHOT_JONAS.md`.

Este incremento no construyó payload, no modificó el importador y no escribió en Supabase, RLS, interfaz o producción.

El Bloque 4 continúa activo. El siguiente incremento autorizado es inspeccionar de forma reproducible los 1,080 componentes léxicos de Jonás, medir identificadores y afijos, reutilizar la política canónica ya aprobada y fijar únicamente los lemas faltantes. No construir payload, migración ni importar Jonás hasta registrar esa auditoría léxica.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""


def main() -> int:
    text = MASTER.read_text(encoding="utf-8")
    if NEW in text:
        print("Documento maestro ya actualizado")
        return 0
    if text.count(OLD) != 1:
        raise SystemExit("No se encontró un único marcador del paquete de Jonás")
    MASTER.write_text(text.replace(OLD, NEW, 1), encoding="utf-8")
    print("Documento maestro actualizado con el paquete de Jonás")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
