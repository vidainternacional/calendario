import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { cargarModulo } from './seguridad-real-loader.mjs'

const acceso = cargarModulo('lib/pastoral/access.ts')
test('contexto compartido conserva la matriz pastoral y consulta identidad real', async () => {
  for (const caso of [
    { sesion: false, perfil: null, permitido: false },
    { perfil: null, permitido: false },
    { perfil: { rol: 'pastor', estado_cuenta: 'activo' }, permitido: true },
    { perfil: { rol: 'administrador', estado_cuenta: 'activo' }, permitido: true },
    { perfil: { rol: 'servidor', estado_cuenta: 'activo', acceso_centro_pastoral: true }, permitido: true },
    { perfil: { rol: 'lider', estado_cuenta: 'activo' }, permitido: false },
    { perfil: { rol: 'pastor', estado_cuenta: 'suspendido' }, permitido: false },
    { perfil: { rol: 'servidor', estado_cuenta: 'pendiente', acceso_centro_pastoral: true }, permitido: false },
  ]) {
    let consultas = 0
    const supabase = {
      auth: { getUser: async () => ({ data: { user: caso.sesion === false ? null : { id: 'usuario-real' } } }) },
      from(table) {
        consultas++
        assert.equal(table, 'profiles')
        return { select() { return this }, eq(col, id) { assert.equal(col, 'id'); assert.equal(id, 'usuario-real'); return this }, single: async () => ({ data: caso.perfil }) }
      },
    }
    const { contextoPastoral } = cargarModulo('lib/auth/permisos.ts', {
      'server-only': {}, '@/lib/supabase/server': { createClient: async () => supabase }, '@/lib/pastoral/access': acceso,
    })
    const r = await contextoPastoral('Sin permiso en este módulo')
    assert.equal(r.error === null, caso.permitido)
    assert.equal(consultas, caso.sesion === false ? 0 : 1)
    if (!caso.permitido) assert.equal(r.error, caso.sesion === false ? 'Tu sesión expiró.' : 'Sin permiso en este módulo')
  }
})

test('las seis acciones pastorales usan el mismo contexto, sin copias locales', () => {
  for (const file of ['pastoral', 'pastoral-bosquejos', 'pastoral-biblioteca', 'pastoral-paquetes', 'pastoral-proyecto-versiculos', 'pastoral-distribucion']) {
    const text = fs.readFileSync(`app/actions/${file}.ts`, 'utf8')
    assert.match(text, /import \{ contextoPastoral \} from '@\/lib\/auth\/permisos'/)
    assert.doesNotMatch(text, /function contextoPastoral|tieneAccesoPastoral/)
    assert.match(text, /await contextoPastoral\('No tienes permiso/)
  }
})
