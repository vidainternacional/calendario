'use client'

import { useEffect } from 'react'
import { escaparHtmlCanvas } from '@/components/pastoral/pastoral-canvas-model'
import type { PlantillaAdministrada, RolPlantillaAdministrada } from '@/components/pastoral/pastoral-template-admin-model'

const ROLES: RolPlantillaAdministrada[] = ['titulo', 'subtitulo', 'cuerpo']
const normalizar = (valor: string) => valor.replace(/\s+/g, ' ').trim().toLowerCase()

function htmlMuestra(texto: string, interlineado: number) {
  const seguro = escaparHtmlCanvas(texto).replace(/\n/g, '<br>')
  return `<span data-vida-line-height="${interlineado}">${seguro}</span>`
}

export default function PastoralTemplateSampleRuntime({ catalogo }: { catalogo: PlantillaAdministrada[] }) {
  useEffect(() => {
    const conocidas = new Set<string>()
    catalogo.forEach((plantilla) => {
      conocidas.add(normalizar(plantilla.nombre))
      conocidas.add(normalizar(`Estilo ${plantilla.categoria.toLowerCase()}`))
      conocidas.add(normalizar(`Composición ${plantilla.nombre.toLowerCase()}`))
      ROLES.forEach((rol) => conocidas.add(normalizar(plantilla.muestras[rol])))
    })

    const tieneTextoUsuario = () => {
      const editores = Array.from(document.querySelectorAll<HTMLElement>('.pastoral-editor-v4 .pastoral-visual-canvas [data-canvas-text-role] [contenteditable="true"]'))
      return editores.some((editor) => {
        const texto = normalizar(editor.innerText || '')
        return Boolean(texto) && !conocidas.has(texto)
      })
    }

    const aplicarMuestras = (plantilla: PlantillaAdministrada) => {
      ROLES.forEach((rol) => {
        const contenedor = document.querySelector<HTMLElement>(`.pastoral-editor-v4 .pastoral-visual-canvas [data-canvas-text-role="${rol}"]`)
        const editor = contenedor?.querySelector<HTMLElement>('[contenteditable="true"]')
        if (!editor) return
        editor.innerHTML = htmlMuestra(plantilla.muestras[rol], plantilla[rol].interlineado)
        editor.dispatchEvent(new Event('input', { bubbles: true }))
      })
    }

    const alHacerClick = (event: MouseEvent) => {
      const objetivo = event.target instanceof Element ? event.target : null
      const boton = objetivo?.closest<HTMLButtonElement>('button')
      const grilla = boton?.closest<HTMLElement>('[aria-label="Plantillas en filas de tres"]')
      if (!boton || !grilla) return
      const botones = Array.from(grilla.querySelectorAll<HTMLButtonElement>(':scope > button'))
      const indice = botones.indexOf(boton) - 1
      const plantilla = catalogo[indice]
      if (!plantilla || tieneTextoUsuario()) return
      window.setTimeout(() => window.requestAnimationFrame(() => aplicarMuestras(plantilla)), 0)
    }

    document.addEventListener('click', alHacerClick, true)
    return () => document.removeEventListener('click', alHacerClick, true)
  }, [catalogo])

  return null
}
