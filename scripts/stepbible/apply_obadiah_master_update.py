#!/usr/bin/env python3
"""Registra el paquete TAHOT de Obadías en el documento maestro."""
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")

OLD = """El Bloque 4 continúa activo. El siguiente recorrido es generar paquetes reproducibles por libro con texto, morfemas, transliteración, glosas, idioma, Qere/Ketiv, restauraciones, adiciones LXX, referencias y hashes. El primer paquete completo será un libro pequeño y deberá aprobarse antes de importar contenido a Supabase o ampliar el proceso a los 39 libros.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

NEW = """### Avance confirmado del Bloque 4 — primer paquete textual completo del Antiguo Testamento

Obadías quedó generado y auditado como primer paquete completo construido desde TAHOT, todavía sin importarlo a Supabase.

Resultado:

- capítulos: 1;
- referencias: 21 de 21;
- filas fuente: 291;
- palabras visibles: 291;
- componentes morfológicos: 434;
- filas hebreas: 291;
- filas arameas: 0;
- filas con variantes: 2;
- lecturas Qere: 1;
- omisiones Qere: 0;
- texto restaurado: 0;
- adiciones reconstruidas desde la LXX: 0;
- desalineaciones entre columnas: 0;
- idiomas desconocidos: 0;
- hashes inválidos: 0.

Variantes verificadas:

- Obadías 1:8 conserva una diferencia ortográfica documentada;
- Obadías 1:11 conserva Qere como lectura principal y Ketiv como variante separada.

Reproducibilidad:

- dos ejecuciones independientes produjeron exactamente 55,413 bytes;
- SHA-256 estable de `oba.json.gz`: `b49dee68303e243c0c2ef4ff3366cbd955a4a8a9b14114eb761a8f174e25940e`;
- manifiestos y bytes comprimidos idénticos;
- 291 hashes de línea y 21 hashes de versículo recalculados sin diferencias.

Validación final:

- PR #61;
- workflow `Validar paquete TAHOT de Obadías`;
- ejecución `30769691488` — `success`;
- commit `e5ae0d8c89982a8e4148118bc2034498e87067c9`;
- artefacto `stepbible-obadiah-package`;
- digest del contenedor de GitHub Actions `sha256:aef89da8f2a9d4e23dfb804a67db387a310a76ba19cf351af517989e5b8d8455`;
- `docs/FASE_D_PAQUETE_TAHOT_OBADIAS.md`;
- `docs/FASE_D_REPRODUCIBILIDAD_OBADIAS.md`.

No se modificó Supabase, la interfaz ni producción durante este incremento. Las glosas inglesas se conservan como dato fuente y todavía no constituyen una traducción literal española aprobada.

El Bloque 4 continúa activo. El siguiente recorrido es comprobar la compatibilidad exacta del paquete de Obadías con `biblical_lexical_entries`, `biblical_word_occurrences`, `biblical_verse_texts`, `biblical_textual_variants` y los perfiles de versificación. Solo después de esa auditoría se diseñará una migración piloto transaccional para Obadías.

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
