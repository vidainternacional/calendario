'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { importarCatalogoCancionesVida, revisarCatalogoCancionesVida } from '@/app/actions/biblioteca-alabanza'
import { MINISTERIO_CATALOGO_VIDA } from '@/lib/musica/catalogo-vida'

// La carga editorial pedida se ejecuta con la sesión real de administración.
// No sustituye el editor ni pide a los líderes seleccionar/importar canciones.
export default function ImportarCatalogoVida({ ministerioId, habilitada }: { ministerioId: string; habilitada: boolean }) {
  const router = useRouter()
  const [mensaje, setMensaje] = useState<string | null>(null)
  useEffect(() => {
    if (!habilitada || ministerioId !== MINISTERIO_CATALOGO_VIDA) return
    let salir = false
    async function cargar() {
      let creadas = 0
      try {
        const revision = await revisarCatalogoCancionesVida(ministerioId)
        if (salir) return
        if (revision.error || !revision.canciones) { setMensaje(revision.error || 'No se pudo comprobar el catálogo.'); return }
        const candidatas = revision.canciones.filter((song) => song.estado === 'identificada' && !song.yaExiste)
        const completas = candidatas.filter((song) => song.youtube_url && song.spotify_url)
        if (!candidatas.length) return
        let pendientes = candidatas.length - completas.length
        for (let inicio = 0; inicio < completas.length; inicio += 2) {
          if (salir) return
          setMensaje(`Comprobando enlaces e incorporando canciones: ${inicio + 1}–${Math.min(inicio + 2, completas.length)} de ${completas.length}… Puedes seguir utilizando la biblioteca.`)
          const result = await importarCatalogoCancionesVida(ministerioId, completas.slice(inicio, inicio + 2).map((song) => song.id))
          creadas += result.creadas.length
          pendientes += result.errores.length
          if (salir) return
          if (result.error) { setMensaje(`${creadas} canciones incorporadas. ${result.error}`); return }
        }
        setMensaje(`${creadas} canciones incorporadas. ${pendientes} referencias candidatas quedan pendientes de completar o comprobar sus enlaces. Las fichas existentes se conservan.`)
      } catch {
        if (!salir) setMensaje('La comprobación se interrumpió. Las canciones ya guardadas se conservan; al volver a abrir se reintentará sin duplicarlas.')
      } finally { if (creadas) router.refresh() }
    }
    void cargar()
    return () => { salir = true }
  }, [ministerioId, habilitada, router])
  return mensaje ? <p role="status" aria-live="polite" className="mb-4 text-sm leading-6 text-slate-600">{mensaje}</p> : null
}
