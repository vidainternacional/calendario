import test from 'node:test'
import assert from 'node:assert/strict'
import { cargarModulo } from './seguridad-real-loader.mjs'

test('eliminar contacto exige participar en la relación y no declara éxito si falla el borrado', async () => {
  for (const caso of ['sin-sesion', 'ajeno', 'solicitante', 'destinatario', 'error', 'sin-fila']) {
    let deletes = 0
    let revalidaciones = 0
    let filtro
    const db = {
      auth: { getUser: async () => ({ data: { user: caso === 'sin-sesion' ? null : { id: 'yo' } } }) },
      from() {
        let borrando = false
        return {
          select() { return this }, eq() { return this },
          delete() { deletes++; borrando = true; return this },
          or(value) { filtro = value; return this },
          async maybeSingle() {
            if (borrando) return { data: caso === 'sin-fila' ? null : { id: 'contacto' }, error: caso === 'error' ? {} : null }
            return { data: { solicitante_id: caso === 'ajeno' || caso === 'destinatario' ? 'otro' : 'yo', destinatario_id: caso === 'destinatario' ? 'yo' : 'tercero' }, error: null }
          },
        }
      },
    }
    const actions = cargarModulo('app/actions/contactos.ts', {
      '@/lib/supabase/server': { createClient: async () => db },
      '@/lib/webpush': {}, 'next/cache': { revalidatePath() { revalidaciones++ } },
    })
    const result = await actions.eliminarContacto('contacto')
    const autorizado = !['sin-sesion', 'ajeno'].includes(caso)
    const exito = ['solicitante', 'destinatario'].includes(caso)
    assert.equal(deletes, autorizado ? 1 : 0, caso)
    assert.equal(Boolean(result.success), exito, caso)
    assert.equal(revalidaciones, exito ? 1 : 0, caso)
    if (autorizado) assert.equal(filtro, 'solicitante_id.eq.yo,destinatario_id.eq.yo')
  }
})
