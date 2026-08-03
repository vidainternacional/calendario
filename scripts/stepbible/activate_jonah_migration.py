#!/usr/bin/env python3
"""Convierte mecánicamente el borrador validado de Jonás en migración activa."""
from __future__ import annotations

import argparse
from pathlib import Path

DRAFT_MARKER = "-- BORRADOR NO ACTIVO. Amplía el importador validado para aceptar exactamente Jonás."
ACTIVE_MARKER = "-- MIGRACIÓN ACTIVA. Amplía el importador validado para aceptar exactamente Jonás."


def activate(text: str) -> str:
    if ACTIVE_MARKER in text and DRAFT_MARKER not in text:
        return text
    if text.count(DRAFT_MARKER) != 1:
        raise RuntimeError("El borrador no contiene un único marcador de activación")
    activated = text.replace(DRAFT_MARKER, ACTIVE_MARKER, 1)
    if "-- BORRADOR NO ACTIVO" in activated:
        raise RuntimeError("La migración activada conserva una marca de borrador")
    return activated


def self_test() -> None:
    sample = "-- FASE D\n" + DRAFT_MARKER + "\nselect 1;\n"
    result = activate(sample)
    if ACTIVE_MARKER not in result or DRAFT_MARKER in result:
        raise RuntimeError("La activación sintética no fue exacta")
    if activate(result) != result:
        raise RuntimeError("La activación no es idempotente")
    print("Auto-test de activación de Jonás: OK")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--draft", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return 0
    if args.draft is None or args.output is None:
        parser.error("--draft y --output son obligatorios")
    result = activate(args.draft.read_text(encoding="utf-8"))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(result, encoding="utf-8")
    print(f"Migración activa de Jonás generada: {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
