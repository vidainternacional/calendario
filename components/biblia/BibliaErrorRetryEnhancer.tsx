'use client'

import { useEffect } from 'react'

const ERROR_MESSAGES = [
  'No se pudo conectar con la biblioteca bíblica.',
  'No se pudieron cargar los libros.',
  'No se pudo cargar el capítulo.',
]

export default function BibliaErrorRetryEnhancer() {
  useEffect(() => {
    const enhance = () => {
      const paragraphs = Array.from(document.querySelectorAll('main p'))
      const errorParagraph = paragraphs.find(node =>
        ERROR_MESSAGES.includes(node.textContent?.trim() ?? '')
      )

      if (!errorParagraph || errorParagraph.dataset.retryEnhanced === 'true') return

      const message = errorParagraph.textContent?.trim() || 'No se pudo cargar el contenido.'
      const container = document.createElement('div')
      container.setAttribute('role', 'alert')
      container.className = 'my-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-6 text-center'

      const icon = document.createElement('div')
      icon.className = 'mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-rose-500 shadow-sm'
      icon.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>'

      const title = document.createElement('p')
      title.className = 'mt-3 text-sm font-bold text-rose-800'
      title.textContent = message

      const description = document.createElement('p')
      description.className = 'mx-auto mt-1 max-w-sm text-xs leading-5 text-rose-600'
      description.textContent = 'Revisa tu conexión e intenta cargar nuevamente. Conservaremos tu última posición de lectura.'

      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm active:scale-[0.98]'
      button.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg><span>Intentar de nuevo</span>'
      button.addEventListener('click', () => window.location.reload())

      container.append(icon, title, description, button)
      errorParagraph.dataset.retryEnhanced = 'true'
      errorParagraph.replaceWith(container)
    }

    enhance()
    const observer = new MutationObserver(enhance)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return null
}
