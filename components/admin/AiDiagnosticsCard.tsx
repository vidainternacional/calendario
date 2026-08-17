'use client'

import { useCallback, useEffect, useState } from 'react'
import { BrainCircuit, CheckCircle2, Loader2, Play, XCircle } from 'lucide-react'

type ProviderStatus = {
  provider: string
  configured: boolean
}

type ProviderAttempt = {
  provider: string
  model: string
  status: number | null
}

type DiagnosticResult = {
  ok: boolean
  requestedProvider?: string
  provider?: string | null
  model?: string
  inputTokens?: number | null
  outputTokens?: number | null
  latencyMs?: number
  responseValid?: boolean
  attempts?: ProviderAttempt[]
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

function errorLabel(result: DiagnosticResult) {
  if (result.error === 'provider_not_configured') return 'No configurado en este Preview'
  if (result.error === 'rate_limited') return 'Límite temporal de pruebas alcanzado'
  if (result.error === 'provider_unavailable') return 'El proveedor no respondió correctamente'
  return result.error || 'Error no identificado'
}

function ResultDetails({ result, compact = false }: { result: DiagnosticResult; compact?: boolean }) {
  const failedAttempt = result.attempts?.[0]
  if (!result.ok) {
    return (
      <div className={`${compact ? 'mt-2 px-1 pb-1' : 'mt-4 rounded-2xl bg-rose-50 p-4'}`}>
        <div className="flex items-start gap-2">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold text-rose-800">{errorLabel(result)}</p>
            {failedAttempt ? <p className="mt-0.5 break-all text-[9px] text-rose-600">{failedAttempt.model}{typeof failedAttempt.status === 'number' ? ` · HTTP ${failedAttempt.status}` : ''}</p> : null}
          </div>
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="mt-2 grid grid-cols-3 gap-1 px-1 pb-1 text-[9px]">
        <div><p className="text-slate-400">ms</p><p className="font-bold text-slate-700">{result.latencyMs ?? '—'}</p></div>
        <div><p className="text-slate-400">entrada</p><p className="font-bold text-slate-700">{result.inputTokens ?? '—'}</p></div>
        <div><p className="text-slate-400">salida</p><p className="font-bold text-slate-700">{result.outputTokens ?? '—'}</p></div>
        <p className="col-span-3 mt-1 break-all text-[9px] font-semibold text-emerald-700">{result.model || 'Modelo no reportado'}{result.responseValid ? ' · correcto' : ' · respuesta distinta'}</p>
      </div>
    )
  }

  return (
    <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
      <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /><p className="text-xs font-extrabold text-emerald-800">Router operativo</p></div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
        <div><p className="text-slate-400">Proveedor</p><p className="mt-0.5 font-bold text-slate-700">{LABELS[result.provider || ''] || result.provider || '—'}</p></div>
        <div><p className="text-slate-400">Modelo</p><p className="mt-0.5 break-all font-bold text-slate-700">{result.model || '—'}</p></div>
        <div><p className="text-slate-400">Latencia</p><p className="mt-0.5 font-bold text-slate-700">{typeof result.latencyMs === 'number' ? `${result.latencyMs} ms` : '—'}</p></div>
        <div><p className="text-slate-400">Contrato</p><p className="mt-0.5 font-bold text-slate-700">{result.responseValid ? 'Correcto' : 'Respuesta distinta'}</p></div>
        <div><p className="text-slate-400">Tokens entrada</p><p className="mt-0.5 font-bold text-slate-700">{result.inputTokens ?? 'No reportado'}</p></div>
        <div><p className="text-slate-400">Tokens salida</p><p className="mt-0.5 font-bold text-slate-700">{result.outputTokens ?? 'No reportado'}</p></div>
      </div>
    </div>
  )
}

export default function AiDiagnosticsCard() {
  const [providers, setProviders] = useState<ProviderStatus[]>([])
  const [loadingProviders, setLoadingProviders] = useState(true)
  const [testingTarget, setTestingTarget] = useState<string | null>(null)
  const [routerResult, setRouterResult] = useState<DiagnosticResult | null>(null)
  const [providerResults, setProviderResults] = useState<Record<string, DiagnosticResult>>({})
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

  async function runDiagnostic(provider?: string) {
    const target = provider || 'router'
    setTestingTarget(target)
    if (provider) {
      setProviderResults((current) => {
        const next = { ...current }
        delete next[provider]
        return next
      })
    } else {
      setRouterResult(null)
    }

    try {
      const response = await fetch('/api/admin/ai-diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(provider ? { provider } : {}),
      })
      const payload = await response.json() as DiagnosticResult
      if (provider) setProviderResults((current) => ({ ...current, [provider]: payload }))
      else setRouterResult(payload)
    } catch {
      const failure = { ok: false, error: 'No se pudo ejecutar la prueba' } as DiagnosticResult
      if (provider) setProviderResults((current) => ({ ...current, [provider]: failure }))
      else setRouterResult(failure)
    } finally {
      setTestingTarget(null)
    }
  }

  const configuredCount = providers.filter((provider) => provider.configured).length
  const noProviders = !loadingProviders && !statusError && configuredCount === 0

  return (
    <section className="mt-5 overflow-hidden rounded-[24px] bg-white shadow-sm ring-1 ring-black/[0.04]">
      <div className="border-b border-slate-100 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-violet-500" />
              <h2 className="text-sm font-extrabold text-[#171923]">Diagnóstico de IA</h2>
            </div>
            <p className="mt-1 text-[10px] leading-4 text-slate-400">Pruebas mínimas del router. No muestra claves ni guarda el contenido de las pruebas.</p>
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
          <div className="space-y-2">
            {providers.map((provider) => {
              const result = providerResults[provider.provider]
              const isTesting = testingTarget === provider.provider
              return (
                <div key={provider.provider} className="rounded-2xl bg-slate-50 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      {provider.configured ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /> : <XCircle className="h-4 w-4 shrink-0 text-slate-300" />}
                      <span className="truncate text-[11px] font-bold text-slate-600">{LABELS[provider.provider] || provider.provider}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void runDiagnostic(provider.provider)}
                      disabled={!provider.configured || Boolean(testingTarget)}
                      className="min-h-8 shrink-0 rounded-xl bg-white px-3 text-[10px] font-extrabold text-violet-600 shadow-sm ring-1 ring-black/[0.04] disabled:cursor-not-allowed disabled:text-slate-300"
                    >
                      {isTesting ? <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Probando</span> : `Probar ${LABELS[provider.provider] || provider.provider}`}
                    </button>
                  </div>
                  {result ? <ResultDetails result={result} compact /> : null}
                </div>
              )
            })}
          </div>
        )}

        {noProviders ? (
          <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-[10px] leading-4 text-amber-800">
            Ninguna API de IA está disponible en este Preview. Vincula las variables compartidas al proyecto <strong>calendario</strong>, habilita <strong>Preview</strong> y genera un deployment nuevo.
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => void runDiagnostic()}
          disabled={Boolean(testingTarget) || loadingProviders || Boolean(statusError) || configuredCount === 0}
          className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#171923] px-4 text-xs font-extrabold text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {testingTarget === 'router' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {testingTarget === 'router' ? 'Probando router…' : configuredCount === 0 && !loadingProviders ? 'Sin proveedores configurados' : 'Probar router'}
        </button>

        {routerResult ? <ResultDetails result={routerResult} /> : null}
      </div>
    </section>
  )
}
