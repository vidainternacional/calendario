#!/usr/bin/env python3
"""Valida la migración activa de Nahúm en PostgreSQL 16 sin tocar Supabase."""
from __future__ import annotations

import argparse
import copy
import gzip
import hashlib
import json
from pathlib import Path

import psycopg

from test_nahum_importer_draft import (
    BASE_FUNCTION_SHA256,
    EXPECTED_COMMITTED,
    EXPECTED_INITIAL,
    EXPECTED_RESULT,
    PACKAGE_SHA256,
    PAYLOAD_FILE_SHA256,
    PAYLOAD_SHA256,
    RollbackProbe,
    assert_editorial_integrity,
    assert_nahum_variants,
    assert_permissions,
    function_sha,
)
from test_ruth_importer_draft import SOURCE_FILES, call_import, counts

EXPECTED_ACTIVE_FUNCTION_SHA256 = (
    "69045240e658995cd0e1ba3557e54a2700b623078b36125e73ed1ada64f5139c"
)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dsn", required=True)
    parser.add_argument("--fixture", type=Path, required=True)
    parser.add_argument("--base-migration", type=Path, required=True)
    parser.add_argument("--ruth-migration", type=Path, required=True)
    parser.add_argument("--haggai-migration", type=Path, required=True)
    parser.add_argument("--active-migration", type=Path, required=True)
    parser.add_argument("--package", type=Path, required=True)
    parser.add_argument("--payload", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    active_text = args.active_migration.read_text(encoding="utf-8")
    lowered = active_text.lower()
    if args.active_migration.parent.name != "migrations":
        raise RuntimeError("La migración activa debe residir en supabase/migrations")
    if "-- migración activa" not in lowered:
        raise RuntimeError("El SQL no declara su estado de migración activa")
    if "-- borrador no activo" in lowered:
        raise RuntimeError("La migración activa conserva una marca de borrador")
    if "grant execute" in lowered and "to service_role" not in lowered:
        raise RuntimeError("La migración concede ejecución fuera de service_role")

    with gzip.open(args.package, "rt", encoding="utf-8") as handle:
        package = json.load(handle)
    raw_payload = args.payload.read_bytes()
    payload = json.loads(raw_payload.decode("utf-8"))
    if hashlib.sha256(raw_payload).hexdigest() != PAYLOAD_FILE_SHA256:
        raise RuntimeError("La huella del archivo payload no coincide")
    if payload["book"]["internal_code"] != package["book"]["internal_code"] or payload["book"]["internal_code"] != "NAM":
        raise RuntimeError("La identidad del libro no coincide")
    if payload["package_sha256"] != PACKAGE_SHA256 or payload["payload_sha256"] != PAYLOAD_SHA256:
        raise RuntimeError("Las huellas internas del payload no coinciden")

    with psycopg.connect(args.dsn, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(args.fixture.read_text(encoding="utf-8"))
            cur.execute("insert into public.biblical_books(code) values('RUT'),('HAG'),('NAM')")
            cur.execute(args.base_migration.read_text(encoding="utf-8"))
            cur.execute(args.ruth_migration.read_text(encoding="utf-8"))
            cur.execute(args.haggai_migration.read_text(encoding="utf-8"))
            if function_sha(cur) != BASE_FUNCTION_SHA256:
                raise RuntimeError("La función base OBA/RUT/HAG no coincide")
            cur.execute(active_text)
            installed_function_sha = function_sha(cur)
            if installed_function_sha != EXPECTED_ACTIVE_FUNCTION_SHA256:
                raise RuntimeError(
                    f"Huella activa inesperada: {installed_function_sha}"
                )
            assert_permissions(cur)
            cur.execute(
                "select strpos(pg_get_functiondef(%s::regprocedure),%s)>0",
                (
                    "internal.import_stepbible_tahot_payload(jsonb,jsonb)",
                    "Variantes inválidas para Nahúm",
                ),
            )
            if cur.fetchone()[0] is not True:
                raise RuntimeError("El validador de Nahúm no quedó instalado")
            if counts(cur) != EXPECTED_INITIAL:
                raise RuntimeError("La instalación de la migración escribió datos")

        malformed = copy.deepcopy(payload)
        target = next(
            item
            for item in malformed["variants"]
            if item["chapter"] == 1
            and item["verse"] == 15
            and item["reading_type"] == "substitution"
        )
        target["variant_reading"] = "ALTERADO"
        try:
            with conn.transaction():
                with conn.cursor() as cur:
                    call_import(cur, malformed)
        except psycopg.Error as error:
            if "Variantes inválidas para Nahúm" not in str(error):
                raise
        else:
            raise RuntimeError("La migración activa aceptó el payload adulterado")
        with conn.cursor() as cur:
            if counts(cur) != EXPECTED_INITIAL:
                raise RuntimeError("El payload rechazado dejó escrituras")

        try:
            with conn.transaction():
                with conn.cursor() as cur:
                    result = call_import(cur, payload)
                    if {key: result[key] for key in EXPECTED_RESULT} != EXPECTED_RESULT:
                        raise RuntimeError("El resultado del importador no coincide")
                    if counts(cur) != EXPECTED_COMMITTED:
                        raise RuntimeError("Los conteos dentro del rollback no coinciden")
                    assert_nahum_variants(cur)
                    assert_editorial_integrity(cur)
                    raise RollbackProbe
        except RollbackProbe:
            pass
        with conn.cursor() as cur:
            if counts(cur) != EXPECTED_INITIAL:
                raise RuntimeError("El rollback dejó residuos")

        with conn.transaction():
            with conn.cursor() as cur:
                first_result = call_import(cur, payload)
        with conn.cursor() as cur:
            committed = counts(cur)
            if committed != EXPECTED_COMMITTED:
                raise RuntimeError(f"Conteos comprometidos inesperados: {committed}")
            assert_nahum_variants(cur)
            assert_editorial_integrity(cur)

        with conn.transaction():
            with conn.cursor() as cur:
                second_result = call_import(cur, payload)
        with conn.cursor() as cur:
            if counts(cur) != committed or first_result != second_result:
                raise RuntimeError("La segunda ejecución no fue idempotente")
            cur.execute(
                "select metadata->'source_files' from public.biblical_sources where slug='stepbible-lexical-pilot'"
            )
            if cur.fetchone()[0] != SOURCE_FILES:
                raise RuntimeError("La metadata de archivos fuente cambió")

    result = {
        "active_migration": "passed",
        "invalid_payload_rejected": True,
        "rollback": "passed",
        "idempotency": "passed",
        "permissions": "service_role_only",
        "base_function_sha256": BASE_FUNCTION_SHA256,
        "installed_function_sha256": installed_function_sha,
        "committed_counts": committed,
        "package_sha256": PACKAGE_SHA256,
        "payload_file_sha256": PAYLOAD_FILE_SHA256,
        "payload_sha256": PAYLOAD_SHA256,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
