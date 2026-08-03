#!/usr/bin/env python3
"""Valida la migración activa del importador TAHOT de Hageo en PostgreSQL 16."""
from __future__ import annotations

import argparse
import copy
import gzip
import hashlib
import json
from pathlib import Path

import psycopg

from test_haggai_importer_draft import (
    BASE_FUNCTION_SHA256,
    EXPECTED_COMMITTED,
    EXPECTED_INITIAL,
    EXPECTED_RESULT,
    PACKAGE_SHA256,
    PAYLOAD_FILE_SHA256,
    PAYLOAD_SHA256,
    RollbackProbe,
    assert_haggai_variants,
    assert_permissions,
    function_sha,
)
from test_ruth_importer_draft import call_import, counts


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dsn", required=True)
    parser.add_argument("--fixture", type=Path, required=True)
    parser.add_argument("--base-migration", type=Path, required=True)
    parser.add_argument("--ruth-migration", type=Path, required=True)
    parser.add_argument("--active-migration", type=Path, required=True)
    parser.add_argument("--package", type=Path, required=True)
    parser.add_argument("--payload", type=Path, required=True)
    args = parser.parse_args()

    active_text = args.active_migration.read_text(encoding="utf-8")
    lowered = active_text.lower()
    if 'strpos(v_definition,"' in active_text:
        raise RuntimeError("La migración contiene una cadena SQL con comillas de identificador")
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
    assert hashlib.sha256(raw_payload).hexdigest() == PAYLOAD_FILE_SHA256
    assert payload["book"]["internal_code"] == package["book"]["internal_code"] == "HAG"
    assert payload["package_sha256"] == PACKAGE_SHA256
    assert payload["payload_sha256"] == PAYLOAD_SHA256

    with psycopg.connect(args.dsn, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(args.fixture.read_text(encoding="utf-8"))
            cur.execute("insert into public.biblical_books(code) values('RUT'),('HAG')")
            cur.execute(args.base_migration.read_text(encoding="utf-8"))
            cur.execute(args.ruth_migration.read_text(encoding="utf-8"))
            assert function_sha(cur) == BASE_FUNCTION_SHA256
            cur.execute(active_text)
            assert_permissions(cur)
            cur.execute(
                "select strpos(pg_get_functiondef(%s::regprocedure),%s)>0",
                (
                    "internal.import_stepbible_tahot_payload(jsonb,jsonb)",
                    "Variantes inválidas para Hageo",
                ),
            )
            assert cur.fetchone()[0] is True
            assert counts(cur) == EXPECTED_INITIAL

        malformed = copy.deepcopy(payload)
        target = next(
            item for item in malformed["variants"]
            if item["chapter"] == 1
            and item["verse"] == 8
            and item["reading_type"] == "substitution"
        )
        target["variant_reading"] = "ALTERADO"
        try:
            with conn.transaction():
                with conn.cursor() as cur:
                    call_import(cur, malformed)
        except psycopg.Error as error:
            if "Variantes inválidas para Hageo" not in str(error):
                raise
        else:
            raise RuntimeError("La migración activa aceptó el payload adulterado")
        with conn.cursor() as cur:
            assert counts(cur) == EXPECTED_INITIAL

        try:
            with conn.transaction():
                with conn.cursor() as cur:
                    result = call_import(cur, payload)
                    assert {key: result[key] for key in EXPECTED_RESULT} == EXPECTED_RESULT
                    assert counts(cur) == EXPECTED_COMMITTED
                    assert_haggai_variants(cur)
                    raise RollbackProbe
        except RollbackProbe:
            pass
        with conn.cursor() as cur:
            assert counts(cur) == EXPECTED_INITIAL

        with conn.transaction():
            with conn.cursor() as cur:
                first_result = call_import(cur, payload)
        with conn.cursor() as cur:
            committed = counts(cur)
            assert committed == EXPECTED_COMMITTED
            assert_haggai_variants(cur)

        with conn.transaction():
            with conn.cursor() as cur:
                second_result = call_import(cur, payload)
        with conn.cursor() as cur:
            assert counts(cur) == committed
            assert first_result == second_result

    print(json.dumps({
        "active_migration": "passed",
        "invalid_payload_rejected": True,
        "rollback": "passed",
        "idempotency": "passed",
        "permissions": "service_role_only",
        "committed_counts": committed,
        "package_sha256": PACKAGE_SHA256,
        "payload_file_sha256": PAYLOAD_FILE_SHA256,
        "payload_sha256": PAYLOAD_SHA256,
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
