import { editorialPolicies } from './editorial-policies'

export type Target = 'A' | 'B'
export type Filter = { column: string; op: string; value: unknown } | { logic: 'and' | 'or'; filters: Filter[] }
export type Ordering = { column: string; ascending?: boolean; nullsFirst?: boolean }
export type ReadSpec = { table: string; columns: string; filters: Filter[]; orders: Ordering[]; limit: number; offset: number; count: boolean; head: boolean }
export const OT_BOOKS = ['GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI','1CH','2CH','EZR','NEH','EST','JOB','PSA','PRO','ECC','SNG','ISA','JER','LAM','EZK','DAN','HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL']
export const NT_BOOKS = ['MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE','1JN','2JN','3JN','JUD','REV']
// El índice derivado sigue junto a sus escrituras existentes en Supabase.
export const migratedTables = new Set(Object.keys(editorialPolicies).filter(t => t !== 'biblical_hebrew_search_resolutions'))
const lexicalTables = new Set(['biblical_lexical_entries', 'biblical_hebrew_spanish_glosses'])

function identifier(value: string) {
  if (!/^[a-z_][a-z0-9_]*$/i.test(value)) throw new Error('Identificador editorial inválido')
  return `"${value}"`
}

export function splitList(value: string): string[] {
  const result: string[] = []
  let depth = 0, quoted = false, start = 0
  for (let i = 0; i < value.length; i++) {
    if (value[i] === '"' && value[i - 1] !== '\\') quoted = !quoted
    if (quoted) continue
    if (value[i] === '(') depth++
    if (value[i] === ')') depth--
    if (depth < 0) throw new Error('Expresión editorial inválida')
    if (value[i] === ',' && depth === 0) { result.push(value.slice(start, i).trim()); start = i + 1 }
  }
  if (depth || quoted) throw new Error('Expresión editorial incompleta')
  if (value.slice(start).trim()) result.push(value.slice(start).trim())
  return result
}

export function parseOr(value: string): Filter {
  const atom = (text: string): Filter => {
    const group = /^(and|or)\(([\s\S]*)\)$/.exec(text)
    if (group) return { logic: group[1] as 'and' | 'or', filters: splitList(group[2]).map(atom) }
    const match = /^([a-z_][a-z0-9_]*)(?:\.(not))?\.(eq|neq|gt|gte|lt|lte|ilike|like|is|in)\.([\s\S]*)$/i.exec(text)
    if (!match) throw new Error('Filtro editorial no admitido')
    let item: unknown = match[4]
    if (match[3] === 'in') {
      if (!/^\([\s\S]*\)$/.test(match[4])) throw new Error('Lista editorial inválida')
      item = splitList(match[4].slice(1, -1)).map(v => v.replace(/^"|"$/g, ''))
    } else if (match[3] === 'is') item = match[4] === 'null' ? null : match[4] === 'true'
    return { column: match[1], op: (match[2] ? 'not.' : '') + match[3], value: item }
  }
  return { logic: 'or', filters: splitList(value).map(atom) }
}

export function targetsFor(spec: ReadSpec): Target[] {
  if (!migratedTables.has(spec.table)) throw new Error('Tabla fuera de la biblioteca editorial')
  if (spec.table !== 'biblical_word_occurrences') return [lexicalTables.has(spec.table) ? 'A' : 'B']
  // Un filtro directo de libro permite evitar una consulta al otro testamento.
  const book = spec.filters.find(f => 'column' in f && f.column === 'book_code' && (f.op === 'eq' || f.op === 'in'))
  if (book && 'column' in book) {
    const codes = book.op === 'eq' ? [String(book.value)] : book.value as string[]
    return [...(codes.some(c => OT_BOOKS.includes(c)) ? ['A' as const] : []), ...(codes.some(c => NT_BOOKS.includes(c)) ? ['B' as const] : [])]
  }
  return ['A', 'B']
}

export function compileRead(spec: ReadSpec, target: Target) {
  if (!migratedTables.has(spec.table)) throw new Error('Tabla editorial no admitida')
  if (![spec.limit, spec.offset].every(Number.isSafeInteger) || spec.limit < 0 || spec.limit > 10000 || spec.offset < 0) throw new Error('Paginación inválida')
  const params: unknown[] = []
  const param = (value: unknown) => { params.push(value); return `$${params.length}` }
  const tables = new Set<string>()
  const include = (table: string) => {
    if (tables.has(table)) return
    const policy = editorialPolicies[table]
    if (!policy) throw new Error('Relación editorial no admitida')
    for (const match of policy.matchAll(/FROM (biblical_[a-z_]+)/g)) include(match[1])
    tables.add(table)
  }
  include(spec.table)
  const field = (column: string, alias = 't') => `${identifier(alias)}.${identifier(column)}`
  const filter = (f: Filter): string => {
    if ('logic' in f) return f.filters.length ? `(${f.filters.map(filter).join(f.logic === 'or' ? ' OR ' : ' AND ')})` : 'FALSE'
    const col = field(f.column), negative = f.op.startsWith('not.'), op = f.op.replace(/^not\./, '')
    const operators: Record<string, string> = { eq: '=', neq: '<>', gt: '>', gte: '>=', lt: '<', lte: '<=', ilike: 'ILIKE', like: 'LIKE' }
    let expression: string
    if (op === 'is' || ((op === 'eq' || op === 'neq') && f.value === null)) {
      if (![null, true, false].includes(f.value as null | boolean)) throw new Error('Valor IS inválido')
      expression = `${col} IS ${op === 'neq' ? 'NOT ' : ''}${f.value === null ? 'NULL' : f.value ? 'TRUE' : 'FALSE'}`
    } else if (op === 'in') {
      if (!Array.isArray(f.value)) throw new Error('Lista inválida')
      expression = f.value.length ? `${col} IN (${f.value.map(param).join(',')})` : 'FALSE'
    } else if (op === 'contains') expression = Array.isArray(f.value)
      ? `${col} @> ARRAY[${f.value.map(param).join(',')}]::text[]`
      : `${col} @> ${param(JSON.stringify(f.value))}::jsonb`
    else if (operators[op]) expression = `${col} ${operators[op]} ${param(f.value)}`
    else throw new Error('Operador editorial no admitido')
    return negative ? `NOT (${expression})` : expression
  }
  const projection = (columns: string, table: string, alias: string): string => {
    const pairs: string[] = [], pieces: string[] = []
    for (const token of splitList(columns)) {
      if (token === '*') { pieces.push(`to_jsonb(${identifier(alias)})`); continue }
      const relation = /^([a-z_]+):(biblical_[a-z_]+)![a-z0-9_]+\s*\(([\s\S]*)\)$/.exec(token)
      if (relation) {
        const [, name, related, nested] = relation
        const relationKeys: Record<string, string> = { biblical_sources: 'source_id', biblical_lexical_entries: 'lexical_entry_id', biblical_places: 'place_id', biblical_timeline_periods: 'period_id', biblical_library_items: 'item_id' }
        const foreignKey = relationKeys[related]
        if (!foreignKey) throw new Error('Relación editorial desconocida')
        include(related)
        const child = alias + '_r' + pairs.length
        const value = projection(nested, related, child)
        const sourceMatch = related === 'biblical_lexical_entries' && table === 'biblical_word_occurrences' ? ` AND ${field('source_id', child)}=${field('source_id', alias)}` : ''
        pairs.push(`'${name}'`, `(SELECT ${value} FROM ${identifier(related)} ${identifier(child)} WHERE ${field('id', child)}=${field(foreignKey, alias)}${sourceMatch} LIMIT 1)`)
      } else {
        const named = /^([a-z_][a-z0-9_]*)(?::([a-z_][a-z0-9_]*))?$/i.exec(token)
        if (!named) throw new Error('Selección editorial no admitida')
        pairs.push(`'${named[1]}'`, field(named[2] || named[1], alias))
      }
    }
    for (let i = 0; i < pairs.length; i += 80) pieces.push(`jsonb_build_object(${pairs.slice(i, i + 80).join(',')})`)
    return pieces.join(' || ') || "'{}'::jsonb"
  }
  const selected = projection(spec.columns, spec.table, 't')
  const where = spec.filters.map(filter)
  if (spec.table === 'biblical_word_occurrences') where.push(`${field('book_code')} IN (${(target === 'A' ? OT_BOOKS : NT_BOOKS).map(param).join(',')})`)
  const predicate = where.length ? where.join(' AND ') : 'TRUE'
  const orders = spec.orders.map(o => `${field(o.column)} ${o.ascending === false ? 'DESC' : 'ASC'} NULLS ${(o.nullsFirst ?? o.ascending === false) ? 'FIRST' : 'LAST'}`)
  // Las columnas de orden se transportan por separado para combinar ambos Neon sin perder paginación.
  const sortKeys = spec.orders.length ? `jsonb_build_array(${spec.orders.map(o => field(o.column)).join(',')})` : "'[]'::jsonb"
  const page = `SELECT jsonb_build_object('value',${selected},'sort',${sortKeys}) AS item FROM ${identifier(spec.table)} t WHERE ${predicate}${orders.length ? ' ORDER BY ' + orders.join(',') : ''} LIMIT ${param(spec.limit)} OFFSET ${param(spec.offset)}`
  const ctes = [...tables].map(t => `${identifier(t)} AS NOT MATERIALIZED (SELECT * FROM public.${identifier(t)} WHERE ${editorialPolicies[t]})`)
  const count = spec.count ? `(SELECT count(*) FROM ${identifier(spec.table)} t WHERE ${predicate})` : 'NULL::bigint'
  return { query: `WITH ${ctes.join(',')} SELECT ${spec.head ? "'[]'::jsonb" : `(SELECT coalesce(jsonb_agg(item),'[]'::jsonb) FROM (${page}) page)`} AS data,${count} AS count`, params: spec.head ? params.slice(0, -2) : params }
}
