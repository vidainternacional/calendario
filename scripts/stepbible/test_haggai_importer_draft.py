#!/usr/bin/env python3
"""Valida fuera de producción el borrador del importador TAHOT de Hageo."""
from __future__ import annotations

import argparse
import copy
import gzip
import json
from pathlib import Path

import psycopg

from test_ruth_importer_draft import SOURCE_FILES, call_import, counts

BASE_FUNCTION_SHA256 = "dad481d9de705efc566dfa1beaa68cba99b85de069f241733183e33c3b04b381"
EXPECTED_INITIAL = {
    "lexical": 2,
    "occurrences": 0,
    "verses": 0,
    "variants": 0,
    "batches": 0,
}
EXPECTED_COMMITTED = {
    "lexical": 235,
    "occurrences": 911,
    "verses": 38,
    "variants": 3,
    "batches": 1,
}
EXPECTED_RESULT = {
    "references": 38,
    "visible_words": 600,
    "occurrences": 911,
    "lexical_ids": 235,
    "source_variant_rows": 2,
    "variants": 3,
}
PACKAGE_SHA256 = "bc8e1caebce9a2e55d34b3be4770f3591e430b3aa217208324dee1bdbdd54e38"
PAYLOAD_SHA256 = "db6510d6e971e672c2fac244b406ffd1f704ac49d4fc3b3bbca3b1c5cde71fa9"
PAYLOAD_FILE_SHA256 = "c24d50fbbe01ecb47ec5a818c8a0f8cbdebae1451f2c9cd2b446234f02516ec6"


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


def assert_haggai_variants(cur: psycopg.Cursor) -> None:
    cur.execute(
        """
        select reading_type, base_reading, variant_reading, anchor_word_index, witnesses
        from public.biblical_textual_variants variant
        join public.biblical_verse_texts text on text.id=variant.verse_text_id
        where text.book_code='HAG' and text.chapter=1 and text.verse=8
        order by reading_type
        """
    )
    rows = cur.fetchall()
    assert rows == [
        ("orthographic", "וְאֶכָּבְדָ֖ה", "וְאֶכָּבְדָ֖", 9, ["L"]),
        ("substitution", "וְאֶכָּבְדָ֖ה", "וְאֶכָּבֵד", 9, ["K"]),
    ]
    cur.execute(
        """
        select reading_type, base_reading, variant_reading, anchor_word_index, witnesses
        from public.biblical_textual_variants variant
        join public.biblical_verse_texts text on text.id=variant.verse_text_id
        where text.book_code='HAG' and text.chapter=1 and text.verse=10
        """
    )
    assert cur.fetchone() == (
        "orthographic", "שָמַ֖יִם", "שָׁמַ֖יִם", 5, ["ABH"]
    )
    cur.execute(
        """
        select count(*) from public.biblical_textual_variants variant
        join public.biblical_verse_texts text on text.id=variant.verse_text_id
        where text.book_code='HAG'
          and variant.reading_type in ('addition','omission','transposition')
        """
    )
    assert cur.fetchone()[0] == 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dsn", required=True)
    parser.add_argument("--fixture", type=Path, required=True)
    parser.add_argument("--base-migration", type=Path, required=True)
    parser.add_argument("--ruth-migration", type=Path, required=True)
    parser.add_argument("--draft", type=Path, required=True)
    parser.add_argument("--package", type=Path, required=True)
    parser.add_argument("--payload", type=Path, required=True)
    args = parser.parse_args()

    draft_text = args.draft.read_text(encoding="utf-8")
    lowered = draft_text.lower()
    if args.draft.parent.name != "migration-drafts":
        raise RuntimeError("El SQL debe permanecer en migration-drafts")
    if "-- borrador no activo" not in lowered:
        raise RuntimeError("El SQL no declara su estado de borrador")
    if "grant execute" in lowered and "to service_role" not in lowered:
        raise RuntimeError("El borrador concede ejecución fuera de service_role")

    with gzip.open(args.package, "rt", encoding="utf-8") as handle:
        package = json.load(handle)
    raw_payload = args.payload.read_bytes()
    payload = json.loads(raw_payload.decode("utf-8"))
    import hashlib
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
            cur.execute(draft_text)
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
            raise RuntimeError("El payload adulterado de Hageo no fue rechazado")
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
            cur.execute(
                "select count(*) from public.biblical_word_occurrences where book_code='HAG' and occurrence_gloss_es is not null"
            )
            assert cur.fetchone()[0] == 0
            cur.execute(
                "select count(*) from public.biblical_verse_texts where book_code='HAG' and literal_translation_es is not null"
            )
            assert cur.fetchone()[0] == 0
            cur.execute(
                """
                select count(*) from public.biblical_textual_variants variant
                join public.biblical_verse_texts text on text.id=variant.verse_text_id
                where text.book_code='HAG' and variant.significance_es is not null
                """
            )
            assert cur.fetchone()[0] == 0
            cur.execute(
                """
                select count(*) from public.biblical_lexical_entries
                where metadata->>'package_sha256'=%s and display_gloss_es is not null
                """,
                (PACKAGE_SHA256,),
            )
            assert cur.fetchone()[0] == 0
            cur.execute(
                "select source_locator, display_gloss_es from public.biblical_lexical_entries where lexical_id='H9020'"
            )
            assert cur.fetchone() == ("fixture:H9020", "mi")

        with conn.transaction():
            with conn.cursor() as cur:
                second_result = call_import(cur, payload)
        with conn.cursor() as cur:
            assert counts(cur) == committed
            assert first_result == second_result
            cur.execute(
                "select metadata->'source_files' from public.biblical_sources where slug='stepbible-lexical-pilot'"
            )
            assert cur.fetchone()[0] == SOURCE_FILES

    print(json.dumps({
        "draft_migration": "passed",
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
