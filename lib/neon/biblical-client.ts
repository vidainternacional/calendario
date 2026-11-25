import 'server-only'

import { createClient as createSessionClient } from '@/lib/supabase/server'
import { createServiceClient as createSupabaseServiceClient } from '@/lib/supabase/service'
import { compileRead, migratedTables, parseOr, targetsFor, type ReadSpec, type Target } from './editorial-query'

type SessionClient = Awaited<ReturnType<typeof createSessionClient>>
type ReadResult = { data: unknown; error: { message: string; code: string } | null; count: number | null }
type PageRow = { value: Record<string, unknown>; sort: unknown[] }
type PageResult = { data: PageRow[]; count: number | null }

function configured() { return process.env.VIDA_BIBLE_READ_BACKEND === 'neon' }

async function readNeon(target: Target, spec: ReadSpec): Promise<PageResult> {
  const uri = process.env[target === 'A' ? 'NEON_BIBLE_LEXICON_DATABASE_URL' : 'NEON_BIBLE_TEXTS_DATABASE_URL']
  if (!uri) throw new Error('Falta la conexión editorial del servidor')
  const hostname = new URL(uri).hostname
  if (!hostname.endsWith('.neon.tech')) throw new Error('Destino editorial inválido')
  const { query, params } = compileRead(spec, target)
  // Una transacción de solo lectura impide mutaciones incluso con una credencial privilegiada.
  const response = await fetch(`https://${hostname}/sql`, {
    // Solo contenido editorial aprobado; la autorización de cuenta se comprueba antes de cada lectura.
    method: 'POST', cache: 'force-cache', next: { revalidate: 300 }, signal: AbortSignal.timeout(25000),
    headers: {
      'Content-Type': 'application/json', 'Neon-Connection-String': uri,
      'Neon-Array-Mode': 'true', 'Neon-Raw-Text-Output': 'true',
      'Neon-Batch-Read-Only': 'true', 'Neon-Batch-Isolation-Level': 'ReadCommitted',
    },
    body: JSON.stringify({ queries: [{ query, params: params.map(v => v === null ? null : String(v)) }] }),
  })
  if (!response.ok) throw new Error('La biblioteca editorial no está disponible')
  const result = await response.json()
  const row = result.results?.[0]?.rows?.[0]
  if (!row) throw new Error('Respuesta editorial inválida')
  return { data: JSON.parse(row[0]), count: row[1] === null ? null : Number(row[1]) }
}

class EditorialRead implements PromiseLike<ReadResult> {
  private spec: ReadSpec
  private cardinality: 'many' | 'single' | 'maybe' = 'many'
  private execution?: Promise<ReadResult>
  constructor(table: string, private authorize: () => Promise<boolean>) {
    this.spec = { table, columns: '*', filters: [], orders: [], limit: 1000, offset: 0, count: false, head: false }
  }
  select(columns = '*', options: { count?: string; head?: boolean } = {}) {
    this.spec.columns = columns; this.spec.count = !!options.count; this.spec.head = !!options.head
    return this
  }
  private add(column: string, op: string, value: unknown) { this.spec.filters.push({ column, op, value }); return this }
  eq(column: string, value: unknown) { return this.add(column, 'eq', value) }
  neq(column: string, value: unknown) { return this.add(column, 'neq', value) }
  gt(column: string, value: unknown) { return this.add(column, 'gt', value) }
  gte(column: string, value: unknown) { return this.add(column, 'gte', value) }
  lt(column: string, value: unknown) { return this.add(column, 'lt', value) }
  lte(column: string, value: unknown) { return this.add(column, 'lte', value) }
  in(column: string, value: unknown[]) { return this.add(column, 'in', value) }
  is(column: string, value: unknown) { return this.add(column, 'is', value) }
  ilike(column: string, value: string) { return this.add(column, 'ilike', value) }
  like(column: string, value: string) { return this.add(column, 'like', value) }
  contains(column: string, value: unknown) { return this.add(column, 'contains', value) }
  not(column: string, op: string, value: unknown) { return this.add(column, 'not.' + op, value) }
  or(value: string) { this.spec.filters.push(parseOr(value)); return this }
  order(column: string, options: { ascending?: boolean; nullsFirst?: boolean } = {}) { this.spec.orders.push({ column, ...options }); return this }
  limit(value: number) { this.spec.limit = value; return this }
  range(from: number, to: number) { this.spec.offset = from; this.spec.limit = to - from + 1; return this }
  single() { this.cardinality = 'single'; return this }
  maybeSingle() { this.cardinality = 'maybe'; return this }
  then<TResult1 = ReadResult, TResult2 = never>(
    onfulfilled?: ((value: ReadResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    this.execution ??= this.execute()
    return this.execution.then(onfulfilled, onrejected)
  }
  private async execute(): Promise<ReadResult> {
    try {
      if (!await this.authorize()) return { data: null, error: { message: 'Se requiere una cuenta activa', code: '42501' }, count: null }
      const targets = targetsFor(this.spec)
      const distributed = targets.length > 1
      // Cada base devuelve el prefijo necesario; el corte global se aplica una sola vez.
      const request = distributed ? { ...this.spec, offset: 0, limit: this.spec.offset + this.spec.limit } : this.spec
      const pages = await Promise.all(targets.map(target => readNeon(target, request)))
      let rows = pages.flatMap(page => page.data)
      if (distributed) {
        rows.sort((a, b) => {
          for (let i = 0; i < this.spec.orders.length; i++) {
            const order = this.spec.orders[i], x = a.sort[i], y = b.sort[i]
            if (x === y) continue
            const nullsFirst = order.nullsFirst ?? order.ascending === false
            if (x === null || x === undefined) return nullsFirst ? -1 : 1
            if (y === null || y === undefined) return nullsFirst ? 1 : -1
            const comparison = x < y ? -1 : 1
            return order.ascending === false ? -comparison : comparison
          }
          return 0
        })
        rows = rows.slice(this.spec.offset, this.spec.offset + this.spec.limit)
      }
      const count = this.spec.count ? pages.reduce((sum, page) => sum + (page.count ?? 0), 0) : null
      const data = rows.map(row => row.value)
      if (this.spec.head) return { data: null, error: null, count }
      if (this.cardinality !== 'many') {
        if (data.length > 1 || (data.length === 0 && this.cardinality === 'single')) {
          return { data: null, error: { message: 'La consulta no devolvió una fila única', code: 'PGRST116' }, count }
        }
        return { data: data[0] ?? null, error: null, count }
      }
      return { data, error: null, count }
    } catch {
      // No incluir SQL, credenciales ni respuestas internas en errores de aplicación.
      return { data: null, error: { message: 'No se pudo consultar la biblioteca bíblica', code: 'BIBLE_READ_UNAVAILABLE' }, count: null }
    }
  }
}

function wrap<T extends SessionClient | ReturnType<typeof createSupabaseServiceClient>>(client: T, session: () => Promise<SessionClient>): T {
  if (!configured()) return client
  let authorization: Promise<boolean> | undefined
  const authorize = () => authorization ??= (async () => {
    const authClient = await session()
    const { data: { user }, error } = await authClient.auth.getUser()
    if (error || !user) return false
    const active = await authClient.rpc('cuenta_activa')
    return !active.error && active.data === true
  })()
  return new Proxy(client, {
    get(target, property, receiver) {
      if (property === 'from') return (table: string) => migratedTables.has(table)
        ? new EditorialRead(table, authorize)
        : (target as SessionClient).from(table as never)
      const value = Reflect.get(target, property, receiver)
      return typeof value === 'function' ? value.bind(target) : value
    },
  })
}

export async function createClient() {
  const client = await createSessionClient()
  return wrap(client, async () => client)
}

export function createServiceClient() {
  return wrap(createSupabaseServiceClient(), createSessionClient)
}
