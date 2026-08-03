#!/usr/bin/env python3
"""Corrige de forma exacta la cita SQL del verificador final de Hageo."""
from pathlib import Path

MIGRATION = Path("supabase/migrations/20260803023000_generalizar_importador_payload_tahot_hageo.sql")
TEST = Path("scripts/stepbible/test_haggai_active_migration.py")

BAD_SQL = 'strpos(v_definition,"v_book_code=\'HAG\'")'
GOOD_SQL = "strpos(v_definition,'v_book_code=''HAG''')"

OLD_TEST = '    lowered = active_text.lower()\n    if args.active_migration.parent.name != "migrations":\n'
NEW_TEST = '''    lowered = active_text.lower()
    if 'strpos(v_definition,"' in active_text:
        raise RuntimeError("La migración contiene una cadena SQL con comillas de identificador")
    if args.active_migration.parent.name != "migrations":
'''


def main() -> int:
    migration = MIGRATION.read_text(encoding="utf-8")
    if GOOD_SQL not in migration:
        if migration.count(BAD_SQL) != 1:
            raise SystemExit("No se encontró una única cita SQL incorrecta")
        migration = migration.replace(BAD_SQL, GOOD_SQL, 1)
        MIGRATION.write_text(migration, encoding="utf-8")

    test = TEST.read_text(encoding="utf-8")
    if NEW_TEST not in test:
        if test.count(OLD_TEST) != 1:
            raise SystemExit("No se encontró un único punto de inserción en la prueba")
        TEST.write_text(test.replace(OLD_TEST, NEW_TEST, 1), encoding="utf-8")

    print("Cita SQL de Hageo corregida y comprobación estática añadida")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
