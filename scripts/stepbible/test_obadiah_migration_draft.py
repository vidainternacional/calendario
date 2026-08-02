#!/usr/bin/env python3
"""Prueba sintaxis, rollback e idempotencia del borrador TAHOT en PostgreSQL efímero."""
from __future__ import annotations

import argparse
import gzip
import json
from pathlib import Path

import psycopg


class RollbackProbe(Exception):
    pass


SOURCE_FILES = {
    "tahot-gen-deu": "e9b8546ee48fe0bfc57c3b70f5f40e98d96580e803526d19026224e31753368b",
    "tahot-jos-est": "195fee1dc3653bab33701f170734eb894ed647c10cd08cc61749375fe8b73775",
    "tahot-job-sng": "84e118a97e5725e3847cdfdd593873513021c790c63cc91a0d41fca2b5db2ed5",
    "tahot-isa-mal": "f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5",
}
EXPECTED = {
    "references": 21,
    "visible_words": 291,
    "occurrences": 434,
    "lexical_ids": 184,
    "variant_rows": 2,
    "variants": 3,
}


def counts(cur: psycopg.Cursor) -> dict[str, int]:
    cur.execute(
        """
        select
          (select count(*) from public.biblical_lexical_entries) as lexical,
          (select count(*) from public.biblical_word_occurrences) as occurrences,
          (select count(*) from public.biblical_verse_texts) as verses,
          (select count(*) from public.biblical_textual_variants) as variants,
          (select count(*) from internal.biblical_textual_import_batches) as batches
        """
    )
    row = cur.fetchone()
    assert row is not None
    return dict(zip(("lexical", "occurrences", "verses", "variants", "batches"), row, strict=True))


def call_import(cur: psycopg.Cursor, package: dict, package_sha: str, policy: dict) -> dict:
    cur.execute(
        """
        select internal.import_stepbible_tahot_package(
          %s::jsonb,%s,%s::jsonb,%s::jsonb,%s,%s,%s,%s,%s,%s
        )
        """,
        (
            json.dumps(package, ensure_ascii=False),
            package_sha,
            json.dumps(policy, ensure_ascii=False),
            json.dumps(SOURCE_FILES),
            EXPECTED["references"],
            EXPECTED["visible_words"],
            EXPECTED["occurrences"],
            EXPECTED["lexical_ids"],
            EXPECTED["variant_rows"],
            EXPECTED["variants"],
        ),
    )
    row = cur.fetchone()
    assert row is not None
    return row[0]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dsn", required=True)
    parser.add_argument("--fixture", type=Path, required=True)
    parser.add_argument("--draft", type=Path, required=True)
    parser.add_argument("--package", type=Path, required=True)
    parser.add_argument("--policy", type=Path, required=True)
    args = parser.parse_args()

    with gzip.open(args.package, "rt", encoding="utf-8") as handle:
        package = json.load(handle)
    policy = json.loads(args.policy.read_text(encoding="utf-8"))
    manifest = json.loads((args.package.parent / "manifest.json").read_text(encoding="utf-8"))
    package_sha = manifest["artifact"]["sha256"]

    draft_text = args.draft.read_text(encoding="utf-8")
    lowered = draft_text.lower()
    if "grant execute" in lowered and "to service_role" not in lowered:
        raise RuntimeError("El borrador concede ejecución fuera de service_role")
    if "supabase/migrations" in lowered:
        raise RuntimeError("El borrador no debe declararse como migración activa")

    with psycopg.connect(args.dsn, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(args.fixture.read_text(encoding="utf-8"))
            cur.execute(draft_text)
            signature = (
                "internal.import_stepbible_tahot_package"
                "(jsonb,text,jsonb,jsonb,integer,integer,integer,integer,integer,integer)"
            )
            cur.execute("select has_function_privilege('anon', %s, 'EXECUTE')", (signature,))
            if cur.fetchone()[0]:
                raise RuntimeError("anon conserva EXECUTE")
            cur.execute("select has_function_privilege('authenticated', %s, 'EXECUTE')", (signature,))
            if cur.fetchone()[0]:
                raise RuntimeError("authenticated conserva EXECUTE")

        before: dict[str, int]
        try:
            with conn.transaction():
                with conn.cursor() as cur:
                    before = counts(cur)
                    result = call_import(cur, package, package_sha, policy)
                    inside = counts(cur)
                    assert result["references"] == EXPECTED["references"]
                    assert inside == {
                        "lexical": 184,
                        "occurrences": 434,
                        "verses": 21,
                        "variants": 3,
                        "batches": 1,
                    }, inside
                    cur.execute(
                        "select count(*) from public.biblical_verse_texts where literal_translation_es is not null"
                    )
                    assert cur.fetchone()[0] == 0
                    cur.execute(
                        "select count(*) from public.biblical_word_occurrences where occurrence_gloss_es is not null"
                    )
                    assert cur.fetchone()[0] == 0
                    cur.execute(
                        "select lemma from public.biblical_lexical_entries where lexical_id='H9020'"
                    )
                    assert cur.fetchone()[0] == "־י"
                    raise RollbackProbe
        except RollbackProbe:
            pass

        with conn.cursor() as cur:
            after_rollback = counts(cur)
            assert after_rollback == before == {
                "lexical": 2,
                "occurrences": 0,
                "verses": 0,
                "variants": 0,
                "batches": 0,
            }, (before, after_rollback)

        with conn.transaction():
            with conn.cursor() as cur:
                call_import(cur, package, package_sha, policy)
        with conn.cursor() as cur:
            committed = counts(cur)
            assert committed == {
                "lexical": 184,
                "occurrences": 434,
                "verses": 21,
                "variants": 3,
                "batches": 1,
            }, committed

        with conn.transaction():
            with conn.cursor() as cur:
                call_import(cur, package, package_sha, policy)
        with conn.cursor() as cur:
            rerun = counts(cur)
            assert rerun == committed, (committed, rerun)
            cur.execute(
                "select metadata->'source_files' from public.biblical_sources where slug='stepbible-lexical-pilot'"
            )
            assert cur.fetchone()[0] == SOURCE_FILES

    print(json.dumps({
        "rollback": "passed",
        "idempotency": "passed",
        "committed_counts": committed,
        "package_sha256": package_sha,
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
