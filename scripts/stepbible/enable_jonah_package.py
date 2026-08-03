#!/usr/bin/env python3
"""Habilita Jonás en el extractor genérico mediante reemplazos exactos."""
from pathlib import Path

TARGET = Path("scripts/stepbible/extract_ot_book.py")

OLD_CATALOG = '''    "Nam": {
        "internal_code": "NAM",
        "name_es": "Nahúm",
        "verse_counts": [15, 13, 19],
    },
}
'''

NEW_CATALOG = '''    "Nam": {
        "internal_code": "NAM",
        "name_es": "Nahúm",
        "verse_counts": [15, 13, 19],
    },
    "Jon": {
        "internal_code": "JON",
        "name_es": "Jonás",
        "verse_counts": [17, 10, 10, 11],
    },
}
'''

OLD_TEST = '''    if len(expected_references("Nam", BOOKS["Nam"]["verse_counts"])) != 47:
        raise RuntimeError("El catálogo de versículos de Nahúm no contiene 47 referencias")
    print("Auto-test de paquete TAHOT: OK")
'''

NEW_TEST = '''    if len(expected_references("Nam", BOOKS["Nam"]["verse_counts"])) != 47:
        raise RuntimeError("El catálogo de versículos de Nahúm no contiene 47 referencias")
    if len(expected_references("Jon", BOOKS["Jon"]["verse_counts"])) != 48:
        raise RuntimeError("El catálogo de versículos de Jonás no contiene 48 referencias")
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
    text = replace_once(text, OLD_CATALOG, NEW_CATALOG, "catálogo de Jonás")
    text = replace_once(text, OLD_TEST, NEW_TEST, "auto-test de Jonás")
    TARGET.write_text(text, encoding="utf-8")
    print("Jonás habilitado en el extractor genérico")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
