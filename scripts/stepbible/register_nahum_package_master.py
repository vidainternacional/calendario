#!/usr/bin/env python3
"""Registra el paquete reproducible de Nahúm en el documento maestro."""
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")

OLD = """El Bloque 4 continúa activo. El siguiente incremento autorizado es habilitar Nahúm en el extractor genérico y generar dos paquetes independientes para exigir identidad byte a byte, 47 referencias, 558 palabras visibles, 828 componentes y auditoría individual de sus cuatro filas con variantes. No construir payload ni importar Nahúm hasta registrar ese paquete reproducible.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

NEW = """### Avance confirmado del Bloque 4 — paquete TAHOT reproducible de Nahúm

Nahúm (`Nam` / `NAM`) quedó habilitado en el extractor genérico y fue generado dos veces con bytes, manifiestos y auditorías idénticos.

Resultado:

- 3 capítulos;
- 47 referencias;
- 558 filas fuente y palabras visibles;
- 828 componentes morfológicos;
- 4 filas con variantes, todas Qere;
- 0 omisiones Qere;
- 0 filas arameas;
- 0 texto restaurado;
- 0 adiciones reconstruidas desde la LXX;
- 0 idiomas desconocidos;
- 0 desalineaciones;
- 0 hashes de línea inválidos;
- 0 palabras visibles artificiales.

Reproducibilidad:

- archivo `nam.json.gz`: 110,590 bytes;
- SHA-256: `60e280a6d94abc8788b7cc9647e4dfa0f679e0a9708a1adf00be30abfc23b7f5`;
- Nahúm 1:3 conserva Qere `וּגְדָל` y Ketiv `וּגְדוֹל` en el índice visible 4;
- Nahúm 1:15 conserva Qere `לַֽעֲבָר` y Ketiv `לַעֲבוֹר` en el índice 17;
- Nahúm 2:5 conserva Qere `בַּהֲלִֽיכָתָ֑ם` y Ketiv `בַהֲלִכוֹתָם` en el índice 4;
- Nahúm 3:3 conserva Qere `וְכָשְׁל֖וּ` y Ketiv `יִכְשְׁלוּ` en el índice 14.

Evidencia:

- PR #96;
- workflow `Validar paquete TAHOT de Nahúm`;
- ejecución final `30780924959` — `success`;
- artefacto `stepbible-nahum-package`;
- ID `8843576939`;
- digest `sha256:afda8649db99fbfc0ebbd42bb4c3f5ce9f2f96463d43bfaac58b105fc176c29b`;
- `docs/FASE_D_PAQUETE_TAHOT_NAHUM.md`.

No se construyó payload, no se modificó el importador y no se escribió en Supabase, RLS, interfaz o producción.

El Bloque 4 continúa activo. El siguiente incremento autorizado es inspeccionar los componentes léxicos de Nahúm y fijar únicamente los lemas canónicos de afijos que la fuente no expresa en hebreo. No construir payload ni importar Nahúm hasta completar y registrar esa política.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""


def main() -> int:
    text = MASTER.read_text(encoding="utf-8")
    if NEW in text:
        print("Documento maestro ya actualizado")
        return 0
    if text.count(OLD) != 1:
        raise SystemExit("No se encontró un único marcador del paquete de Nahúm")
    MASTER.write_text(text.replace(OLD, NEW, 1), encoding="utf-8")
    print("Documento maestro actualizado con el paquete de Nahúm")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
