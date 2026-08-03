from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any

PACKAGE_PATH = Path("data/fase_d/rome_pilot/rome_pilot_v1.json")
HASH_RE = re.compile(r"^[0-9a-f]{64}$")


def canonical_hash(value: Any) -> str:
    payload = json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def assert_hash(record: dict[str, Any], field: str = "content_hash") -> None:
    expected = record.get(field)
    assert isinstance(expected, str) and HASH_RE.fullmatch(expected), (
        f"Hash inválido o ausente en {record.get('slug') or record.get('event_slug')}"
    )
    unsigned = dict(record)
    unsigned.pop(field)
    actual = canonical_hash(unsigned)
    assert actual == expected, (
        f"Hash no determinista en {record.get('slug') or record.get('event_slug')}: "
        f"esperado {expected}, obtenido {actual}"
    )


def main() -> None:
    package = json.loads(PACKAGE_PATH.read_text(encoding="utf-8"))

    assert package["schema_version"] == "1.0.0"
    assert package["package_key"] == "rome-pilot-v1"
    assert package["status"] == "candidate"
    assert package["enabled"] is False

    source = package["source_snapshot"]
    assert source["slug"] == "pleiades-gazetteer"
    assert source["source_type"] == "historical"
    assert source["provider"] == "Pleiades"
    assert source["provider_ref"] == "gazetteer"
    assert source["license_status"] == "verified"
    assert source["license_url"] == "https://creativecommons.org/licenses/by/3.0/"
    assert source["review_status"] == "approved"
    assert source["enabled"] is True
    assert "CC BY 3.0" in source["attribution"]
    assert_hash(source, "record_hash")

    fragments = package["context_fragments"]
    places = package["places"]
    periods = package["periods"]
    events = package["events"]
    relations = package["event_places"]

    assert len(fragments) == 2
    assert len(places) == 1
    assert len(periods) == 1
    assert len(events) == 2
    assert len(relations) == 2

    expected_fragments = {
        "roma-capital-romanos": "a2f4808cb82111e86f5b4c56f22cb6266d501fae422562992c2965e02bc4767c",
        "roma-capital-hechos-28": "fb892d134ef1edd6b4954d27e0c8495bc5ac5fdb808b79ddbc3ef3300ec98969",
    }
    fragment_slugs = {fragment["slug"] for fragment in fragments}
    assert fragment_slugs == set(expected_fragments)
    for fragment in fragments:
        assert fragment["content_hash"] == expected_fragments[fragment["slug"]]
        assert HASH_RE.fullmatch(fragment["content_hash"])
        assert fragment["source_locator"] == "https://pleiades.stoa.org/places/423025"

    source_slug = source["slug"]
    candidate_records = [*places, *periods, *events, *relations]
    for record in candidate_records:
        assert record["source_slug"] == source_slug
        assert record["review_status"] == "pending"
        assert record["enabled"] is False
        assert record["source_locator"] == "https://pleiades.stoa.org/places/423025"
        assert_hash(record)

    place = places[0]
    assert place["slug"] == "roma"
    assert place["external_provider"] == "Pleiades"
    assert place["external_ref"] == "423025"
    assert -90 <= place["latitude"] <= 90
    assert -180 <= place["longitude"] <= 180
    assert place["latitude"] == 41.889977
    assert place["longitude"] == 12.491258
    assert place["coordinate_precision"] == "approximate"
    assert place["certainty_level"] == "high"

    period = periods[0]
    assert period["slug"] == "roma-romanos-hechos-28"
    assert period["start_year"] is None and period["end_year"] is None
    assert period["era"] == "relative"
    assert period["date_precision"] == "relative"
    assert set(period["metadata"]["basis_fragments"]) == fragment_slugs

    place_slugs = {item["slug"] for item in places}
    period_slugs = {item["slug"] for item in periods}
    event_slugs = {item["slug"] for item in events}
    assert len(event_slugs) == len(events)

    expected_references = {
        "roma-destinatarios-romanos": ("ROM", 1, None, "ROM", 16, None),
        "pablo-llega-a-roma-hechos-28": ("ACT", 28, 14, "ACT", 28, 31),
    }
    for event in events:
        assert event["period_slug"] in period_slugs
        assert event["start_year"] is None and event["end_year"] is None
        assert event["era"] == "relative"
        assert event["date_precision"] == "relative"
        actual_reference = (
            event["start_book_code"],
            event["start_chapter"],
            event["start_verse"],
            event["end_book_code"],
            event["end_chapter"],
            event["end_verse"],
        )
        assert actual_reference == expected_references[event["slug"]]
        fragment_slug = event["metadata"]["context_fragment_slug"]
        assert fragment_slug in fragment_slugs
        assert event["metadata"]["context_fragment_hash"] == expected_fragments[fragment_slug]

    relation_keys: set[tuple[str, str, str]] = set()
    for relation in relations:
        assert relation["event_slug"] in event_slugs
        assert relation["place_slug"] in place_slugs
        assert relation["relation_type"] in {"associated", "destination"}
        assert relation["sequence_order"] == 0
        assert relation["metadata"]["context_fragment_slug"] in fragment_slugs
        key = (relation["event_slug"], relation["place_slug"], relation["relation_type"])
        assert key not in relation_keys
        relation_keys.add(key)

    expected_package_hash = package["package_hash"]
    assert HASH_RE.fullmatch(expected_package_hash)
    unsigned_package = dict(package)
    unsigned_package.pop("package_hash")
    assert canonical_hash(unsigned_package) == expected_package_hash

    print(
        "Paquete Roma válido: "
        f"{len(places)} lugar, {len(periods)} periodo, "
        f"{len(events)} eventos, {len(relations)} relaciones; "
        f"hash {expected_package_hash}."
    )


if __name__ == "__main__":
    main()
