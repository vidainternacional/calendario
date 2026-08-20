#!/usr/bin/env python3
"""Construye candidatos españoles para el léxico hebreo sin escribir en Supabase.

Principios:
- `source_gloss` inglés permanece como autoridad fuente y nunca se modifica.
- Una glosa española solo se marca `verified_derived` cuando existe evidencia
  léxica directa reproducible; contexto bíblico no se usa como significado.
- FreeDict se usa como fuente bilingüe exacta opcional.
- Apertium puede usarse como segunda señal/fallback, pero nunca convierte por sí
  solo una glosa en verificada.
- Los casos no demostrados permanecen `candidate` o `pending` para revisión.

Entrada JSONL esperada por fila:
{
  "id": "uuid",
  "lexical_id": "H0001",
  "strong_number": "H0001",
  "lemma": "אָב",
  "part_of_speech": "noun",
  "source_gloss": "father"
}

Salida JSONL compatible conceptualmente con `biblical_hebrew_spanish_glosses`.
Este script NO contiene credenciales, NO abre conexión a Supabase y NO ejecuta SQL.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import unicodedata
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from pathlib import Path
from typing import Iterable

GENERIC_TAGS = {
    "ACTION", "AGENT", "DESCRIPTOR", "PEOPLE", "THING", "PLACE",
    "PERSON", "OBJECT", "BODY", "TIME", "MANNER",
}


def normalize_text(value: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", value or "").strip().split())


def normalize_key(value: str) -> str:
    value = normalize_text(value).lower()
    value = unicodedata.normalize("NFD", value)
    value = "".join(ch for ch in value if unicodedata.category(ch) != "Mn")
    value = re.sub(r"[^a-z0-9' -]+", " ", value)
    return " ".join(value.split())


def clean_tahot_source_gloss(raw: str) -> str:
    """Extrae la etiqueta inglesa de aprendizaje sin inventar un sentido nuevo."""
    value = normalize_text(raw)
    if not value:
        return ""

    # TAHOT puede codificar `etiqueta»anotación/referencia`.
    if "»" in value:
        value = value.split("»", 1)[0].strip()

    # Algunas etiquetas de sentido empiezan por `:`.
    value = value.lstrip(":").strip()
    value = value.replace("_", " ")

    # Conserva texto dentro de paréntesis normales salvo marcadores técnicos.
    def drop_generic(match: re.Match[str]) -> str:
        token = match.group(1).strip().upper()
        return "" if token in GENERIC_TAGS else match.group(0)

    value = re.sub(r"\(([^()]*)\)", drop_generic, value)
    value = re.sub(r"\[([^\]]+)\]", r"\1", value)
    value = re.sub(r"\s*;\s*", "; ", value)
    return normalize_text(value)


def lookup_keys(english: str) -> list[str]:
    keys: list[str] = []
    base = normalize_key(english)
    if base:
        keys.append(base)
    if base.startswith("to ") and len(base) > 3:
        keys.append(base[3:])
    # Evita duplicados manteniendo el orden.
    return list(dict.fromkeys(keys))


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def load_freedict_tei(path: Path) -> dict[str, list[str]]:
    """Carga traducciones exactas EN→ES desde un TEI de FreeDict.

    No copia definiciones extensas: solo pares de lema/traducción cortos.
    """
    mapping: dict[str, set[str]] = defaultdict(set)
    current_entry: ET.Element | None = None

    for event, elem in ET.iterparse(path, events=("start", "end")):
        name = local_name(elem.tag)
        if event == "start" and name == "entry":
            current_entry = elem
            continue
        if event != "end" or name != "entry" or current_entry is None:
            continue

        orths: list[str] = []
        translations: list[str] = []
        for node in current_entry.iter():
            node_name = local_name(node.tag)
            text = normalize_text(node.text or "")
            if not text:
                continue
            if node_name == "orth":
                orths.append(text)
            elif node_name == "quote":
                # En eng-spa los `quote` dentro de citaciones de traducción
                # contienen equivalentes españoles. Se filtran textos largos.
                if len(text) <= 120:
                    translations.append(text)

        for orth in orths:
            key = normalize_key(orth)
            if not key:
                continue
            for translation in translations:
                if translation:
                    mapping[key].add(translation)

        current_entry.clear()
        current_entry = None

    return {key: sorted(values) for key, values in mapping.items()}


def run_apertium(english: str) -> str | None:
    if not shutil.which("apertium"):
        return None
    try:
        result = subprocess.run(
            ["apertium", "eng-spa"],
            input=english + "\n",
            text=True,
            capture_output=True,
            check=True,
            timeout=10,
        )
    except (subprocess.SubprocessError, OSError):
        return None
    value = normalize_text(result.stdout)
    return value or None


def load_overrides(path: Path | None) -> dict[str, dict[str, object]]:
    if path is None:
        return {}
    result: dict[str, dict[str, object]] = {}
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        row = json.loads(line)
        lexical_id = str(row.get("lexical_id") or "").strip()
        spanish = normalize_text(str(row.get("display_gloss_es") or ""))
        if not lexical_id or not spanish:
            raise ValueError(f"Override inválido en línea {line_number}")
        result[lexical_id] = row
    return result


def choose_candidate(
    row: dict[str, object],
    freedict: dict[str, list[str]],
    overrides: dict[str, dict[str, object]],
    use_apertium: bool,
) -> dict[str, object]:
    lexical_id = str(row.get("lexical_id") or "")
    source_gloss = normalize_text(str(row.get("source_gloss") or ""))
    english = clean_tahot_source_gloss(source_gloss)

    if lexical_id in overrides:
        override = overrides[lexical_id]
        return {
            "lexical_entry_id": row.get("id"),
            "lexical_id": lexical_id,
            "display_gloss_es": normalize_text(str(override["display_gloss_es"])),
            "alternative_glosses_es": override.get("alternative_glosses_es") or [],
            "confidence": int(override.get("confidence") or 100),
            "status": "manual_approved",
            "derivation_method": "manual_editorial_override_v1",
            "source_gloss_snapshot": source_gloss,
            "provenance": {
                "phase": "FASE_H_BLOQUE_3",
                "source": "manual_override",
                "english_label": english,
            },
        }

    matches: list[str] = []
    matched_key: str | None = None
    for key in lookup_keys(english):
        values = freedict.get(key) or []
        if values:
            matches = values
            matched_key = key
            break

    apertium_value = run_apertium(english) if use_apertium and english else None
    normalized_apertium = normalize_key(apertium_value or "")
    agreed = [value for value in matches if normalize_key(value) == normalized_apertium]

    if agreed:
        primary = agreed[0]
        alternatives = [value for value in matches if value != primary][:8]
        return {
            "lexical_entry_id": row.get("id"),
            "lexical_id": lexical_id,
            "display_gloss_es": primary,
            "alternative_glosses_es": alternatives,
            "confidence": 97,
            "status": "verified_derived",
            "derivation_method": "source_gloss_freedict_apertium_agreement_v1",
            "source_gloss_snapshot": source_gloss,
            "provenance": {
                "phase": "FASE_H_BLOQUE_3",
                "english_label": english,
                "freedict_key": matched_key,
                "freedict": "eng-spa 2025.11.23",
                "apertium_pair": "eng-spa",
                "context_used_as_meaning": False,
            },
        }

    if len(matches) == 1:
        return {
            "lexical_entry_id": row.get("id"),
            "lexical_id": lexical_id,
            "display_gloss_es": matches[0],
            "alternative_glosses_es": [],
            "confidence": 92,
            "status": "verified_derived",
            "derivation_method": "exact_source_gloss_freedict_unique_v1",
            "source_gloss_snapshot": source_gloss,
            "provenance": {
                "phase": "FASE_H_BLOQUE_3",
                "english_label": english,
                "freedict_key": matched_key,
                "freedict": "eng-spa 2025.11.23",
                "context_used_as_meaning": False,
            },
        }

    if matches:
        return {
            "lexical_entry_id": row.get("id"),
            "lexical_id": lexical_id,
            "display_gloss_es": matches[0],
            "alternative_glosses_es": matches[1:9],
            "confidence": 78,
            "status": "candidate",
            "derivation_method": "exact_source_gloss_freedict_ambiguous_v1",
            "source_gloss_snapshot": source_gloss,
            "provenance": {
                "phase": "FASE_H_BLOQUE_3",
                "english_label": english,
                "freedict_key": matched_key,
                "freedict": "eng-spa 2025.11.23",
                "context_used_as_meaning": False,
            },
        }

    if apertium_value:
        return {
            "lexical_entry_id": row.get("id"),
            "lexical_id": lexical_id,
            "display_gloss_es": apertium_value,
            "alternative_glosses_es": [],
            "confidence": 65,
            "status": "candidate",
            "derivation_method": "source_gloss_apertium_candidate_v1",
            "source_gloss_snapshot": source_gloss,
            "provenance": {
                "phase": "FASE_H_BLOQUE_3",
                "english_label": english,
                "apertium_pair": "eng-spa",
                "context_used_as_meaning": False,
            },
        }

    return {
        "lexical_entry_id": row.get("id"),
        "lexical_id": lexical_id,
        "display_gloss_es": None,
        "alternative_glosses_es": [],
        "confidence": 0,
        "status": "pending",
        "derivation_method": "unresolved_v1",
        "source_gloss_snapshot": source_gloss,
        "provenance": {
            "phase": "FASE_H_BLOQUE_3",
            "english_label": english,
            "context_used_as_meaning": False,
        },
    }


def read_jsonl(path: Path) -> Iterable[dict[str, object]]:
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        row = json.loads(line)
        if not row.get("id") or not row.get("lexical_id") or not row.get("source_gloss"):
            raise ValueError(f"Fila léxica incompleta en línea {line_number}")
        yield row


def self_test() -> None:
    cases = {
        "father": "father",
        "to perish": "to perish",
        ": chariot»chariot:1_chariot": "chariot",
        "Abagtha»Abagtha@Est.1.10": "Abagtha",
        ": [do](ACTION)»to make:4_[do](ACTION)": "do",
        ": [inheriting]son»son:7_[inheriting]son;_heir": "inheritingson",
    }
    for raw, expected in cases.items():
        actual = clean_tahot_source_gloss(raw)
        if actual != expected:
            raise AssertionError(f"{raw!r}: {actual!r} != {expected!r}")
    if lookup_keys("to perish") != ["to perish", "perish"]:
        raise AssertionError("lookup_keys no conserva forma verbal y lema")
    print("self-test OK")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lexicon-jsonl", type=Path)
    parser.add_argument("--freedict-tei", type=Path)
    parser.add_argument("--overrides-jsonl", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--audit", type=Path)
    parser.add_argument("--use-apertium", action="store_true")
    parser.add_argument("--require-complete", action="store_true")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return 0

    required = [args.lexicon_jsonl, args.freedict_tei, args.output, args.audit]
    if any(value is None for value in required):
        parser.error("Se requieren --lexicon-jsonl, --freedict-tei, --output y --audit")

    freedict = load_freedict_tei(args.freedict_tei)
    overrides = load_overrides(args.overrides_jsonl)
    results = [
        choose_candidate(row, freedict, overrides, args.use_apertium)
        for row in read_jsonl(args.lexicon_jsonl)
    ]

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        "".join(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n" for row in results),
        encoding="utf-8",
    )

    statuses = Counter(str(row["status"]) for row in results)
    methods = Counter(str(row["derivation_method"]) for row in results)
    audit = {
        "phase": "FASE_H_BLOQUE_3",
        "total": len(results),
        "statuses": dict(statuses),
        "methods": dict(methods),
        "verified_or_manual": statuses["verified_derived"] + statuses["manual_approved"],
        "pending_or_candidate": statuses["pending"] + statuses["candidate"],
        "closure_gate": {
            "expected_pending": 0,
            "expected_candidate": 0,
            "passes": statuses["pending"] == 0 and statuses["candidate"] == 0,
        },
    }
    args.audit.parent.mkdir(parents=True, exist_ok=True)
    args.audit.write_text(json.dumps(audit, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    print(json.dumps(audit, ensure_ascii=False, indent=2, sort_keys=True))
    if args.require_complete and not audit["closure_gate"]["passes"]:
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
