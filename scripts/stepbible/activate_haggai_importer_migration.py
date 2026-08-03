#!/usr/bin/env python3
"""Convierte mecánicamente el borrador validado de Hageo en migración activa."""
from pathlib import Path

DRAFT = Path("supabase/migration-drafts/20260803020000_importador_payload_tahot_hageo.sql")
ACTIVE = Path("supabase/migrations/20260803022000_generalizar_importador_payload_tahot_hageo.sql")

OLD_HEADER = """-- FASE D · Bloque 4
-- BORRADOR NO ACTIVO. Amplía el importador validado para aceptar exactamente Hageo.
-- No aplicar a Supabase hasta completar la validación externa y registrar el resultado.
"""
NEW_HEADER = """-- FASE D · Bloque 4
-- MIGRACIÓN ACTIVA. Amplía el importador TAHOT validado para aceptar exactamente Hageo.
-- Verifica la huella de la función OBA/RUT y conserva ejecución exclusiva de service_role.
"""


def main() -> int:
    source = DRAFT.read_text(encoding="utf-8")
    if source.count(OLD_HEADER) != 1:
        raise SystemExit("El borrador no contiene el encabezado validado exactamente una vez")
    active = source.replace(OLD_HEADER, NEW_HEADER, 1)
    if "-- BORRADOR NO ACTIVO" in active:
        raise SystemExit("La migración activa conserva una marca de borrador")
    ACTIVE.parent.mkdir(parents=True, exist_ok=True)
    if ACTIVE.exists() and ACTIVE.read_text(encoding="utf-8") == active:
        print("Migración activa ya generada")
        return 0
    ACTIVE.write_text(active, encoding="utf-8")
    print(f"Migración activa generada: {ACTIVE}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
