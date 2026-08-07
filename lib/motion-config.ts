import type { Transition } from 'framer-motion'

export const SPRING_STANDARD: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
}

export const VIEW_FADE = {
  duration: 0.16,
  ease: [0.2, 0.8, 0.2, 1] as const,
}

export const SWIPE_THRESHOLD_RATIO = 0.3
export const SWIPE_VELOCITY_THRESHOLD = 650
