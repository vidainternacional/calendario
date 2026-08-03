#!/usr/bin/env python3
"""Separa Ketiv K de variantes ortográficas mixtas en el generador TAHOT."""
from pathlib import Path

TARGET = Path("scripts/stepbible/build_tahot_import_payload.py")

OLD_HELPERS = '''def witnesses(value: str) -> list[str]:
    found = WITNESS_RE.findall(value)
    return list(dict.fromkeys(found))
'''

NEW_HELPERS = '''def witness_summary_for(
    value: str,
    *,
    include: set[str] | None = None,
    exclude: set[str] | None = None,
) -> str:
    selected: list[str] = []
    for witness, body in witness_fragments(value):
        if include is not None and witness not in include:
            continue
        if exclude is not None and witness in exclude:
            continue
        selected.append(f"{witness}={body}")
    return ";".join(selected)


def witnesses(value: str) -> list[str]:
    found = WITNESS_RE.findall(value)
    return list(dict.fromkeys(found))
'''

OLD_VARIANTS = '''            if row["variants"]["spelling"]:
                evidence = row["variants"]["spelling"]
                variants.append(
                    build_variant(
                        package_sha=package_sha,
                        book_code=book_code,
                        row=row,
                        reading_type="orthographic",
                        base_reading=row["surface_form"],
                        variant_reading=spelling_reading(evidence),
                        witness_summary=evidence,
                        anchor_word_index=row["display_word_index"],
                    )
                )

            if row["variants"]["meaning"]:
                evidence = row["variants"]["meaning"]
                variants.append(
                    build_variant(
                        package_sha=package_sha,
                        book_code=book_code,
                        row=row,
                        reading_type="substitution",
                        base_reading=row["surface_form"],
                        variant_reading=meaning_reading(evidence),
                        witness_summary=evidence,
                        anchor_word_index=row["display_word_index"],
                    )
                )
'''

NEW_VARIANTS = '''            spelling_evidence = row["variants"]["spelling"]
            meaning_evidence = row["variants"]["meaning"]
            spelling_has_k = bool(
                spelling_evidence
                and any(
                    witness == "K"
                    for witness, _body in witness_fragments(spelling_evidence)
                )
            )
            meaning_has_k = bool(
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
                if orthographic_evidence:
                    variants.append(
                        build_variant(
                            package_sha=package_sha,
                            book_code=book_code,
                            row=row,
                            reading_type="orthographic",
                            base_reading=row["surface_form"],
                            variant_reading=spelling_reading(orthographic_evidence),
                            witness_summary=orthographic_evidence,
                            anchor_word_index=row["display_word_index"],
                        )
                    )

            if meaning_evidence:
                variants.append(
                    build_variant(
                        package_sha=package_sha,
                        book_code=book_code,
                        row=row,
                        reading_type="substitution",
                        base_reading=row["surface_form"],
                        variant_reading=meaning_reading(meaning_evidence),
                        witness_summary=meaning_evidence,
                        anchor_word_index=row["display_word_index"],
                    )
                )

            if (
                row["textual_status"] == "qere"
                and spelling_has_k
                and not meaning_has_k
            ):
                if meaning_evidence:
                    raise ValueError(
                        "Fila Qere con variante de significado no-K y Ketiv "
                        "ortográfico no representable sin ampliar variant_key: "
                        f"{row['reference']['english']}#{row['source_index']['raw']}"
                    )
                ketiv_evidence = witness_summary_for(spelling_evidence, include={"K"})
                variants.append(
                    build_variant(
                        package_sha=package_sha,
                        book_code=book_code,
                        row=row,
                        reading_type="substitution",
                        base_reading=row["surface_form"],
                        variant_reading=spelling_reading(ketiv_evidence, "K"),
                        witness_summary=ketiv_evidence,
                        anchor_word_index=row["display_word_index"],
                    )
                )
'''

OLD_TEST = '''    if spelling_reading("L= שְׁעָרָ֗/ו ¦ ;") != "שְׁעָרָ֗ו":
        raise RuntimeError("No se extrajo la lectura ortográfica")
    if meaning_reading(
'''

NEW_TEST = '''    if spelling_reading("L= שְׁעָרָ֗/ו ¦ ;") != "שְׁעָרָ֗ו":
        raise RuntimeError("No se extrajo la lectura ortográfica")
    mixed_spelling = "L= לַֽעֲבָור;K= לַעֲבוֹר"
    if witness_summary_for(mixed_spelling, exclude={"K"}) != "L=לַֽעֲבָור":
        raise RuntimeError("No se aisló la evidencia ortográfica no-K")
    ketiv_only = witness_summary_for(mixed_spelling, include={"K"})
    if ketiv_only != "K=לַעֲבוֹר" or spelling_reading(ketiv_only, "K") != "לַעֲבוֹר":
        raise RuntimeError("No se aisló el Ketiv dentro de la evidencia ortográfica")
    if meaning_reading(
'''


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if new in text:
        return text
    if text.count(old) != 1:
        raise SystemExit(f"No se encontró un único marcador para {label}")
    return text.replace(old, new, 1)


def main() -> int:
    text = TARGET.read_text(encoding="utf-8")
    text = replace_once(text, OLD_HELPERS, NEW_HELPERS, "filtro de testigos")
    text = replace_once(text, OLD_VARIANTS, NEW_VARIANTS, "variantes Qere mixtas")
    text = replace_once(text, OLD_TEST, NEW_TEST, "auto-test Qere mixto")
    TARGET.write_text(text, encoding="utf-8")
    print("Generador TAHOT actualizado para Ketiv dentro de evidencia ortográfica")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
