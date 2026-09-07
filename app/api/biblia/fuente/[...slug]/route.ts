import { NextResponse } from 'next/server'

const HELLO_API = 'https://bible.helloao.org/api'
const API_BIBLE = 'https://rest.api.bible/v1'
const RESOLVER_CACHE_MS = 10 * 60 * 1000

const bibleIdCache = new Map<string, { id: string | null; expiresAt: number }>()

function textoVersion(item: any) {
  return [
    item?.name,
    item?.nameLocal,
    item?.abbreviation,
    item?.abbreviationLocal,
  ].filter(Boolean).join(' ')
}

function esNvi(item: any) {
  return /\bnvi\b|nueva\s+versi[oó]n\s+internacional/i.test(textoVersion(item))
}

function esRvr1960(item: any) {
  return /\brvr?\s*1960\b|reina[- ]?valera.*1960|reina\s+valera.*1960/i.test(textoVersion(item))
}

async function apiBible(path: string) {
  const key = process.env.API_BIBLE_KEY
  if (!key) throw new Error('API_BIBLE_KEY no configurada')
  return fetch(`${API_BIBLE}${path}`, {
    headers: { 'api-key': key, accept: 'application/json' },
    cache: 'no-store',
  })
}

async function biblesAutorizadas() {
  const response = await apiBible('/bibles?language=spa')
  if (!response.ok) throw new Error(`API.Bible ${response.status}`)
  const payload = await response.json()
  return Array.isArray(payload?.data) ? payload.data : []
}

function idVirtual(item: any) {
  if (esNvi(item)) return 'api-nvi'
  if (esRvr1960(item)) return 'api-rvr1960'
  return `api-${String(item.id)}`
}

async function medirCobertura(bibleId: string) {
  try {
    const response = await apiBible(`/bibles/${encodeURIComponent(bibleId)}/books?include-chapters=true`)
    if (!response.ok) return { books: 0, chapters: 0 }
    const payload = await response.json()
    const books = Array.isArray(payload?.data) ? payload.data : []
    const chapters = books.reduce((total: number, book: any) => {
      const lista = Array.isArray(book?.chapters) ? book.chapters : []
      return total + lista.filter((chapter: any) => /^\d+$/.test(String(chapter?.number || ''))).length
    }, 0)
    return { books: books.length, chapters }
  } catch {
    return { books: 0, chapters: 0 }
  }
}

async function mejorBibleId(items: any[], cacheKey: string) {
  const cached = bibleIdCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.id
  if (!items.length) {
    bibleIdCache.set(cacheKey, { id: null, expiresAt: Date.now() + RESOLVER_CACHE_MS })
    return null
  }
  if (items.length === 1) {
    const id = String(items[0].id)
    bibleIdCache.set(cacheKey, { id, expiresAt: Date.now() + RESOLVER_CACHE_MS })
    return id
  }

  const evaluadas = await Promise.all(items.map(async (item: any) => ({
    id: String(item.id),
    ...(await medirCobertura(String(item.id))),
  })))
  evaluadas.sort((a, b) => (b.books - a.books) || (b.chapters - a.chapters))
  const id = evaluadas[0]?.id || String(items[0].id)
  bibleIdCache.set(cacheKey, { id, expiresAt: Date.now() + RESOLVER_CACHE_MS })
  return id
}

async function resolverBibleId(virtualId: string) {
  const bibles = await biblesAutorizadas()
  if (virtualId === 'api-nvi') return mejorBibleId(bibles.filter(esNvi), 'nvi')
  if (virtualId === 'api-rvr1960') return mejorBibleId(bibles.filter(esRvr1960), 'rvr1960')
  if (virtualId.startsWith('api-')) {
    const candidate = virtualId.slice(4)
    return bibles.some((item: any) => String(item.id) === candidate) ? candidate : null
  }
  return null
}

function ordenarApiBible(a: any, b: any) {
  const prioridad = (item: any) => esNvi(item) ? 0 : esRvr1960(item) ? 1 : 2
  const delta = prioridad(a) - prioridad(b)
  if (delta) return delta
  return String(a?.nameLocal || a?.name || '').localeCompare(String(b?.nameLocal || b?.name || ''), 'es', { sensitivity: 'base' })
}

function normalizarTraduccionesApiBible(items: any[]) {
  const vistos = new Set<string>()
  return [...items].sort(ordenarApiBible).flatMap((item: any) => {
    const id = idVirtual(item)
    if (vistos.has(id)) return []
    vistos.add(id)
    return [{
      id,
      name: String(item.nameLocal || item.name || item.abbreviationLocal || item.abbreviation || 'Biblia'),
      language: String(item.language?.id || 'spa'),
      shortName: String(item.abbreviationLocal || item.abbreviation || '').replace(/^spa/i, '') || undefined,
    }]
  })
}

function unirTexto(anterior: string, fragmento: string) {
  const limpio = fragmento.replace(/\s+/g, ' ').trim()
  if (!limpio) return anterior
  return `${anterior ? `${anterior} ` : ''}${limpio}`
    .replace(/\s+([,.;:!?…%)\]}])/g, '$1')
    .replace(/([¿¡([{])\s+/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

function extraerVersos(content: unknown, chapterId: string) {
  const porNumero = new Map<number, string>()

  const caminar = (node: any, numeroActual?: number) => {
    if (Array.isArray(node)) {
      let actual = numeroActual
      for (const item of node) {
        const verseId = item?.attrs?.verseId || item?.attrs?.verseOrgId
        if (verseId) {
          const ultimo = String(verseId).replace(`${chapterId}.`, '').match(/\d+/)?.[0]
          if (ultimo) actual = Number(ultimo)
        }
        caminar(item, actual)
      }
      return
    }
    if (!node || typeof node !== 'object') return

    let actual = numeroActual
    const verseId = node?.attrs?.verseId || node?.attrs?.verseOrgId
    if (verseId) {
      const ultimo = String(verseId).replace(`${chapterId}.`, '').match(/\d+/)?.[0]
      if (ultimo) actual = Number(ultimo)
    }

    if (actual && typeof node.text === 'string') {
      const siguiente = unirTexto(porNumero.get(actual) || '', node.text)
      if (siguiente) porNumero.set(actual, siguiente)
    }

    if (node.items) caminar(node.items, actual)
    if (node.content) caminar(node.content, actual)
  }

  caminar(content)

  return [...porNumero.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([number, text]) => ({ type: 'verse', number, content: [{ text }] }))
}

async function responderTraducciones() {
  const helloPromise = fetch(`${HELLO_API}/available_translations.json`, { cache: 'no-store' })
    .then(async (response) => response.ok ? response.json() : { translations: [] })
    .catch(() => ({ translations: [] }))

  const apiPromise = biblesAutorizadas().catch(() => [])
  const [hello, api] = await Promise.all([helloPromise, apiPromise])

  const apiTranslations = normalizarTraduccionesApiBible(api)
  const helloTranslations = Array.isArray(hello?.translations) ? hello.translations : []
  const vistos = new Set<string>()
  const merged = [...apiTranslations, ...helloTranslations].filter((item: any) => {
    const key = `${String(item.shortName || '').toLowerCase()}|${String(item.name || '').toLowerCase()}`
    if (vistos.has(key)) return false
    vistos.add(key)
    return true
  })

  return NextResponse.json({ translations: merged })
}

async function responderLibros(virtualId: string) {
  const bibleId = await resolverBibleId(virtualId)
  if (!bibleId) return NextResponse.json({ error: 'Versión no autorizada' }, { status: 404 })

  const response = await apiBible(`/bibles/${encodeURIComponent(bibleId)}/books?include-chapters=true`)
  if (!response.ok) return NextResponse.json({ error: 'No se pudieron cargar los libros' }, { status: response.status })
  const payload = await response.json()
  const books = (Array.isArray(payload?.data) ? payload.data : []).map((book: any) => ({
    id: String(book.id),
    name: String(book.name || book.nameLong || book.abbreviation || book.id),
    numberOfChapters: (Array.isArray(book.chapters) ? book.chapters : []).filter((chapter: any) => /^\d+$/.test(String(chapter?.number || ''))).length,
  }))
  return NextResponse.json({ books })
}

async function responderCapitulo(virtualId: string, bookId: string, chapter: string) {
  const bibleId = await resolverBibleId(virtualId)
  if (!bibleId) return NextResponse.json({ error: 'Versión no autorizada' }, { status: 404 })

  const chapterId = `${bookId}.${chapter}`
  const query = new URLSearchParams({
    'content-type': 'json',
    'include-notes': 'false',
    'include-titles': 'false',
    'include-chapter-numbers': 'false',
    'include-verse-numbers': 'false',
    'include-verse-spans': 'true',
    'fums-version': '3',
  })
  const response = await apiBible(`/bibles/${encodeURIComponent(bibleId)}/chapters/${encodeURIComponent(chapterId)}?${query}`)
  if (!response.ok) return NextResponse.json({ error: 'No se pudo cargar el capítulo' }, { status: response.status })
  const payload = await response.json()
  const data = payload?.data || {}

  return NextResponse.json({
    chapter: { content: extraerVersos(data.content, chapterId) },
    meta: {
      source: 'api.bible',
      fumsToken: payload?.meta?.fumsToken || null,
      copyright: data.copyright || null,
    },
  })
}

async function proxyHello(slug: string[]) {
  const response = await fetch(`${HELLO_API}/${slug.map(encodeURIComponent).join('/')}`, { cache: 'no-store' })
  const body = await response.text()
  return new Response(body, {
    status: response.status,
    headers: { 'content-type': response.headers.get('content-type') || 'application/json; charset=utf-8' },
  })
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  if (!slug?.length) return NextResponse.json({ error: 'Ruta inválida' }, { status: 404 })

  if (slug.length === 1 && slug[0] === 'available_translations.json') return responderTraducciones()

  const virtualId = slug[0]
  if (virtualId.startsWith('api-')) {
    if (slug.length === 2 && slug[1] === 'books.json') return responderLibros(virtualId)
    if (slug.length === 3 && slug[2].endsWith('.json')) {
      return responderCapitulo(virtualId, slug[1], slug[2].replace(/\.json$/, ''))
    }
    return NextResponse.json({ error: 'Ruta API.Bible inválida' }, { status: 404 })
  }

  return proxyHello(slug)
}
