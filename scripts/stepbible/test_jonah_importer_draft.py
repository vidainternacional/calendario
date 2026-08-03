#!/usr/bin/env python3
"""Valida fuera de producción el borrador del importador TAHOT de Jonás."""
from __future__ import annotations

import argparse
import copy
import gzip
import hashlib
import json
from pathlib import Path

import psycopg

from test_ruth_importer_draft import SOURCE_FILES, call_import, counts

BASE_FUNCTION_SHA256 = "69045240e658995cd0e1ba3557e54a2700b623078b36125e73ed1ada64f5139c"
PACKAGE_SHA256 = "083b869fe7d10493deaeee392babd9811e9dffb91f0db816d2f21a22b2135915"
PAYLOAD_FILE_SHA256 = "e6bd082a446d29becbafb35a22b94ef9e260e447fe7fc7cea4361d98c5bb835b"
PAYLOAD_SHA256 = "f986bdd833c86f9f239ddd26e4594aeb33d48a89f72fb05dcc853dbd1d512fc4"
EXPECTED_INITIAL = {
    "lexical": 2,
    "occurrences": 0,
    "verses": 0,
    "variants": 0,
    "batches": 0,
}
# H3068G y H9020 ya existen en el fixture y ambos son reutilizados por Jonás.
EXPECTED_COMMITTED = {
    "lexical": 288,
    "occurrences": 1080,
    "verses": 48,
    "variants": 0,
    "batches": 1,
}
EXPECTED_RESULT = {
    "references": 48,
    "visible_words": 688,
    "occurrences": 1080,
    "lexical_ids": 288,
    "source_variant_rows": 0,
    "variants": 0,
}


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


def assert_jonah_integrity(cur: psycopg.Cursor) -> None:
    cur.execute(
        """
        select count(*)
        from public.biblical_textual_variants variant
        join public.biblical_verse_texts text on text.id=variant.verse_text_id
        where text.book_code='JON'
        """
    )
    assert cur.fetchone()[0] == 0
    cur.execute(
        "select count(*) from public.biblical_word_occurrences where book_code='JON' and occurrence_gloss_es is not null"
    )
    assert cur.fetchone()[0] == 0
    cur.execute(
        "select count(*) from public.biblical_verse_texts where book_code='JON' and literal_translation_es is not null"
    )
    assert cur.fetchone()[0] == 0
    cur.execute(
        """
        select count(distinct display_word_index)
        from public.biblical_word_occurrences
        where book_code='JON'
        """
    )
    assert cur.fetchone()[0] == 688
    cur.execute(
        """
        select lexical_id,source_locator,display_gloss_es
        from public.biblical_lexical_entries
        where lexical_id in ('H3068G','H9020')
        order by lexical_id
        """
    )
    assert cur.fetchall() == [
        ("H3068G", "fixture:H3068G", "Yahvé"),
        ("H9020", "fixture:H9020", "mi"),
    ]
    cur.execute(
        """
        select count(*)
        from public.biblical_lexical_entries entry
        where entry.metadata->>'package_sha256'=%s
          and (entry.display_gloss_es is not null or entry.definition is not null)
        """,
        (PACKAGE_SHA256,),
    )
    assert cur.fetchone()[0] == 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dsn", required=True)
    parser.add_argument("--fixture", type=Path, required=True)
    parser.add_argument("--base-migration", type=Path, required=True)
    parser.add_argument("--ruth-migration", type=Path, required=True)
    parser.add_argument("--haggai-migration", type=Path, required=True)
    parser.add_argument("--nahum-migration", type=Path, required=True)
    parser.add_argument("--draft", type=Path, required=True)
    parser.add_argument("--package", type=Path, required=True)
    parser.add_argument("--payload", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    draft_text = args.draft.read_text(encoding="utf-8")
    lowered = draft_text.lower()
    if args.draft.parent.name != "migration-drafts":
        raise RuntimeError("El SQL debe permanecer en migration-drafts")
    if "-- borrador no activo" not in lowered:
        raise RuntimeError("El SQL no declara su estado de borrador")
    if "grant execute" in lowered and "to service_role" not in lowered:
        raise RuntimeError("El borrador concede ejecución fuera de service_role")

    package_raw = args.package.read_bytes()
    assert hashlib.sha256(package_raw).hexdigest() == PACKAGE_SHA256
    with gzip.open(args.package, "rt", encoding="utf-8") as handle:
        package = json.load(handle)
    payload_raw = args.payload.read_bytes()
    payload = json.loads(payload_raw.decode("utf-8"))
    assert hashlib.sha256(payload_raw).hexdigest() == PAYLOAD_FILE_SHA256
    assert payload["book"]["internal_code"] == package["book"]["internal_code"] == "JON"
    assert payload["package_sha256"] == PACKAGE_SHA256
    assert payload["payload_sha256"] == PAYLOAD_SHA256
    assert payload["variants"] == []

    with psycopg.connect(args.dsn, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(args.fixture.read_text(encoding="utf-8"))
            cur.execute("insert into public.biblical_books(code) values('RUT'),('HAG'),('NAM'),('JON')")
            cur.execute(args.base_migration.read_text(encoding="utf-8"))
            cur.execute(args.ruth_migration.read_text(encoding="utf-8"))
            cur.execute(args.haggai_migration.read_text(encoding="utf-8"))
            cur.execute(args.nahum_migration.read_text(encoding="utf-8"))
            assert function_sha(cur) == BASE_FUNCTION_SHA256
            cur.execute(draft_text)
            installed_function_sha = function_sha(cur)
            assert installed_function_sha != BASE_FUNCTION_SHA256
            assert_permissions(cur)
            cur.execute(
                "select strpos(pg_get_functiondef(%s::regprocedure),%s)>0",
                (
                    "internal.import_stepbible_tahot_payload(jsonb,jsonb)",
                    "Variantes inesperadas para Jonás",
                ),
            )
            assert cur.fetchone()[0] is True
            assert counts(cur) == EXPECTED_INITIAL

        malformed = copy.deepcopy(payload)
        malformed["payload_sha256"] = "0" * 64
        try:
            with conn.transaction():
                with conn.cursor() as cur:
                    call_import(cur, malformed)
        except psycopg.Error as error:
            if "Contrato TAHOT no autorizado" not in str(error):
                raise
        else:
            raise RuntimeError("El payload adulterado de Jonás no fue rechazado")
        with conn.cursor() as cur:
            assert counts(cur) == EXPECTED_INITIAL

        malformed_variants = copy.deepcopy(payload)
        malformed_variants["variants"].append(
            {
                "variant_key": "jon-invalid",
                "chapter": 1,
                "verse": 1,
                "anchor_word_index": 1,
                "reading_type": "orthographic",
                "base_reading": "x",
                "variant_reading": "y",
                "witnesses": ["X"],
                "content_hash": "0" * 64,
                "source_locator": "invalid",
                "source_line_sha256": "0" * 64,
            }
        )
        try:
            with conn.transaction():
                with conn.cursor() as cur:
                    call_import(cur, malformed_variants)
        except psycopg.Error:
            pass
        else:
            raise RuntimeError("El importador aceptó una variante artificial de Jonás")
        with conn.cursor() as cur:
            assert counts(cur) == EXPECTED_INITIAL

        try:
            with conn.transaction():
                with conn.cursor() as cur:
                    result = call_import(cur, payload)
                    assert {key: result[key] for key in EXPECTED_RESULT} == EXPECTED_RESULT
                    assert result["bad_hashes"] == 0
                    assert counts(cur) == EXPECTED_COMMITTED
                    assert_jonah_integrity(cur)
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
            assert_jonah_integrity(cur)

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

    result = {
        "draft_migration": "passed",
        "invalid_payload_rejected": True,
        "artificial_variant_rejected": True,
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
