#!/usr/bin/env python3
"""Habilita Nahúm en el extractor genérico mediante reemplazos exactos."""
from pathlib import Path

TARGET = Path("scripts/stepbible/extract_ot_book.py")

OLD_CATALOG = '''    "Hag": {
        "internal_code": "HAG",
        "name_es": "Hageo",
        "verse_counts": [15, 23],
    },
}
'''

NEW_CATALOG = '''    "Hag": {
        "internal_code": "HAG",
        "name_es": "Hageo",
        "verse_counts": [15, 23],
    },
    "Nam": {
        "internal_code": "NAM",
        "name_es": "Nahúm",
        "verse_counts": [15, 13, 19],
    },
}
'''

OLD_TEST = '''    if len(expected_references("Hag", BOOKS["Hag"]["verse_counts"])) != 38:
        raise RuntimeError("El catálogo de versículos de Hageo no contiene 38 referencias")
    print("Auto-test de paquete TAHOT: OK")
'''

NEW_TEST = '''    if len(expected_references("Hag", BOOKS["Hag"]["verse_counts"])) != 38:
        raise RuntimeError("El catálogo de versículos de Hageo no contiene 38 referencias")
    if len(expected_references("Nam", BOOKS["Nam"]["verse_counts"])) != 47:
        raise RuntimeError("El catálogo de versículos de Nahúm no contiene 47 referencias")
    print("Auto-test de paquete TAHOT: OK")
'''


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if new in text:
        return text
    if text.count(old) != 1:
        raise SystemExit(f"No se encontró un único marcador para {label}")
    return text.replace(old, new, 1)


def main() -> int:
    text = TARGET.read_text(encoding="utf-8")
    text = replace_once(text, OLD_CATALOG, NEW_CATALOG, "catálogo de Nahúm")
    text = replace_once(text, OLD_TEST, NEW_TEST, "auto-test de Nahúm")
    TARGET.write_text(text, encoding="utf-8")
    print("Nahúm habilitado en el extractor genérico")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
