export type VidaAiProviderFailureCategory =
  | 'sin_creditos'
  | 'rate_limit'
  | 'autenticacion'
  | 'sin_permisos'
  | 'error_proveedor'

export function classifyVidaAiProviderFailure(
  status: number | null | undefined,
  type?: unknown,
  message?: unknown,
): VidaAiProviderFailureCategory {
  const fingerprint = `${typeof type === 'string' ? type : ''} ${typeof message === 'string' ? message : ''}`.toLowerCase()

  if (/credit|balance|billing|quota|insufficient|recharge|license/.test(fingerprint)) return 'sin_creditos'
  if (status === 401 || /unauthori|authentication|invalid[_ -]?api[_ -]?key/.test(fingerprint)) return 'autenticacion'
  if (status === 403 || /forbidden|permission|not allowed|access denied/.test(fingerprint)) return 'sin_permisos'
  if (status === 429 || /rate[_ -]?limit|too many requests/.test(fingerprint)) return 'rate_limit'
  return 'error_proveedor'
}

export function providerFailureCooldownMs(category: VidaAiProviderFailureCategory, status?: number | null) {
  if (category === 'sin_creditos' || category === 'autenticacion' || category === 'sin_permisos') return 6 * 60 * 60 * 1000
  if (category === 'rate_limit') return 2 * 60 * 1000
  if (typeof status === 'number' && status >= 500) return 2 * 60 * 1000
  return 0
}

export async function readProviderFailureFingerprint(response: Response) {
  const payload = await response.clone().json().catch(() => null) as unknown
  if (!payload || typeof payload !== 'object') return { type: undefined, message: undefined }

  const root = payload as { error?: unknown; type?: unknown; code?: unknown; message?: unknown; detail?: unknown }
  if (root.error && typeof root.error === 'object') {
    const error = root.error as { type?: unknown; code?: unknown; message?: unknown }
    return { type: error.code ?? error.type, message: error.message }
  }

  return {
    type: root.code ?? root.type,
    message: typeof root.error === 'string' ? root.error : root.message ?? root.detail,
  }
}
