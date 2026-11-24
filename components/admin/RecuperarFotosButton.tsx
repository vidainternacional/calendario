'use client'

import { useState, useTransition } from 'react'
import { recuperarFotosAnteriores } from '@/app/actions/recuperar-fotos'

export default function RecuperarFotosButton() {
  const [pending, start] = useTransition()
  const [message, setMessage] = useState('')
  return <section className="mt-5 border-t border-slate-200 py-5 text-slate-800">
    <h2 className="text-sm font-bold">Fotos anteriores</h2>
    <p className="mt-2 text-xs leading-5">Recupera las seis fotos autorizadas sin reemplazar fotos nuevas. Retira cada original únicamente después de verificar su copia. El archivo pastoral de prueba queda excluido.</p>
    <button type="button" disabled={pending} className="mt-3 min-h-11 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-50" onClick={() => start(async () => {
      setMessage('')
      try {
        const result = await recuperarFotosAnteriores()
        setMessage('copied' in result ? `Copias verificadas: ${result.copied}. Perfiles recuperados: ${result.updated}. Originales retirados: ${result.removed}.` : result.error)
      } catch { setMessage('No se pudo completar la solicitud. Puede reintentarse. No se sobrescriben fotos nuevas.') }
    })}>{pending ? 'Recuperando y verificando…' : 'Recuperar fotos y retirar originales verificados'}</button>
    <p role="status" className="mt-2 text-xs leading-5">{message}</p>
  </section>
}
