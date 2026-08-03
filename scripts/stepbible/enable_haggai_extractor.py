#!/usr/bin/env python3
"""Habilita Hageo en el extractor TAHOT genérico mediante reemplazos exactos."""
from pathlib import Path

TARGET = Path("scripts/stepbible/extract_ot_book.py")

OLD_CATALOG = '''    "Rut": {
        "internal_code": "RUT",
        "name_es": "Rut",
        "verse_counts": [22, 23, 18, 22],
    },
}
'''

NEW_CATALOG = '''    "Rut": {
        "internal_code": "RUT",
        "name_es": "Rut",
        "verse_counts": [22, 23, 18, 22],
    },
    "Hag": {
        "internal_code": "HAG",
        "name_es": "Hageo",
        "verse_counts": [15, 23],
    },
}
'''

OLD_TEST = '''    if len(expected_references("Rut", BOOKS["Rut"]["verse_counts"])) != 85:
        raise RuntimeError("El catálogo de versículos de Rut no contiene 85 referencias")
    print("Auto-test de paquete TAHOT: OK")
'''

NEW_TEST = '''    if len(expected_references("Rut", BOOKS["Rut"]["verse_counts"])) != 85:
        raise RuntimeError("El catálogo de versículos de Rut no contiene 85 referencias")
    if len(expected_references("Hag", BOOKS["Hag"]["verse_counts"])) != 38:
        raise RuntimeError("El catálogo de versículos de Hageo no contiene 38 referencias")
    print("Auto-test de paquete TAHOT: OK")
'''


def main() -> int:
    text = TARGET.read_text(encoding="utf-8")
    if NEW_CATALOG in text and NEW_TEST in text:
        print("Hageo ya está habilitado")
        return 0
    if text.count(OLD_CATALOG) != 1:
        raise SystemExit("No se encontró un único catálogo de Rut para insertar Hageo")
    if text.count(OLD_TEST) != 1:
        raise SystemExit("No se encontró un único auto-test de Rut")
    text = text.replace(OLD_CATALOG, NEW_CATALOG, 1)
    text = text.replace(OLD_TEST, NEW_TEST, 1)
    TARGET.write_text(text, encoding="utf-8")
    print("Hageo habilitado en el extractor TAHOT")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
