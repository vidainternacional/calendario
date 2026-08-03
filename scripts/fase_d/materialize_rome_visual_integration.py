from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: se esperaba 1 coincidencia y se encontraron {count}')
    return text.replace(old, new, 1)


action_path = Path('app/actions/estudio-interno.ts')
action = action_path.read_text()
action = replace_once(
    action,
    "import {\n  getResolvedBiblicalTextualStudy,\n  type ResolvedBiblicalTextualStudyBundle,\n} from '@/lib/estudios/resolved-biblical-textual-study'\n",
    "import {\n  getResolvedBiblicalTextualStudy,\n  type ResolvedBiblicalTextualStudyBundle,\n} from '@/lib/estudios/resolved-biblical-textual-study'\nimport {\n  listarCronologiaBiblicaParaReferencia,\n  type PaqueteCronologicoBiblico,\n} from '@/lib/estudios/biblical-chronology-maps'\n",
    'importación de cronología',
)
action = replace_once(
    action,
    "      textualEvidence?: ResolvedBiblicalTextualStudyBundle\n    }",
    "      textualEvidence?: ResolvedBiblicalTextualStudyBundle\n      chronology?: PaqueteCronologicoBiblico\n    }",
    'tipo de estado',
)
action = replace_once(
    action,
    "  const textualEvidence = await getResolvedBiblicalTextualStudy(query, translationId)\n\n  const estudio = obtenerEstudioInterno(query)\n",
    "  const textualEvidence = await getResolvedBiblicalTextualStudy(query, translationId)\n  const contexto = await getInternalBiblicalContext(query)\n  const chronology = contexto\n    ? await listarCronologiaBiblicaParaReferencia({\n        bookCode: contexto.reference.book.code,\n        chapter: contexto.reference.chapter,\n        verse: contexto.reference.verse,\n      })\n    : undefined\n  const chronologyEvidence = chronology?.events.length ? chronology : undefined\n\n  const estudio = obtenerEstudioInterno(query)\n",
    'resolución de cronología',
)
action = action.replace(
    "      textualEvidence: textualEvidence ?? undefined,\n    }",
    "      textualEvidence: textualEvidence ?? undefined,\n      chronology: chronologyEvidence,\n    }",
)
if action.count('chronology: chronologyEvidence') != 2:
    raise SystemExit('se esperaban 2 retornos de estudio con cronología')
action = replace_once(
    action,
    "\n  const contexto = await getInternalBiblicalContext(query)\n  if (contexto?.status === 'covered') {",
    "\n  if (contexto?.status === 'covered') {",
    'eliminación de consulta duplicada',
)
action_path.write_text(action)

client_path = Path('components/estudios/EstudioProfundoClient.tsx')
client = client_path.read_text()
client = replace_once(
    client,
    "import TextualEvidencePanel from '@/components/estudios/TextualEvidencePanel'\n",
    "import TextualEvidencePanel from '@/components/estudios/TextualEvidencePanel'\nimport ChronologyMapPanel from '@/components/estudios/ChronologyMapPanel'\n",
    'importación del panel',
)
client = replace_once(
    client,
    "          {state.textualEvidence && <TextualEvidencePanel evidence={state.textualEvidence} />}\n\n          <div className=\"divide-y divide-slate-100\">",
    "          {state.textualEvidence && <TextualEvidencePanel evidence={state.textualEvidence} />}\n          {state.chronology && <ChronologyMapPanel bundle={state.chronology} />}\n\n          <div className=\"divide-y divide-slate-100\">",
    'render del panel',
)
client_path.write_text(client)
