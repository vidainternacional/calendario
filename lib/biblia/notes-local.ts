export type TipoNotaBiblica = 'versiculo' | 'estudio' | 'predicacion' | 'personal'

export type NotaBiblicaLocal = {
  id: string
  titulo: string
  contenido: string
  tipo: TipoNotaBiblica
  referencia: string
  paqueteId: string
  paquete: string
  creadaEn: string
  actualizadaEn: string
}

export const VIDA_BIBLE_NOTES_STORAGE_KEY = 'vida-biblia-notas-v2'

function ahoraIso() {
  return new Date().toISOString()
}

function normalizarNota(nota: Partial<NotaBiblicaLocal>): NotaBiblicaLocal {
  const ahora = ahoraIso()
  return {
    id: nota.id ?? crypto.randomUUID(),
    titulo: nota.titulo ?? 'Sin título',
    contenido: nota.contenido ?? '',
    tipo: nota.tipo ?? 'personal',
    referencia: nota.referencia ?? '',
    paqueteId: nota.paqueteId ?? '',
    paquete: nota.paquete ?? '',
    creadaEn: nota.creadaEn ?? ahora,
    actualizadaEn: nota.actualizadaEn ?? nota.creadaEn ?? ahora,
  }
}

export function leerNotasBiblicasLocales(): NotaBiblicaLocal[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(VIDA_BIBLE_NOTES_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((nota) => normalizarNota(nota as Partial<NotaBiblicaLocal>))
  } catch {
    return []
  }
}

export function guardarNotasBiblicasLocales(notas: NotaBiblicaLocal[]) {
  if (typeof window === 'undefined') return false
  try {
    localStorage.setItem(VIDA_BIBLE_NOTES_STORAGE_KEY, JSON.stringify(notas))
    return true
  } catch {
    return false
  }
}

export function crearNotaBiblicaLocal(cambios: Partial<NotaBiblicaLocal> = {}): NotaBiblicaLocal {
  const ahora = ahoraIso()
  return normalizarNota({
    id: crypto.randomUUID(),
    titulo: 'Nueva nota',
    contenido: '',
    tipo: 'personal',
    referencia: '',
    paqueteId: '',
    paquete: '',
    creadaEn: ahora,
    actualizadaEn: ahora,
    ...cambios,
  })
}

export function agregarNotaBiblicaLocal(cambios: Partial<NotaBiblicaLocal>): NotaBiblicaLocal {
  const nota = crearNotaBiblicaLocal(cambios)
  const actuales = leerNotasBiblicasLocales().filter((item) => item.id !== nota.id)
  guardarNotasBiblicasLocales([nota, ...actuales])
  return nota
}
