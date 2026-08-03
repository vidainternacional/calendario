#!/usr/bin/env python3
"""Valida la migración activa de Rut sobre la función previamente instalada para Abdías."""
from __future__ import annotations

import argparse
import copy
import gzip
import json
from pathlib import Path

import psycopg

from test_ruth_importer_draft import SOURCE_FILES, call_import, counts

EXPECTED_INITIAL = {
    "lexical": 2,
    "occurrences": 0,
    "verses": 0,
    "variants": 0,
    "batches": 0,
}
EXPECTED_COMMITTED = {
    "lexical": 373,
    "occurrences": 2026,
    "verses": 85,
    "variants": 29,
    "batches": 1,
}
BASE_FUNCTION_SHA256 = "a6c99f4a12dd9fc33a5df23eaa3165c71b93799e3001d257deeb2a77d06c624c"


class RollbackProbe(Exception):
    pass


def function_sha(cur: psycopg.Cursor) -> str:
    cur.execute(
        """
        select encode(
          extensions.digest(
            convert_to(pg_get_functiondef(
              'internal.import_stepbible_tahot_payload(jsonb,jsonb)'::regprocedure
            ),'UTF8'),
            'sha256'
          ),
          'hex'
        )
        """
    )
    row = cur.fetchone()
    assert row is not None
    return row[0]


def assert_permissions(cur: psycopg.Cursor) -> None:
    signature = "internal.import_stepbible_tahot_payload(jsonb,jsonb)"
    for role in ("anon", "authenticated"):
        cur.execute("select has_function_privilege(%s,%s,'EXECUTE')", (role, signature))
        assert cur.fetchone()[0] is False, role
    cur.execute("select has_function_privilege('service_role',%s,'EXECUTE')", (signature,))
    assert cur.fetchone()[0] is True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dsn", required=True)
    parser.add_argument("--fixture", type=Path, required=True)
    parser.add_argument("--base-migration", type=Path, required=True)
    parser.add_argument("--active-migration", type=Path, required=True)
    parser.add_argument("--package", type=Path, required=True)
    parser.add_argument("--payload", type=Path, required=True)
    args = parser.parse_args()

    active_text = args.active_migration.read_text(encoding="utf-8")
    if args.active_migration.parent.name != "migrations":
        raise RuntimeError("La activación debe residir en supabase/migrations")
    if "-- MIGRACIÓN ACTIVA" not in active_text:
        raise RuntimeError("La migración no declara su estado activo")

    with gzip.open(args.package, "rt", encoding="utf-8") as handle:
        package = json.load(handle)
    payload = json.loads(args.payload.read_text(encoding="utf-8"))
    assert payload["book"]["internal_code"] == package["book"]["internal_code"] == "RUT"
    assert payload["package_sha256"] == "80a79abd038de9159a90e7aa572f1d4ff6a0c7f1ca8bfb4195875ffd5a7ca20c"
    assert payload["payload_sha256"] == "d88763cef355dc05d3251438f3adce08a99feed389b82502e8c8f1263d7b79ee"

    with psycopg.connect(args.dsn, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(args.fixture.read_text(encoding="utf-8"))
            cur.execute("insert into public.biblical_books(code) values('RUT')")
            cur.execute(args.base_migration.read_text(encoding="utf-8"))
            assert function_sha(cur) == BASE_FUNCTION_SHA256
            cur.execute(active_text)
            assert_permissions(cur)
            cur.execute(
                "select strpos(pg_get_functiondef(%s::regprocedure),%s)>0",
                (
                    "internal.import_stepbible_tahot_payload(jsonb,jsonb)",
                    "Omisión Qere inválida para Rut 3:12",
                ),
            )
            assert cur.fetchone()[0] is True
            assert counts(cur) == EXPECTED_INITIAL

        invalid_payload = copy.deepcopy(payload)
        target = next(
            variant
            for variant in invalid_payload["variants"]
            if variant["chapter"] == 3
            and variant["verse"] == 12
            and variant["reading_type"] == "addition"
        )
        target["variant_reading"] = "ALTERADO"
        try:
            with conn.transaction():
                with conn.cursor() as cur:
                    call_import(cur, invalid_payload)
        except psycopg.Error as exc:
            if "Omisión Qere inválida para Rut 3:12" not in str(exc):
                raise
        else:
            raise RuntimeError("El payload Qere adulterado no fue rechazado")
        with conn.cursor() as cur:
            assert counts(cur) == EXPECTED_INITIAL

        try:
            with conn.transaction():
                with conn.cursor() as cur:
                    result = call_import(cur, payload)
                    assert result["references"] == 85
                    assert result["occurrences"] == 2026
                    assert result["variants"] == 29
                    assert counts(cur) == EXPECTED_COMMITTED
                    raise RollbackProbe
        except RollbackProbe:
            pass
        with conn.cursor() as cur:
            assert counts(cur) == EXPECTED_INITIAL

        with conn.transaction():
            with conn.cursor() as cur:
                result = call_import(cur, payload)
                assert result["bad_hashes"] == 0
        with conn.cursor() as cur:
            committed = counts(cur)
            assert committed == EXPECTED_COMMITTED
            cur.execute(
                """
                select count(*) from public.biblical_textual_variants variant
                join public.biblical_verse_texts text on text.id=variant.verse_text_id
                where text.book_code='RUT' and text.chapter=3 and text.verse=12
                  and variant.reading_type='addition'
                  and variant.base_reading is null
                  and variant.variant_reading='אִם'
                  and variant.anchor_word_index is null
                  and variant.witnesses='["K"]'::jsonb
                """
            )
            assert cur.fetchone()[0] == 1
            cur.execute(
                "select count(*) from public.biblical_word_occurrences where book_code='RUT' and occurrence_gloss_es is not null"
            )
            assert cur.fetchone()[0] == 0
            cur.execute(
                "select count(*) from public.biblical_verse_texts where book_code='RUT' and literal_translation_es is not null"
            )
            assert cur.fetchone()[0] == 0

        with conn.transaction():
            with conn.cursor() as cur:
                call_import(cur, payload)
        with conn.cursor() as cur:
            rerun = counts(cur)
            assert rerun == committed

    print(
        json.dumps(
            {
                "active_migration": "passed",
                "invalid_qere_rejected": True,
                "rollback": "passed",
                "idempotency": "passed",
                "committed_counts": committed,
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
