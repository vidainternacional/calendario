#!/usr/bin/env python3
"""Valida fuera de producción el borrador del importador TAHOT de Nahúm."""
from __future__ import annotations

import argparse
import copy
import gzip
import hashlib
import json
from pathlib import Path

import psycopg

from test_ruth_importer_draft import SOURCE_FILES, call_import, counts

BASE_FUNCTION_SHA256 = "619b0249f70e6ac373256da724a89033cb3ecb566ad26f2ac9709ee0b6f9977d"
PACKAGE_SHA256 = "60e280a6d94abc8788b7cc9647e4dfa0f679e0a9708a1adf00be30abfc23b7f5"
PAYLOAD_FILE_SHA256 = "0c041041155152e1fb63cb568efa1530724bea7fa729b4ed8815dcbaaf666000"
PAYLOAD_SHA256 = "43a5ab1b8c9cf773e218c73eab3def49715ac7c0511a04ee9cae3990be4a8a99"
EXPECTED_INITIAL = {
    "lexical": 2,
    "occurrences": 0,
    "verses": 0,
    "variants": 0,
    "batches": 0,
}
# H3068G ya existe en el fixture y se reutiliza; H9020 permanece como fila histórica.
EXPECTED_COMMITTED = {
    "lexical": 388,
    "occurrences": 828,
    "verses": 47,
    "variants": 8,
    "batches": 1,
}
EXPECTED_RESULT = {
    "references": 47,
    "visible_words": 558,
    "occurrences": 828,
    "lexical_ids": 387,
    "source_variant_rows": 4,
    "variants": 8,
}
EXPECTED_VARIANTS = [
    (1, 3, 4, "orthographic", "וּגְדָל", "וּגְדָול־", ["L"], "9efe642d1d9a24992c94a52e80dc35d259c3faf9453875f976c25b3c20055d64"),
    (1, 3, 4, "substitution", "וּגְדָל", "וּגְדוֹל", ["K"], "768331bda59484864f4825dddfe73fcd814831ca06887015954888c266218cf8"),
    (1, 15, 17, "orthographic", "לַֽעֲבָר", "לַֽעֲבָור־", ["L"], "dcec339d7811971e87221aaf0d5f572576deeaad3a398d1b885fbf4373efb762"),
    (1, 15, 17, "substitution", "לַֽעֲבָר", "לַעֲבוֹר", ["K"], "613a3dd58eb3ef5366b9c0e37b349381f4b78bc5941096612f407c76bb8b2540"),
    (2, 5, 4, "orthographic", "בַּהֲלִֽיכָתָ֑ם", "בַּהֲלִֽכָותָ֑ם", ["L"], "eb49717fc623dfafd078f9d67574542ae9a41af22529d2b3e769fb55e634367d"),
    (2, 5, 4, "substitution", "בַּהֲלִֽיכָתָ֑ם", "בַהֲלִכוֹתָם", ["K"], "c60f300822ead99fb756d1427105eb9c00813db850d24187a9ad0f9137e99c46"),
    (3, 3, 14, "orthographic", "וְכָשְׁל֖וּ", "יְכָשְׁל֖וּ", ["L"], "1b9369fc3a5e1d3b392f8dc14a0fb18fed6961aaf64efa8bb2d7c2c3e523d914"),
    (3, 3, 14, "substitution", "וְכָשְׁל֖וּ", "יִכְשְׁלוּ", ["K"], "b6b4657e955cd7c0097746d5dd2b0bd207772aa3fc7d5df37dcac4c5b0ac597c"),
]


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


def assert_nahum_variants(cur: psycopg.Cursor) -> None:
    cur.execute(
        """
        select text.chapter,text.verse,variant.anchor_word_index,
               variant.reading_type,variant.base_reading,variant.variant_reading,
               variant.witnesses,variant.content_hash
        from public.biblical_textual_variants variant
        join public.biblical_verse_texts text on text.id=variant.verse_text_id
        where text.book_code='NAM'
        order by text.chapter,text.verse,variant.reading_type
        """
    )
    assert cur.fetchall() == EXPECTED_VARIANTS
    cur.execute(
        """
        select count(*) from public.biblical_textual_variants variant
        join public.biblical_verse_texts text on text.id=variant.verse_text_id
        where text.book_code='NAM'
          and (variant.anchor_word_index is null
               or variant.reading_type in ('addition','omission','transposition'))
        """
    )
    assert cur.fetchone()[0] == 0


def assert_editorial_integrity(cur: psycopg.Cursor) -> None:
    cur.execute(
        "select count(*) from public.biblical_word_occurrences where book_code='NAM' and occurrence_gloss_es is not null"
    )
    assert cur.fetchone()[0] == 0
    cur.execute(
        "select count(*) from public.biblical_verse_texts where book_code='NAM' and literal_translation_es is not null"
    )
    assert cur.fetchone()[0] == 0
    cur.execute(
        """
        select count(*) from public.biblical_textual_variants variant
        join public.biblical_verse_texts text on text.id=variant.verse_text_id
        where text.book_code='NAM' and variant.significance_es is not null
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
        "select source_locator,display_gloss_es from public.biblical_lexical_entries where lexical_id='H3068G'"
    )
    assert cur.fetchone() == ("fixture:H3068G", "Yahvé")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dsn", required=True)
    parser.add_argument("--fixture", type=Path, required=True)
    parser.add_argument("--base-migration", type=Path, required=True)
    parser.add_argument("--ruth-migration", type=Path, required=True)
    parser.add_argument("--haggai-migration", type=Path, required=True)
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
    assert hashlib.sha256(raw_payload).hexdigest() == PAYLOAD_FILE_SHA256
    assert payload["book"]["internal_code"] == package["book"]["internal_code"] == "NAM"
    assert payload["package_sha256"] == PACKAGE_SHA256
    assert payload["payload_sha256"] == PAYLOAD_SHA256

    with psycopg.connect(args.dsn, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(args.fixture.read_text(encoding="utf-8"))
            cur.execute("insert into public.biblical_books(code) values('RUT'),('HAG'),('NAM')")
            cur.execute(args.base_migration.read_text(encoding="utf-8"))
            cur.execute(args.ruth_migration.read_text(encoding="utf-8"))
            cur.execute(args.haggai_migration.read_text(encoding="utf-8"))
            assert function_sha(cur) == BASE_FUNCTION_SHA256
            cur.execute(draft_text)
            assert_permissions(cur)
            cur.execute(
                "select strpos(pg_get_functiondef(%s::regprocedure),%s)>0",
                (
                    "internal.import_stepbible_tahot_payload(jsonb,jsonb)",
                    "Variantes inválidas para Nahúm",
                ),
            )
            assert cur.fetchone()[0] is True
            assert counts(cur) == EXPECTED_INITIAL

        malformed = copy.deepcopy(payload)
        target = next(
            item for item in malformed["variants"]
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
            raise RuntimeError("El payload adulterado de Nahúm no fue rechazado")
        with conn.cursor() as cur:
            assert counts(cur) == EXPECTED_INITIAL

        try:
            with conn.transaction():
                with conn.cursor() as cur:
                    result = call_import(cur, payload)
                    assert {key: result[key] for key in EXPECTED_RESULT} == EXPECTED_RESULT
                    assert counts(cur) == EXPECTED_COMMITTED
                    assert_nahum_variants(cur)
                    assert_editorial_integrity(cur)
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
            assert_nahum_variants(cur)
            assert_editorial_integrity(cur)

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
