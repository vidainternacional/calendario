import type { Transition } from 'framer-motion'

export const SPRING_STANDARD: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
}

// Zoom de navegación del Calendario. La misma física se usa al entrar y al salir
// para que Año ↔ Mes se sienta como una sola transición reversible y consistente.
export const CALENDAR_ZOOM_SPRING: Transition = {
  type: 'spring',
  stiffness: 320,
  damping: 32,
  mass: 0.86,
  restSpeed: 0.7,
  restDelta: 0.002,
}

export const VIEW_FADE = {
  duration: 0.16,
  ease: [0.2, 0.8, 0.2, 1] as const,
}

export const SWIPE_THRESHOLD_RATIO = 0.3
export const SWIPE_VELOCITY_THRESHOLD = 650
