'use client'

import { useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'

function texto(elemento: Element | null) {
  return (elemento?.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function nombreCompleto(opcion: HTMLOptionElement | undefined, fallback: string) {
  return opcion?.textContent?.trim() || fallback
}

function copiarValor(origen: HTMLSelectElement, destino: HTMLSelectElement) {
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set
  setter?.call(destino, origen.value)
  destino.dispatchEvent(new Event('change', { bubbles: true }))
}

export default function BibleCompareDualSelectors() {
  const pathname = usePathname()

  useLayoutEffect(() => {
    if (pathname !== '/biblia') return

    let limpiando = false

    const aplicar = () => {
      if (limpiando) return

      const compararActivo = Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
        .some((boton) => texto(boton) === 'Comparar' && boton.className.includes('bg-violet-600'))

      const bloqueExistente = document.querySelector<HTMLElement>('[data-vida-dual-selectors="true"]')
      if (!compararActivo) {
        bloqueExistente?.remove()
        return
      }

      const principal = Array.from(document.querySelectorAll<HTMLSelectElement>('select'))
        .find((select) => /versi[oó]n de la biblia/i.test(select.getAttribute('aria-label') ?? ''))
      const etiquetaSecundaria = Array.from(document.querySelectorAll<HTMLLabelElement>('label'))
        .find((label) => /segunda traducci[oó]n|biblia 2/i.test(texto(label)))
      const secundaria = etiquetaSecundaria?.querySelector<HTMLSelectElement>('select') ?? null
      const zona = etiquetaSecundaria?.closest<HTMLElement>('div.p-5') ?? etiquetaSecundaria?.parentElement ?? null

      if (!principal || !secundaria || !zona) return

      etiquetaSecundaria.style.display = 'none'

      let bloque = zona.querySelector<HTMLElement>('[data-vida-dual-selectors="true"]')
      if (!bloque) {
        bloque = document.createElement('section')
        bloque.dataset.vidaDualSelectors = 'true'
        bloque.className = 'mb-5 grid grid-cols-2 gap-3'
        zona.prepend(bloque)
      }

      const crearCampo = (id: '1' | '2', original: HTMLSelectElement) => {
        const label = document.createElement('label')
        label.dataset.vidaBibleField = id
        label.className = 'min-w-0'

        const titulo = document.createElement('span')
        titulo.className = 'mb-1.5 block text-xs font-bold opacity-70'
        titulo.textContent = `Biblia ${id}`

        const select = original.cloneNode(true) as HTMLSelectElement
        select.dataset.vidaBibleSelect = id
        select.setAttribute('aria-label', `Biblia ${id}`)
        select.className = original.className
        select.style.width = '100%'
        select.style.minHeight = '44px'
        select.value = original.value
        select.title = nombreCompleto(original.options[original.selectedIndex], `Biblia ${id}`)
        select.addEventListener('change', () => copiarValor(select, original))

        label.append(titulo, select)
        return label
      }

      const selector1 = bloque.querySelector<HTMLSelectElement>('[data-vida-bible-select="1"]')
      const selector2 = bloque.querySelector<HTMLSelectElement>('[data-vida-bible-select="2"]')

      if (!selector1 || !selector2) {
        bloque.innerHTML = ''
        bloque.append(crearCampo('1', principal), crearCampo('2', secundaria))
      } else {
        if (selector1.options.length !== principal.options.length) selector1.innerHTML = principal.innerHTML
        if (selector2.options.length !== secundaria.options.length) selector2.innerHTML = secundaria.innerHTML
        selector1.value = principal.value
        selector2.value = secundaria.value
        selector1.title = nombreCompleto(principal.options[principal.selectedIndex], 'Biblia 1')
        selector2.title = nombreCompleto(secundaria.options[secundaria.selectedIndex], 'Biblia 2')
      }

      const nombre1 = nombreCompleto(principal.options[principal.selectedIndex], 'Biblia 1')
      const nombre2 = nombreCompleto(secundaria.options[secundaria.selectedIndex], 'Biblia 2')
      zona.querySelectorAll<HTMLElement>('article').forEach((article) => {
        const columnas = Array.from(article.children)
          .filter((elemento): elemento is HTMLElement => elemento instanceof HTMLElement && elemento.tagName === 'DIV')
        if (columnas.length < 2) return
        const rotulo1 = columnas[0].querySelector<HTMLElement>('p')
        const rotulo2 = columnas[1].querySelector<HTMLElement>('p')
        if (rotulo1) { rotulo1.textContent = nombre1; rotulo1.title = nombre1 }
        if (rotulo2) { rotulo2.textContent = nombre2; rotulo2.title = nombre2 }
      })
    }

    const observer = new MutationObserver(aplicar)
    observer.observe(document.body, { childList: true, subtree: true })
    const timer = window.setInterval(aplicar, 250)
    aplicar()

    return () => {
      limpiando = true
      observer.disconnect()
      window.clearInterval(timer)
      document.querySelector('[data-vida-dual-selectors="true"]')?.remove()
    }
  }, [pathname])

  return null
}
