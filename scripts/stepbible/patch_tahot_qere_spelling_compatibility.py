#!/usr/bin/env python3
"""Conserva el contrato histórico de Rut al corregir Qere futuros."""
from pathlib import Path

TARGET = Path("scripts/stepbible/build_tahot_import_payload.py")

OLD_CONSTANTS = '''HEBREW_RE = re.compile(r"[\\u0590-\\u05ff]")
WITNESS_RE = re.compile(r"(?:^|;)\\s*([A-Za-z0-9]+)\\s*=")
'''

NEW_CONSTANTS = '''HEBREW_RE = re.compile(r"[\\u0590-\\u05ff]")
WITNESS_RE = re.compile(r"(?:^|;)\\s*([A-Za-z0-9]+)\\s*=")

# Rut ya fue importado y aprobado con el tratamiento histórico que conserva
# K junto a los demás testigos ortográficos. La excepción se fija por la
# huella exacta del paquete; cualquier paquete nuevo usa la separación correcta.
LEGACY_COMBINED_QERE_SPELLING_PACKAGE_SHAS = {
    "80a79abd038de9159a90e7aa572f1d4ff6a0c7f1ca8bfb4195875ffd5a7ca20c",
}
'''

OLD_DECISION = '''            meaning_has_k = bool(
                meaning_evidence
                and any(
                    witness == "K"
                    for witness, _body in witness_fragments(meaning_evidence)
                )
            )

            if spelling_evidence:
                orthographic_evidence = (
                    witness_summary_for(spelling_evidence, exclude={"K"})
                    if row["textual_status"] == "qere" and spelling_has_k
                    else spelling_evidence
                )
'''

NEW_DECISION = '''            meaning_has_k = bool(
                meaning_evidence
                and any(
                    witness == "K"
                    for witness, _body in witness_fragments(meaning_evidence)
                )
            )
            split_spelling_ketiv = (
                row["textual_status"] == "qere"
                and spelling_has_k
                and package_sha
                not in LEGACY_COMBINED_QERE_SPELLING_PACKAGE_SHAS
            )

            if spelling_evidence:
                orthographic_evidence = (
                    witness_summary_for(spelling_evidence, exclude={"K"})
                    if split_spelling_ketiv
                    else spelling_evidence
                )
'''

OLD_SUBSTITUTION = '''            if (
                row["textual_status"] == "qere"
                and spelling_has_k
                and not meaning_has_k
            ):
'''

NEW_SUBSTITUTION = '''            if split_spelling_ketiv and not meaning_has_k:
'''

OLD_TEST = '''    mixed_spelling = "L= לַֽעֲבָור;K= לַעֲבוֹר"
'''

NEW_TEST = '''    if (
        "80a79abd038de9159a90e7aa572f1d4ff6a0c7f1ca8bfb4195875ffd5a7ca20c"
        not in LEGACY_COMBINED_QERE_SPELLING_PACKAGE_SHAS
    ):
        raise RuntimeError("No se preservó la compatibilidad del paquete de Rut")
    mixed_spelling = "L= לַֽעֲבָור;K= לַעֲבוֹר"
'''


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if new in text:
        return text
    if text.count(old) != 1:
        raise SystemExit(f"No se encontró un único marcador para {label}")
    return text.replace(old, new, 1)


def main() -> int:
    text = TARGET.read_text(encoding="utf-8")
    text = replace_once(text, OLD_CONSTANTS, NEW_CONSTANTS, "compatibilidad de Rut")
    text = replace_once(text, OLD_DECISION, NEW_DECISION, "decisión de separación")
    text = replace_once(text, OLD_SUBSTITUTION, NEW_SUBSTITUTION, "sustitución Ketiv")
    text = replace_once(text, OLD_TEST, NEW_TEST, "auto-test de compatibilidad")
    TARGET.write_text(text, encoding="utf-8")
    print("Compatibilidad histórica de Rut fijada por SHA-256")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
