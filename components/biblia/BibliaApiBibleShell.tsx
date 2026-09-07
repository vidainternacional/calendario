'use client'

import { useEffect, useState } from 'react'
import BibliaClient from '@/components/biblia/BibliaClient'

const HELLO_API = 'https://bible.helloao.org/api'
const PROXY_API = '/api/biblia/fuente'
const POS_KEY = 'vida-biblia-posicion'
const NVI_DEFAULT_KEY = 'vida-biblia-nvi-default-v1'
const META_EVENT = 'vida-api-bible-meta'

function prepararFums() {
  const w = window as any
  w.fumsData = w.fumsData || []
  w.fums = w.fums || function (...args: any[]) { w.fumsData.push(args) }
}

function instalarPuente() {
  if (typeof window === 'undefined') return
  const w = window as any
  if (w.__vidaApiBibleBridgeInstalled) return
  w.__vidaApiBibleBridgeInstalled = true

  prepararFums()

  try {
    if (!localStorage.getItem(NVI_DEFAULT_KEY)) {
      const raw = localStorage.getItem(POS_KEY)
      const actual = raw ? JSON.parse(raw) : {}
      localStorage.setItem(POS_KEY, JSON.stringify({ ...actual, trad: 'api-nvi' }))
      localStorage.setItem(NVI_DEFAULT_KEY, '1')
    }
  } catch {}

  const nativeFetch = window.fetch.bind(window)
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const originalUrl = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const esBiblia = originalUrl.startsWith(HELLO_API)
    const rewrittenUrl = esBiblia ? `${PROXY_API}${originalUrl.slice(HELLO_API.length)}` : originalUrl
    const request = esBiblia && typeof input !== 'string' && !(input instanceof URL) ? new Request(rewrittenUrl, input) : rewrittenUrl
    const response = await nativeFetch(request as RequestInfo | URL, init)

    if (esBiblia && response.ok && /\/api\/biblia\/fuente\/api-.*\/[^/]+\/\d+\.json/.test(rewrittenUrl)) {
      response.clone().json().then((payload) => {
        const meta = payload?.meta
        if (meta?.fumsToken) w.fums('trackView', meta.fumsToken)
        if (meta?.copyright) {
          w.__vidaApiBibleCopyright = String(meta.copyright)
          window.dispatchEvent(new CustomEvent(META_EVENT, { detail: { copyright: String(meta.copyright) } }))
        }
      }).catch(() => {})
    }

    return response
  }
}

if (typeof window !== 'undefined') instalarPuente()

type Props = React.ComponentProps<typeof BibliaClient>

export default function BibliaApiBibleShell(props: Props) {
  const [copyright, setCopyright] = useState('')

  useEffect(() => {
    prepararFums()
    const w = window as any
    const scriptId = 'vida-api-bible-fums-v3'
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://pkg.api.bible/fumsV3.min.js'
      script.async = true
      document.body.appendChild(script)
    }

    if (w.__vidaApiBibleCopyright) setCopyright(String(w.__vidaApiBibleCopyright))
    const onMeta = (event: Event) => {
      const detail = (event as CustomEvent<{ copyright?: string }>).detail
      if (detail?.copyright) setCopyright(detail.copyright)
    }
    window.addEventListener(META_EVENT, onMeta)
    return () => window.removeEventListener(META_EVENT, onMeta)
  }, [])

  return (
    <>
      <BibliaClient {...props} />
      {copyright ? (
        <p className="mx-auto max-w-3xl px-5 pb-24 pt-3 text-center text-[10px] leading-4 text-slate-400 sm:px-6">
          {copyright}
        </p>
      ) : null}
    </>
  )
}
