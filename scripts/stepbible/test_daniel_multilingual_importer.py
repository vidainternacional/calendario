#!/usr/bin/env python3
"""Valida el candidato TAHOT v2 de Daniel en PostgreSQL sin producción."""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
from pathlib import Path

import psycopg

PACKAGE_SHA = "7ca58a1c4804c23ffd6803ccb30321147a5d7f80e7a0d6255c0796163b74c582"
PAYLOAD_SHA = "383c4bd74c83fd5d4f2dac7fdfae9401152be6cfc6aef195e3b677ef2fbe4691"
PAYLOAD_FILE_SHA = "398ef9f6d25c95f8f401d40689e5916da92d4d948bf6d3ecb343c0ced37861b4"
SOURCE_FILES = {
    "tahot-gen-deu": "e9b8546ee48fe0bfc57c3b70f5f40e98d96580e803526d19026224e31753368b",
    "tahot-isa-mal": "f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5",
    "tahot-job-sng": "84e118a97e5725e3847cdfdd593873513021c790c63cc91a0d41fca2b5db2ed5",
    "tahot-jos-est": "195fee1dc3653bab33701f170734eb894ed647c10cd08cc61749375fe8b73775",
}


def call_import(cur: psycopg.Cursor, payload: dict) -> dict:
    cur.execute(
        "select internal.import_stepbible_tahot_payload_v2(%s::jsonb,%s::jsonb)",
        (json.dumps(payload, ensure_ascii=False), json.dumps(SOURCE_FILES)),
    )
    return cur.fetchone()[0]


def counts(cur: psycopg.Cursor) -> dict[str, int]:
    cur.execute("select count(*) from public.biblical_verse_texts where book_code='DAN'")
    verses = cur.fetchone()[0]
    cur.execute("select count(*) from public.biblical_word_occurrences where book_code='DAN'")
    occurrences = cur.fetchone()[0]
    cur.execute("""
      select count(*) from public.biblical_textual_variants v
      join public.biblical_verse_texts t on t.id=v.verse_text_id where t.book_code='DAN'
    """)
    variants = cur.fetchone()[0]
    cur.execute("""
      select count(distinct (l.language,l.lexical_id))
      from public.biblical_word_occurrences o
      join public.biblical_lexical_entries l on l.id=o.lexical_entry_id
      where o.book_code='DAN'
    """)
    lexical = cur.fetchone()[0]
    return {"verse_segments": verses, "occurrences": occurrences, "variants": variants, "lexical_keys": lexical}


def assert_permissions(cur: psycopg.Cursor) -> None:
    cur.execute("""
      select grantee
      from information_schema.routine_privileges
      where specific_schema='internal'
        and routine_name='import_stepbible_tahot_payload_v2'
        and privilege_type='EXECUTE'
      order by grantee
    """)
    grants = [row[0] for row in cur.fetchall()]
    if grants != ['service_role']:
        raise AssertionError(f"Permisos inesperados: {grants}")


def assert_daniel_24(cur: psycopg.Cursor) -> None:
    cur.execute("""
      select language, metadata->>'segment_order', token_count
      from public.biblical_verse_texts
      where book_code='DAN' and chapter=2 and verse=4
      order by (metadata->>'segment_order')::int
    """)
    assert cur.fetchall() == [('hebrew','1',4),('aramaic','2',8)]
    cur.execute("""
      select l.language, count(*)
      from public.biblical_word_occurrences o
      join public.biblical_lexical_entries l on l.id=o.lexical_entry_id
      where o.book_code='DAN' and o.chapter=2 and o.verse=4
      group by l.language order by l.language
    """)
    assert cur.fetchall() == [('aramaic',14),('hebrew',8)]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--dsn', required=True)
    parser.add_argument('--fixture', type=Path, required=True)
    parser.add_argument('--candidate', type=Path, required=True)
    parser.add_argument('--recovery', type=Path, required=True)
    parser.add_argument('--payload', type=Path, required=True)
    args = parser.parse_args()

    raw = args.payload.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == PAYLOAD_FILE_SHA
    payload = json.loads(raw)
    assert payload['package_sha256'] == PACKAGE_SHA
    assert payload['payload_sha256'] == PAYLOAD_SHA
    assert payload['counts']['references'] == 357
    assert payload['counts']['verse_text_segments'] == 358
    assert payload['counts']['mixed_references'] == 1

    with psycopg.connect(args.dsn, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(args.fixture.read_text(encoding='utf-8'))
            cur.execute("update public.biblical_sources set license_status='verified' where slug='stepbible-lexical-pilot'")
            cur.execute("insert into public.biblical_books(code) values('DAN')")
            initial_lexical = cur.execute("select count(*) from public.biblical_lexical_entries").fetchone()[0]
            cur.execute(args.candidate.read_text(encoding='utf-8'))
            assert_permissions(cur)
            assert counts(cur) == {"verse_segments":0,"occurrences":0,"variants":0,"lexical_keys":0}

        malformed = copy.deepcopy(payload)
        target = next(v for v in malformed['verse_texts'] if v['chapter']==2 and v['verse']==4 and v['language']=='aramaic')
        target['segment_order'] = 1
        try:
            with conn.transaction():
                with conn.cursor() as cur:
                    call_import(cur, malformed)
        except psycopg.Error as error:
            if 'Límite hebreo/arameo inválido' not in str(error):
                raise
        else:
            raise AssertionError('El importador aceptó Daniel 2:4 adulterado')

        with conn.cursor() as cur:
            assert counts(cur) == {"verse_segments":0,"occurrences":0,"variants":0,"lexical_keys":0}

        class RollbackProbe(Exception): pass
        try:
            with conn.transaction():
                with conn.cursor() as cur:
                    result = call_import(cur, payload)
                    assert result['references'] == 357
                    assert result['verse_text_segments'] == 358
                    assert counts(cur) == {"verse_segments":358,"occurrences":9529,"variants":247,"lexical_keys":1244}
                    assert_daniel_24(cur)
                    raise RollbackProbe
        except RollbackProbe:
            pass

        with conn.cursor() as cur:
            assert counts(cur) == {"verse_segments":0,"occurrences":0,"variants":0,"lexical_keys":0}

        with conn.transaction():
            with conn.cursor() as cur:
                first = call_import(cur, payload)
        with conn.cursor() as cur:
            committed = counts(cur)
            assert committed == {"verse_segments":358,"occurrences":9529,"variants":247,"lexical_keys":1244}
            assert_daniel_24(cur)

        with conn.transaction():
            with conn.cursor() as cur:
                second = call_import(cur, payload)
        with conn.cursor() as cur:
            assert counts(cur) == committed
            assert first == second
            cur.execute(args.recovery.read_text(encoding='utf-8'))
            assert counts(cur) == {"verse_segments":0,"occurrences":0,"variants":0,"lexical_keys":0}
            assert cur.execute("select count(*) from public.biblical_lexical_entries").fetchone()[0] == initial_lexical
            assert cur.execute("select metadata->'tahot_packages' ? 'DAN' from public.biblical_sources where slug='stepbible-lexical-pilot'").fetchone()[0] is False

    print(json.dumps({
      "candidate": "passed",
      "invalid_mixed_boundary_rejected": True,
      "rollback": "passed",
      "idempotency": "passed",
      "recovery": "passed",
      "permissions": "service_role_only",
      "committed_counts": committed,
      "package_sha256": PACKAGE_SHA,
      "payload_file_sha256": PAYLOAD_FILE_SHA,
      "payload_sha256": PAYLOAD_SHA,
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
