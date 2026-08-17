'use client'

import { useCallback, useEffect, useState } from 'react'
import { BrainCircuit, CheckCircle2, Loader2, Play, XCircle } from 'lucide-react'

type ProviderStatus = {
  provider: string
  configured: boolean
}

type DiagnosticResult = {
  ok: boolean
  provider?: string
  model?: string
  inputTokens?: number | null
  outputTokens?: number | null
  latencyMs?: number
  responseValid?: boolean
  error?: string
}

const LABELS: Record<string, string> = {
  gemini: 'Gemini',
  openai: 'OpenAI',
  claude: 'Claude',
  grok: 'Grok',
  kimi: 'Kimi',
  perplexity: 'Perplexity',
}

export default function AiDiagnosticsCard() {
  const [providers, setProviders] = useState<ProviderStatus[]>([])
  const [loadingProviders, setLoadingProviders] = useState(true)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<DiagnosticResult | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)

  const loadProviders = useCallback(async () => {
    setLoadingProviders(true)
    setStatusError(null)
    try {
      const response = await fetch('/api/admin/ai-diagnostics', { cache: 'no-store' })
      const payload = await response.json() as { ok?: boolean; providers?: ProviderStatus[]; error?: string }
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'No se pudo leer la configuración')
      setProviders(payload.providers || [])
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : 'No se pudo leer la configuración')
    } finally {
      setLoadingProviders(false)
    }
  }, [])

  useEffect(() => { void loadProviders() }, [loadProviders])

  const configuredCount = providers.filter((provider) => provider.configured).length

  async function runDiagnostic() {
    setResult(null)

    if (configuredCount === 0) {
      setResult({
        ok: false,
        error: 'Este Preview no está recibiendo variables de IA. Vincula las Shared Environment Variables al proyecto calendario para Preview y genera un nuevo deployment.',
      })
      return
    }

    setTesting(true)
    try {
      const response = await fetch('/api/admin/ai-diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const payload = await response.json() as DiagnosticResult
      setResult(payload)
    } catch {
      setResult({ ok: false, error: 'No se pudo ejecutar la prueba' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <section className="mt-5 overflow-hidden rounded-[24px] bg-white shadow-sm ring-1 ring-black/[0.04]">
      <div className="border-b border-slate-100 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-violet-500" />
              <h2 className="text-sm font-extrabold text-[#171923]">Diagnóstico de IA</h2>
            </div>
            <p className="mt-1 text-[10px] leading-4 text-slate-400">Prueba técnica mínima del router. No muestra claves ni guarda el contenido de la prueba.</p>
          </div>
          {!loadingProviders && !statusError ? (
            <span className="shrink-0 rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-600">{configuredCount}/{providers.length}</span>
          ) : null}
        </div>
      </div>

      <div className="p-5">
        {loadingProviders ? (
          <div className="flex items-center gap-2 py-2 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin" />Leyendo proveedores…</div>
        ) : statusError ? (
          <p className="rounded-2xl bg-rose-50 p-3 text-xs text-rose-600">{statusError}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {providers.map((provider) => (
                <div key={provider.provider} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5">
                  <span className="text-[11px] font-bold text-slate-600">{LABELS[provider.provider] || provider.provider}</span>
                  {provider.configured ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-slate-300" />}
                </div>
              ))}
            </div>
            {configuredCount === 0 ? (
              <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-[10px] leading-4 text-amber-700">Este Preview no está recibiendo las variables de IA. Revisa que las variables compartidas de Vercel estén vinculadas al proyecto <strong>calendario</strong> y habilitadas para <strong>Preview</strong>.</p>
            ) : null}
          </>
        )}

        <button
          type="button"
          onClick={runDiagnostic}
          disabled={testing || loadingProviders || Boolean(statusError)}
          className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#171923] px-4 text-xs font-extrabold text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {testing ? 'Probando router…' : 'Probar router'}
        </button>

        {result ? (
          <div className={`mt-4 rounded-2xl p-4 ${result.ok ? 'bg-emerald-50' : 'bg-rose-50'}`}>
            {result.ok ? (
              <>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /><p className="text-xs font-extrabold text-emerald-800">Router operativo</p></div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                  <div><p className="text-slate-400">Proveedor</p><p className="mt-0.5 font-bold text-slate-700">{LABELS[result.provider || ''] || result.provider || '—'}</p></div>
                  <div><p className="text-slate-400">Modelo</p><p className="mt-0.5 break-all font-bold text-slate-700">{result.model || '—'}</p></div>
                  <div><p className="text-slate-400">Latencia</p><p className="mt-0.5 font-bold text-slate-700">{typeof result.latencyMs === 'number' ? `${result.latencyMs} ms` : '—'}</p></div>
                  <div><p className="text-slate-400">Contrato</p><p className="mt-0.5 font-bold text-slate-700">{result.responseValid ? 'Correcto' : 'Respuesta distinta'}</p></div>
                  <div><p className="text-slate-400">Tokens entrada</p><p className="mt-0.5 font-bold text-slate-700">{result.inputTokens ?? 'No reportado'}</p></div>
                  <div><p className="text-slate-400">Tokens salida</p><p className="mt-0.5 font-bold text-slate-700">{result.outputTokens ?? 'No reportado'}</p></div>
                </div>
              </>
            ) : (
              <div className="flex items-start gap-2"><XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" /><div><p className="text-xs font-extrabold text-rose-800">La prueba no respondió</p><p className="mt-1 text-[10px] text-rose-600">{result.error || 'Error no identificado'}</p></div></div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  )
}
