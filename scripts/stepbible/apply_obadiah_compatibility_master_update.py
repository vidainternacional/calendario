#!/usr/bin/env python3
"""Registra la auditoría de compatibilidad de Obadías en el documento maestro."""
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")

OLD = """El Bloque 4 continúa activo. El siguiente recorrido es comprobar la compatibilidad exacta del paquete de Obadías con `biblical_lexical_entries`, `biblical_word_occurrences`, `biblical_verse_texts`, `biblical_textual_variants` y los perfiles de versificación. Solo después de esa auditoría se diseñará una migración piloto transaccional para Obadías.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

NEW = """### Avance confirmado del Bloque 4 — compatibilidad de Obadías con Supabase

El paquete textual de Obadías quedó auditado contra el modelo real de Supabase sin escribir datos ni cambiar el esquema.

Resultado:

- el modelo es estructuralmente compatible y no necesita DDL;
- entradas léxicas únicas: 184;
- entradas existentes reutilizables: 2;
- entradas nuevas máximas: 182;
- ocurrencias morfológicas: 434;
- raíces: 291;
- prefijos: 103;
- sufijos: 40;
- textos de versículo: 21;
- filas fuente con variantes: 2;
- variantes estructuradas: 3;
- claves duplicadas: 0;
- identificadores inválidos: 0;
- números Strong inválidos: 0;
- idiomas desconocidos: 0.

Compatibilidad confirmada:

- `biblical_lexical_entries`: admite los 184 identificadores después de normalizar llaves y etiquetas de puntuación;
- `biblical_word_occurrences`: admite los 434 morfemas usando `word_index`, `display_word_index` y `morpheme_index`;
- `biblical_verse_texts`: admite 21 textos hebreos RTL;
- `biblical_textual_variants`: admite una variante ortográfica en 1:8 y dos variantes separadas en 1:11;
- `biblical_verse_mappings`: Obadías usa correspondencia directa con R09 y no necesita filas `identity`;
- RLS, permisos y políticas existentes permanecen suficientes.

Controles obligatorios antes de importar:

1. reutilizar entradas existentes sin sobrescribirlas;
2. aplicar una política canónica para lemas de prefijos y sufijos —especialmente `H9020`, donde TAHOT entrega `Ps1c` pero la base conserva `־י`—;
3. mantener glosas inglesas como fuente y contenido español como capa editorial separada;
4. exigir en una sola transacción 21 textos, 291 palabras visibles, 434 ocurrencias, 184 identificadores y 3 variantes.

Validación:

- PR #63;
- workflow `Validar compatibilidad de Obadías con Supabase`;
- ejecución `30770632659` — `success`;
- commit `aa0e7ff9259780d27fafb80cf13a8f6e613b0423`;
- artefacto `obadiah-supabase-compatibility`;
- digest `sha256:9128d581500334677ac2c72cfbab74ad3a0f1f8fc7fdaacd8ac414bdff8982d9`;
- `docs/FASE_D_COMPATIBILIDAD_OBADIAS_SUPABASE.md`.

No se modificó Supabase, la interfaz ni producción durante esta auditoría.

El Bloque 4 continúa activo. El siguiente recorrido es diseñar y versionar una migración piloto transaccional e idempotente para Obadías. La migración deberá resolver la política de lemas de afijos y separar de forma explícita los datos fuente ingleses del contenido editorial español. No se aplicará a Supabase hasta pasar una revisión estática y una prueba de rollback.

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
