import test from 'node:test'
import assert from 'node:assert/strict'
import { cargarModulo } from './seguridad-real-loader.mjs'

// Prueba la unión de publicaciones que provienen de dos fuentes autorizadas,
// sin acceso real a Supabase y sin publicar mensajes.
const fecha = (mes, dia) => new Date(Date.UTC(2026, mes - 1, dia)).toISOString()

function biblioteca(cantidadNuevos, cantidadHistoricos) {
  const videos = Array.from({ length: cantidadNuevos }, (_, index) => ({
    id: 'nuevo-' + index,
    titulo: 'Devocional nuevo ' + index,
    descripcion: '',
    publicado: true,
    tipo: 'devocional',
    autor_id: 'pastor-1',
    published_at: fecha(11, 16 - index),
  }))
  const historicos = Array.from({ length: cantidadHistoricos }, (_, index) => ({
    id: 'historico-' + index,
    titulo: 'Mensaje histórico ' + index,
    tipo: 'mensaje',
    descripcion: '',
    autor: 'Pastor',
    fecha: fecha(8, 16 - index),
  }))
  const invocaciones = []
  function consulta(tabla) {
    let limite = 9999
    let ids = []
    const q = {
      select() { return q }, eq() { return q }, order() { return q },
      limit(n) { limite = n; return q },
      in(campo, valores) { if (campo === 'id') ids = valores; return q },
      then(ok, fail) {
        const data = tabla === 'vida_devocionales'
          ? videos.slice(0, limite)
          : ids.map(id => ({ id, nombre_completo: 'Pastor' }))
        return Promise.resolve({ data, error: null }).then(ok, fail)
      },
    }
    return q
  }
  const mod = cargarModulo('lib/estudios/mensajes-dirigidos.ts', {
    'server-only': {},
    '@/lib/supabase/server': { createClient: async () => ({ from: consulta }) },
    './mensajes-semanales': {
      cargarMensajesSemanales: async (pagina, desdeInicio = false) => {
        invocaciones.push({ pagina, desdeInicio })
        const inicio = desdeInicio ? 0 : (pagina - 1) * 12
        return {
          autenticado: true, error: null,
          mensajes: historicos.slice(inicio, pagina * 12),
          haySiguiente: historicos.length > pagina * 12,
        }
      },
    },
    './mensajes-dirigidos-tipos': {
      CAMPOS_DIRIGIDOS: 'id,titulo',
      adaptarLegado: m => ({ ...m, origen: 'legado' }),
      desdeVideoDirigido: v => ({ ...v, fecha: v.published_at, autor: 'Pastor', origen: 'dirigido' }),
    },
  })
  return { mod, invocaciones }
}

for (const [nuevos, historicos] of [[13, 1], [7, 7], [1, 13]]) {
  test('biblioteca mezcla ' + nuevos + ' nuevos y ' + historicos + ' históricos sin perder videos ni repetirlos', async () => {
    const { mod, invocaciones } = biblioteca(nuevos, historicos)
    const primera = await mod.cargarBibliotecaDirigida(1, 'todos')
    const segunda = await mod.cargarBibliotecaDirigida(2, 'todos')
    assert.equal(primera.mensajes.length, 12)
    assert.equal(segunda.mensajes.length, 2)
    assert.equal(primera.haySiguiente, true)
    assert.equal(segunda.haySiguiente, false)
    const ids = [...primera.mensajes, ...segunda.mensajes].map(m => m.id)
    assert.equal(new Set(ids).size, nuevos + historicos)
    assert.ok(ids.some(id => id.startsWith('historico-')))
    assert.ok(ids.some(id => id.startsWith('nuevo-')))
    assert.ok(invocaciones.every(c => c.desdeInicio === true))
  })
}
