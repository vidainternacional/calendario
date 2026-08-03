#!/usr/bin/env python3
"""Valida la migración activa de Jonás reutilizando el contrato PostgreSQL del borrador."""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
import tempfile
from pathlib import Path

DRAFT_MARKER = "-- BORRADOR NO ACTIVO. Amplía el importador validado para aceptar exactamente Jonás."
ACTIVE_MARKER = "-- MIGRACIÓN ACTIVA. Amplía el importador validado para aceptar exactamente Jonás."
EXPECTED_FUNCTION_SHA256 = "0d65c4d8e8ac81368cea6e5b6fd3fb104156cc3e3e3f299426b20752eef7f062"


def self_test() -> None:
    sample = "-- FASE D\n" + ACTIVE_MARKER + "\nselect 1;\n"
    converted = sample.replace(ACTIVE_MARKER, DRAFT_MARKER, 1)
    if converted.count(DRAFT_MARKER) != 1 or ACTIVE_MARKER in converted:
        raise RuntimeError("La conversión sintética activa→borrador falló")
    print("Auto-test de migración activa de Jonás: OK")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dsn", required=False)
    parser.add_argument("--fixture", type=Path)
    parser.add_argument("--base-migration", type=Path)
    parser.add_argument("--ruth-migration", type=Path)
    parser.add_argument("--haggai-migration", type=Path)
    parser.add_argument("--nahum-migration", type=Path)
    parser.add_argument("--active-migration", type=Path)
    parser.add_argument("--package", type=Path)
    parser.add_argument("--payload", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return 0

    required = [
        args.dsn,
        args.fixture,
        args.base_migration,
        args.ruth_migration,
        args.haggai_migration,
        args.nahum_migration,
        args.active_migration,
        args.package,
        args.payload,
        args.output,
    ]
    if any(value is None for value in required):
        parser.error("Faltan argumentos obligatorios")

    active_path = args.active_migration
    active_text = active_path.read_text(encoding="utf-8")
    if active_path.parent.name != "migrations":
        raise RuntimeError("El SQL activo debe estar dentro de supabase/migrations")
    if active_text.count(ACTIVE_MARKER) != 1:
        raise RuntimeError("La migración no contiene una única marca activa")
    if DRAFT_MARKER in active_text or "-- BORRADOR NO ACTIVO" in active_text:
        raise RuntimeError("La migración activa conserva una marca de borrador")

    active_file_sha256 = hashlib.sha256(active_path.read_bytes()).hexdigest()

    with tempfile.TemporaryDirectory(prefix="vida-jonah-active-") as temp_dir:
        temp_root = Path(temp_dir)
        draft_dir = temp_root / "migration-drafts"
        draft_dir.mkdir(parents=True)
        converted_path = draft_dir / "jonah-active-as-draft.sql"
        converted_path.write_text(
            active_text.replace(ACTIVE_MARKER, DRAFT_MARKER, 1),
            encoding="utf-8",
        )
        inner_output = temp_root / "inner-validation.json"

        command = [
            sys.executable,
            "scripts/stepbible/test_jonah_importer_draft.py",
            "--dsn",
            args.dsn,
            "--fixture",
            str(args.fixture),
            "--base-migration",
            str(args.base_migration),
            "--ruth-migration",
            str(args.ruth_migration),
            "--haggai-migration",
            str(args.haggai_migration),
            "--nahum-migration",
            str(args.nahum_migration),
            "--draft",
            str(converted_path),
            "--package",
            str(args.package),
            "--payload",
            str(args.payload),
            "--output",
            str(inner_output),
        ]
        subprocess.run(command, check=True)
        result = json.loads(inner_output.read_text(encoding="utf-8"))

    if result.get("installed_function_sha256") != EXPECTED_FUNCTION_SHA256:
        raise RuntimeError(
            "Huella de función activa inesperada: "
            f"{result.get('installed_function_sha256')}"
        )

    result.update(
        {
            "active_migration": "passed",
            "active_migration_sha256": active_file_sha256,
            "active_marker": "verified",
            "draft_marker_absent": True,
            "status": "validated_outside_production",
        }
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
