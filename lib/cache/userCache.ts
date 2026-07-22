type CacheEnvelope<T> = {
  version: 1
  userId: string
  savedAt: number
  expiresAt: number
  data: T
}

const PREFIX = 'vida:user-cache:'

function key(userId: string, scope: string) {
  return `${PREFIX}${userId}:${scope}`
}

export function readUserCache<T>(userId: string, scope: string): T | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(key(userId, scope))
    if (!raw) return null

    const parsed = JSON.parse(raw) as CacheEnvelope<T>
    if (parsed.version !== 1 || parsed.userId !== userId) return null

    if (Date.now() > parsed.expiresAt) {
      window.localStorage.removeItem(key(userId, scope))
      return null
    }

    return parsed.data
  } catch {
    return null
  }
}

export function writeUserCache<T>(
  userId: string,
  scope: string,
  data: T,
  ttlMs: number,
) {
  if (typeof window === 'undefined') return

  try {
    const now = Date.now()
    const payload: CacheEnvelope<T> = {
      version: 1,
      userId,
      savedAt: now,
      expiresAt: now + ttlMs,
      data,
    }

    window.localStorage.setItem(key(userId, scope), JSON.stringify(payload))
  } catch {
    // localStorage puede fallar por cuota o modo privado; la app sigue sin caché.
  }
}

export function clearUserCache(userId?: string) {
  if (typeof window === 'undefined') return

  try {
    const prefix = userId ? `${PREFIX}${userId}:` : PREFIX
    const keys: string[] = []

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const currentKey = window.localStorage.key(index)
      if (currentKey?.startsWith(prefix)) keys.push(currentKey)
    }

    keys.forEach((currentKey) => window.localStorage.removeItem(currentKey))
  } catch {
    // La limpieza es best-effort.
  }
}
