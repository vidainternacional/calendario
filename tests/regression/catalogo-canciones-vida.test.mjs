import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { cargarModulo } from './seguridad-real-loader.mjs'

const catalogo = JSON.parse(fs.readFileSync('data/canciones-vida-20261117.json', 'utf8'))
const util = cargarModulo('lib/musica/catalogo-vida.ts')
const ministerio = util.MINISTERIO_CATALOGO_VIDA
const elegibles = catalogo.filter((song) => song.estado === 'identificada')

function escenario({ user = true, rol = 'administrador', lider = false, activo = true, estado = 'activo', nombre = 'Alabanza', existentes = [], falloLectura = false, falloId = null, concurrencia = false, mediosValidos = true } = {}) {
  const fichas = existentes.map((song) => ({ ...song }))
  const escrituras = []
  const revalidadas = []
  const admin = { from(tabla) {
    const query = {
      select() { return query }, eq() { return query }, order() { return query },
      async maybeSingle() { return { data: tabla === 'profiles' ? { rol, activo, estado_cuenta: estado } : tabla === 'ministerio_miembros' ? { es_lider: lider } : { nombre } } },
      async range(inicio, fin) { return { data: fichas.slice(inicio, fin + 1), error: falloLectura ? { message: 'lectura fallida' } : null } },
      async insert(payload) {
        escrituras.push({ ...payload })
        if (payload.id === falloId) return { error: { code: 'XX000' } }
        if (concurrencia && !fichas.some((song) => song.id === payload.id)) { fichas.push({ ...payload }); return { error: { code: '23505' } } }
        if (fichas.some((song) => song.id === payload.id)) return { error: { code: '23505' } }
        fichas.push({ ...payload }); return { error: null }
      },
    }
    return query
  } }
  const actions = cargarModulo('app/actions/biblioteca-alabanza.ts', {
    'next/cache': { revalidatePath(path) { revalidadas.push(path) } },
    '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: user ? { id: 'editor-real' } : null } }) } }), createAdminClient: () => admin },
    '@/data/canciones-vida-20261117.json': catalogo,
    '@/lib/musica/catalogo-vida': util,
    '@/lib/musica/referencias-certificadas': { obtenerReferenciaCertificada: (song) => mediosValidos ? { youtube_url: song.youtube_url, spotify_url: song.spotify_url } : null },
  })
  return { actions, fichas, escrituras, revalidadas }
}

test('el catálogo distingue referencias, dudas y fichas existentes sin inventar campos', () => {
  assert.equal(catalogo.length, 235)
  assert.equal(new Set(catalogo.map((song) => song.id)).size, catalogo.length)
  for (const song of catalogo) {
    assert.ok(song.titulo.length > 0 && song.titulo.length <= 160)
    assert.equal(song.letra, null)
    assert.ok(song.campos_pendientes.includes('letra'))
    if (song.youtube_url) assert.match(song.youtube_url, /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/)
    if (song.spotify_url) assert.match(song.spotify_url, /^https:\/\/open\.spotify\.com\/track\/[A-Za-z0-9]{22}$/)
    if (song.estado === 'identificada') {
      assert.ok(song.artista && song.acordes && song.tonalidad_base)
      assert.ok(song.youtube_url || song.spotify_url)
      assert.equal(song.observaciones_revision.length, 0)
    }
  }
  for (const indice of [33, 97]) assert.equal(catalogo.find((song) => song.indice_origen === indice).estado, 'existente')
  for (const indice of [3, 45, 48, 78, 113, 205, 212]) assert.equal(catalogo.find((song) => song.indice_origen === indice).estado, 'pendiente')
})

test('la selección rechaza fichas dudosas, identificadores ajenos y lotes grandes', () => {
  assert.equal(util.seleccionarLoteVida(catalogo, [catalogo.find((song) => song.estado === 'pendiente').id]), null)
  assert.equal(util.seleccionarLoteVida(catalogo, ['ajena']), null)
  assert.equal(util.seleccionarLoteVida(catalogo, []), null)
  assert.equal(util.seleccionarLoteVida(catalogo, Array(21).fill(elegibles[0].id)), null)
  assert.equal(util.seleccionarLoteVida(catalogo, [elegibles[0].id, elegibles[0].id]).length, 1)
})

test('sin sesión, permiso, cuenta activa o ministerio autorizado no se lee ni importa el catálogo', async () => {
  for (const opciones of [{ user: false }, { rol: 'miembro' }, { activo: false }, { estado: 'pendiente' }, { nombre: 'Otro' }]) {
    const e = escenario(opciones)
    assert.ok((await e.actions.revisarCatalogoCancionesVida(ministerio)).error)
    assert.ok((await e.actions.importarCatalogoCancionesVida(ministerio, [elegibles[0].id])).error)
    assert.equal(e.escrituras.length, 0)
  }
  const e = escenario()
  assert.ok((await e.actions.importarCatalogoCancionesVida('ministerio-ajeno', [elegibles[0].id])).error)
  assert.equal(e.escrituras.length, 0)
})

test('un líder autorizado incorpora y reintenta sin sobrescribir cambios posteriores', async () => {
  const e = escenario({ rol: 'miembro', lider: true })
  const id = elegibles[0].id
  const primero = await e.actions.importarCatalogoCancionesVida(ministerio, [id])
  assert.equal(primero.creadas.length, 1)
  assert.equal(e.escrituras[0].creado_por, 'editor-real')
  assert.equal(e.escrituras[0].ministerio_id, ministerio)
  e.fichas[0].acordes = 'Edición posterior conservada'
  const segundo = await e.actions.importarCatalogoCancionesVida(ministerio, [id])
  assert.equal(segundo.omitidas.length, 1)
  assert.equal(e.escrituras.length, 1)
  assert.equal(e.fichas[0].acordes, 'Edición posterior conservada')
  assert.ok(e.revalidadas.some((path) => path.endsWith('/biblioteca-alabanza')))
})

test('los duplicados por acento o puntuación y las fichas archivadas se conservan', async () => {
  const song = elegibles[0]
  const e = escenario({ existentes: [{ id: 'original', titulo: `  ${song.titulo.toUpperCase()}! `, activo: false, acordes: 'Original' }] })
  const r = await e.actions.importarCatalogoCancionesVida(ministerio, [song.id])
  assert.equal(r.omitidas.length, 1)
  assert.equal(e.escrituras.length, 0)
  assert.equal(e.fichas[0].activo, false)
  const revision = await e.actions.revisarCatalogoCancionesVida(ministerio)
  assert.equal(revision.canciones.find((item) => item.id === song.id).yaExiste, true)
})

test('fallar la lectura de existentes detiene todas las escrituras', async () => {
  const e = escenario({ falloLectura: true })
  assert.ok((await e.actions.importarCatalogoCancionesVida(ministerio, [elegibles[0].id])).error)
  assert.equal(e.escrituras.length, 0)
})

test('la action rechaza una ficha pendiente aunque un cliente fabrique la selección', async () => {
  const e = escenario()
  const pendiente = catalogo.find((song) => song.estado === 'pendiente')
  assert.ok((await e.actions.importarCatalogoCancionesVida(ministerio, [pendiente.id])).error)
  assert.ok((await e.actions.importarCatalogoCancionesVida(ministerio, ['fuera-del-manifiesto'])).error)
  assert.equal(e.escrituras.length, 0)
})

test('la búsqueda de duplicados consulta también las páginas posteriores a mil fichas', async () => {
  const existentes = Array.from({ length: 1000 }, (_, i) => ({ id: `anterior-${i}`, titulo: `Otra ${i}` }))
  existentes.push({ id: 'original-final', titulo: elegibles[0].titulo })
  const e = escenario({ existentes })
  const r = await e.actions.importarCatalogoCancionesVida(ministerio, [elegibles[0].id])
  assert.equal(r.omitidas.length, 1)
  assert.equal(e.escrituras.length, 0)
})

test('un error parcial identifica el reintento y no impide guardar las otras fichas', async () => {
  const e = escenario({ falloId: elegibles[0].id })
  const r = await e.actions.importarCatalogoCancionesVida(ministerio, elegibles.slice(0, 2).map((song) => song.id))
  assert.equal(r.errores.length, 1)
  assert.equal(r.errores[0].id, elegibles[0].id)
  assert.equal(r.creadas.length, 1)
})

test('dos solicitudes simultáneas del mismo catálogo resuelven la colisión sin actualizar filas', async () => {
  const e = escenario({ concurrencia: true })
  const r = await e.actions.importarCatalogoCancionesVida(ministerio, [elegibles[0].id])
  assert.equal(r.omitidas.length, 1)
  assert.equal(r.errores.length, 0)
  assert.equal(e.fichas.length, 1)
})


test('no se importa una ficha cuando el proveedor no confirma sus enlaces', async () => {
  const e = escenario({ mediosValidos: false })
  const r = await e.actions.importarCatalogoCancionesVida(ministerio, [elegibles[0].id])
  assert.equal(r.creadas.length, 0)
  assert.equal(r.errores.length, 1)
  assert.equal(e.escrituras.length, 0)
})

test('la referencia de Pon aceite corresponde al canto correcto, no al medley de Ricardo Rodríguez',()=>{
 const catalogo=JSON.parse(fs.readFileSync('data/canciones-vida-20261117.json','utf8'))
 const song=catalogo.find(s=>s.indice_origen===7)
 assert.equal(song.titulo,'Pon aceite en mi vida');assert.equal(song.artista,'Jaime Murrell');assert.equal(song.spotify_url,null)
 assert.equal(song.youtube_url,'https://www.youtube.com/watch?v=mFOJZdJMGcU')
 assert.ok(!song.fuentes_verificacion.some(url=>url.includes('2oxFhTlx3Xr0kkqUWdozJp')))
})
