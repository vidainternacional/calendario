'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import SolidarityUnreadBadge from '@/components/solidaridad/SolidarityUnreadBadge'

const SELECTOR = 'a[href="/ayuda-solidaria"], a[href="/pastoral/ayuda-solidaria"]'

function sameTargets(current: HTMLAnchorElement[], next: HTMLAnchorElement[]) {
  return current.length === next.length && current.every((target, index) => target === next[index])
}

export default function SolidarityAccessBadgeSync() {
  const [targets, setTargets] = useState<HTMLAnchorElement[]>([])

  useEffect(() => {
    let frame = 0

    const sync = () => {
      frame = 0
      const next = Array.from(document.querySelectorAll<HTMLAnchorElement>(SELECTOR))
      next.forEach((element) => element.classList.add('relative'))
      setTargets((current) => sameTargets(current, next) ? current : next)
    }

    const scheduleSync = () => {
      if (frame) return
      frame = window.requestAnimationFrame(sync)
    }

    sync()
    const observer = new MutationObserver(scheduleSync)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <>
      {targets.map((target, index) => createPortal(
        <SolidarityUnreadBadge scope="all" className="absolute right-2 top-2 z-20" />,
        target,
        `${target.getAttribute('href') || 'ayuda'}:${index}`,
      ))}
    </>
  )
}
