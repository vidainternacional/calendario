#!/usr/bin/env python3
"""Valida el borrador generalizado de Rut en PostgreSQL efímero."""
from __future__ import annotations

import argparse
import copy
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
EXPECTED_TABLES = {
    "lexical": 373,
    "occurrences": 2026,
    "verses": 85,
    "variants": 29,
    "batches": 1,
}
EXPECTED_RESULT = {
    "references": 85,
    "visible_words": 1293,
    "occurrences": 2026,
    "lexical_ids": 373,
    "variants": 29,
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


def call_import(cur: psycopg.Cursor, payload: dict) -> dict:
    cur.execute(
        "select internal.import_stepbible_tahot_payload(%s::jsonb,%s::jsonb)",
        (json.dumps(payload, ensure_ascii=False), json.dumps(SOURCE_FILES)),
    )
    row = cur.fetchone()
    assert row is not None
    return row[0]


def assert_qere(cur: psycopg.Cursor) -> None:
    cur.execute(
        """
        select count(*)
        from public.biblical_textual_variants variant
        join public.biblical_verse_texts verse on verse.id=variant.verse_text_id
        where verse.book_code='RUT' and verse.chapter=3 and verse.verse=12
          and variant.reading_type='addition'
          and variant.base_reading is null
          and variant.variant_reading='אִם'
          and variant.anchor_word_index is null
          and variant.witnesses='["K"]'::jsonb
        """
    )
    assert cur.fetchone()[0] == 1
    cur.execute(
        """
        select count(*)
        from public.biblical_word_occurrences occurrence
        join public.biblical_textual_variants variant
          on variant.metadata->>'source_line_sha256'=occurrence.metadata->>'source_line_sha256'
        join public.biblical_verse_texts verse on verse.id=variant.verse_text_id
        where verse.book_code='RUT' and verse.chapter=3 and verse.verse=12
          and variant.reading_type='addition'
        """
    )
    assert cur.fetchone()[0] == 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dsn", required=True)
    parser.add_argument("--fixture", type=Path, required=True)
    parser.add_argument("--draft", type=Path, required=True)
    parser.add_argument("--package", type=Path, required=True)
    parser.add_argument("--payload", type=Path, required=True)
    args = parser.parse_args()

    with gzip.open(args.package, "rt", encoding="utf-8") as handle:
        package = json.load(handle)
    payload = json.loads(args.payload.read_text(encoding="utf-8"))
    manifest = json.loads((args.package.parent / "manifest.json").read_text(encoding="utf-8"))
    package_sha = manifest["artifact"]["sha256"]
    assert package_sha == "80a79abd038de9159a90e7aa572f1d4ff6a0c7f1ca8bfb4195875ffd5a7ca20c"
    assert payload["package_sha256"] == package_sha
    assert payload["payload_sha256"] == "d88763cef355dc05d3251438f3adce08a99feed389b82502e8c8f1263d7b79ee"
    assert payload["book"]["internal_code"] == package["book"]["internal_code"] == "RUT"

    draft_text = args.draft.read_text(encoding="utf-8")
    lowered = draft_text.lower()
    if "grant execute" in lowered and "to service_role" not in lowered:
        raise RuntimeError("El borrador concede ejecución fuera de service_role")
    if args.draft.parent.name != "migration-drafts":
        raise RuntimeError("El SQL debe permanecer en migration-drafts")
    if "-- borrador no activo" not in lowered:
        raise RuntimeError("El SQL no declara su estado de borrador")

    with psycopg.connect(args.dsn, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(args.fixture.read_text(encoding="utf-8"))
            cur.execute("insert into public.biblical_books(code) values('RUT')")
            cur.execute(draft_text)
            signature = "internal.import_stepbible_tahot_payload(jsonb,jsonb)"
            for role, expected in (("anon", False), ("authenticated", False), ("service_role", True)):
                cur.execute("select has_function_privilege(%s, %s, 'EXECUTE')", (role, signature))
                assert cur.fetchone()[0] is expected, role

        initial = {"lexical": 2, "occurrences": 0, "verses": 0, "variants": 0, "batches": 0}
        with conn.cursor() as cur:
            assert counts(cur) == initial

        malformed = copy.deepcopy(payload)
        qere = next(
            item for item in malformed["variants"]
            if item["chapter"] == 3 and item["verse"] == 12 and item["reading_type"] == "addition"
        )
        qere["variant_reading"] = "אִם־שגוי"
        try:
            with conn.transaction():
                with conn.cursor() as cur:
                    call_import(cur, malformed)
        except psycopg.Error as error:
            if "Omisión Qere inválida para Rut 3:12" not in str(error):
                raise
        else:
            raise RuntimeError("El importador aceptó una omisión Qere adulterada")
        with conn.cursor() as cur:
            assert counts(cur) == initial

        try:
            with conn.transaction():
                with conn.cursor() as cur:
                    result = call_import(cur, payload)
                    assert {key: result[key] for key in EXPECTED_RESULT} == EXPECTED_RESULT
                    assert counts(cur) == EXPECTED_TABLES
                    assert_qere(cur)
                    cur.execute("select count(*) from public.biblical_verse_texts where literal_translation_es is not null")
                    assert cur.fetchone()[0] == 0
                    cur.execute("select count(*) from public.biblical_word_occurrences where occurrence_gloss_es is not null")
                    assert cur.fetchone()[0] == 0
                    raise RollbackProbe
        except RollbackProbe:
            pass
        with conn.cursor() as cur:
            assert counts(cur) == initial

        with conn.transaction():
            with conn.cursor() as cur:
                first_result = call_import(cur, payload)
        with conn.cursor() as cur:
            committed = counts(cur)
            assert committed == EXPECTED_TABLES
            assert_qere(cur)

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
        "invalid_qere_rejected": True,
        "rollback": "passed",
        "idempotency": "passed",
        "committed_counts": committed,
        "package_sha256": package_sha,
        "payload_sha256": payload["payload_sha256"],
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
