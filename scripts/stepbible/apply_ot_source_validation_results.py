#!/usr/bin/env python3
"""Aplica resultados TAHOT ya validados a código y documento maestro."""
from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if new in text:
        return text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: se esperaba un marcador y se encontraron {count}")
    return text.replace(old, new, 1)


inspector = Path("scripts/stepbible/inspect_ot_sources.py")
text = inspector.read_text(encoding="utf-8")
for key, filename, books, digest in [
    (
        "tahot-gen-deu",
        "TAHOT Gen-Deu - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
        "Gen Exo Lev Num Deu",
        "e9b8546ee48fe0bfc57c3b70f5f40e98d96580e803526d19026224e31753368b",
    ),
    (
        "tahot-jos-est",
        "TAHOT Jos-Est - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
        "Jos Jdg Rut 1Sa 2Sa 1Ki 2Ki 1Ch 2Ch Ezr Neh Est",
        "195fee1dc3653bab33701f170734eb894ed647c10cd08cc61749375fe8b73775",
    ),
    (
        "tahot-isa-mal",
        "TAHOT Isa-Mal - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
        "Isa Jer Lam Ezk Dan Hos Jol Amo Oba Jon Mic Nam Hab Zep Hag Zec Mal",
        "f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5",
    ),
]:
    old = (
        f'"key": "{key}",\n'
        f'        "file": "{filename}",\n'
        f'        "books": "{books}".split(),\n'
        '        "sha256": None,'
    )
    new = (
        f'"key": "{key}",\n'
        f'        "file": "{filename}",\n'
        f'        "books": "{books}".split(),\n'
        f'        "sha256": "{digest}",'
    )
    text = replace_once(text, old, new, f"hash {key}")
inspector.write_text(text, encoding="utf-8")

source_doc = Path("docs/FASE_D_FUENTES_TEXTUALES_AT.md")
text = source_doc.read_text(encoding="utf-8")
marker = "## Validaciones siguientes\n"
addition = """## Resultado automatizado confirmado

La inspección completa aprobó:

- 4 archivos;
- 39 libros;
- 23,261 referencias distintas de la fuente;
- 305,652 filas con referencia explícita;
- 46,517 filas continuadas;
- 23,257 cabeceras repetidas `Eng (Heb) Ref & Type`;
- 283 filas de preámbulo;
- 70,208,423 bytes descargados;
- los cuatro hashes SHA-256 fijados en el inspector.

La evidencia detallada está en `docs/FASE_D_VALIDACION_FUENTES_TAHOT.md`.

"""
if addition not in text:
    text = replace_once(text, marker, addition + marker, "documento TAHOT")
    source_doc.write_text(text, encoding="utf-8")

master = Path("__VIDA_INTERNACIONAL.md")
text = master.read_text(encoding="utf-8")
marker = """El Bloque 4 continúa activo. El siguiente recorrido es importar por lotes los libros del Nuevo Testamento con correspondencia directa, aprobar los mapas de 2 Corintios, 3 Juan y Apocalipsis, ampliar el corpus hebreo y arameo y, finalmente, publicar una visualización general dentro de **Biblia → Estudio**.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""
replacement = """### Avance confirmado del Bloque 4 — Nuevo Testamento textual visible

Los 27 libros del Nuevo Testamento ya están importados y recuperables mediante el perfil de versificación de la traducción seleccionada.

Resultado acumulado:

- capítulos: 260;
- referencias TAGNT: 7,958;
- palabras base: 138,096;
- lecturas adicionales: 4,000;
- ocurrencias: 142,096;
- variantes documentadas: 6,409;
- hashes inválidos: 0.

La visualización general está integrada en **Biblia → Estudio** y **Estudio Profundo** con texto original, transliteración, glosas, Strong, morfología, variantes, edición base, fuente y licencia. Los ejemplos de Juan 3:16, 3 Juan 1:14 y Apocalipsis 13:1 fueron revisados y aprobados visualmente por el usuario el 2026-08-02.

Evidencia:

- PR #58;
- commit `8286d80495defd21e01c0c27854253bd93d143a2`;
- preview `dpl_4yJHqNwqRfx1nMtPfqevHL1TT5E4` — `READY`;
- `docs/FASE_D_VISUALIZACION_TEXTUAL_NT.md`.

### Avance confirmado del Bloque 4 — fuentes textuales del Antiguo Testamento

Las cuatro fuentes TAHOT fijadas al commit de STEPBible fueron descargadas y validadas antes de diseñar la importación masiva.

Resultado:

- archivos: 4;
- libros esperados y encontrados: 39;
- referencias distintas de la fuente: 23,261;
- filas con referencia explícita: 305,652;
- filas continuadas: 46,517;
- cabeceras repetidas identificadas: 23,257;
- filas de preámbulo: 283;
- tamaño total: 70,208,423 bytes;
- cuatro hashes SHA-256 fijados;
- ninguna modificación de Supabase, interfaz o producción durante esta inspección.

Las referencias son las de la fuente hebrea y no se asumirán como numeración global de las traducciones. Las correspondencias se resolverán según la traducción activa.

Documentación:

- `docs/FASE_D_FUENTES_TEXTUALES_AT.md`;
- `docs/FASE_D_VALIDACION_FUENTES_TAHOT.md`.

El Bloque 4 continúa activo. El siguiente recorrido es interpretar de forma verificable las 17 columnas y las filas continuadas de TAHOT, distinguir hebreo y arameo, modelar Ketiv/Qere y generar paquetes por libro. Después se importará primero un libro pequeño y se validará antes de ampliar a los 39.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""
if replacement not in text:
    text = replace_once(text, marker, replacement, "cierre maestro Bloque 4")
    master.write_text(text, encoding="utf-8")
