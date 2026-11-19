// Lectura y atención son estados diferentes: abrir un chat no resuelve una ayuda.
export function pendienteSolidario(tipo: 'solicitud' | 'aporte', estado: string) {
  return tipo === 'solicitud' ? estado === 'enviada' : estado === 'ofrecido'
}
export function destinoSolidario(tipo: 'solicitud' | 'aporte', id?: string, revisar = false) {
  const url = new URL('https://calendario-vida-internacional.vercel.app/ayuda-solidaria')
  const params = url.searchParams
  params.set('tab', 'seguimiento')
  params.set('vista', tipo === 'solicitud' ? 'ayudas' : 'siembras')
  if (revisar) params.set('pendientes', '1')
  if (id) { params.set('contexto', tipo); params.set('item', id); url.hash = `caso-${id}` }
  return url.pathname + url.search + url.hash
}
