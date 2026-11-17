export const PUSH_REMINDER_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000
export const PUSH_SUBSCRIPTION_CHANGED = 'vida:push-subscription-changed'

export type PushReminderKind = 'inactive' | 'blocked' | 'install' | null

export function pushReminderKind({ supported, ios, standalone, permission, subscribed, dismissedUntil, now }: {
  supported: boolean
  ios: boolean
  standalone: boolean
  permission: string
  subscribed: boolean
  dismissedUntil: number
  now: number
}): PushReminderKind {
  if (Number.isFinite(dismissedUntil) && dismissedUntil > now) return null
  if (ios && !standalone) return 'install'
  if (!supported) return null
  if (permission === 'denied') return 'blocked'
  if (permission === 'granted' && subscribed) return null
  return 'inactive'
}

export function pushReminderStorageKey(userId: string) {
  return `vida-push-reminder-v1:${userId}`
}
