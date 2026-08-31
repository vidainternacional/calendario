'use client'

import { useEffect } from 'react'
import { FONDOS_PASTORALES } from '@/components/pastoral/pastoral-background-catalog'
import { PALETAS_PRESENTACION, type PaletaPresentacion } from '@/components/pastoral/pastoral-editor-presets'

const normalizar = (valor: string) => valor.replace(/\s+/g, ' ').trim().toLowerCase()
const esHex = (valor: string) => /^#[0-9a-f]{6}$/i.test(valor)

function textoBoton(boton: HTMLButtonElement) {
  return normalizar(boton.textContent ?? '')
}

function contrasteHex(hex: string) {
  if (!esHex(hex)) return '#FFFFFF'
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  const luminancia = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return luminancia > 0.58 ? '#0F172A' : '#FFFFFF'
}

function categoriaFondo(fondo: PaletaPresentacion) {
  if (/^#[0-9a-f]{6}$/i.test(fondo.fondo)) return 'colores'
  const etiqueta = normalizar(fondo.label)
  if (['papel', 'lino', 'rayas', 'cuadrícula', 'diagonal', 'carbón', 'puntos'].some((token) => etiqueta.includes(token))) return 'texturas'
  if (fondo.fondo.startsWith('linear-gradient') && !fondo.fondo.includes('radial-gradient')) return 'degradados'
  return 'efectos'
}

export default function PastoralFondosRuntime() {
  useEffect(() => {
    let frame = 0
    let restauracionDinamica: (() => void) | null = null

    const root = () => document.querySelector<HTMLElement>('.pastoral-editor-v4')
    const dock = () => root()?.querySelector<HTMLElement>('[aria-label="Herramientas del lienzo"]') ?? null
    const panel = () => root()?.querySelector<HTMLElement>('aside[aria-label="Panel plantillas"], aside[aria-label="Panel fondos"]') ?? null
    const barraOpciones = () => panel()?.querySelector<HTMLElement>('[aria-label^="Opciones de "]') ?? null
    const botonesOpciones = () => Array.from(barraOpciones()?.querySelectorAll<HTMLButtonElement>(':scope > button') ?? [])

    const botonPrincipal = (nombre: string) => Array.from(dock()?.querySelectorAll<HTMLButtonElement>(':scope > button.pastoral-tool-button') ?? [])
      .find((boton) => normalizar(boton.getAttribute('aria-label') ?? boton.textContent ?? '') === normalizar(nombre)) ?? null

    const botonFondos = () => botonPrincipal('Fondos') ?? botonPrincipal('Plantillas')
    const botonTexto = () => botonPrincipal('Texto')
    const botonCapas = () => botonPrincipal('Capas')

    const botonOpcion = (nombre: 'plantillas' | 'temas' | 'imágenes') => {
      const indice = nombre === 'plantillas' ? 0 : nombre === 'temas' ? 1 : 2
      const porTexto = botonesOpciones().find((boton) => textoBoton(boton) === nombre)
      return porTexto ?? botonesOpciones()[indice] ?? null
    }

    const esperar = (accion: () => boolean, intentos = 24) => {
      let intento = 0
      const ejecutar = () => {
        if (accion()) return
        intento += 1
        if (intento < intentos) window.requestAnimationFrame(ejecutar)
      }
      ejecutar()
    }

    const volverAFondos = () => {
      const volver = botonOpcion('plantillas')
      volver?.click()
      window.requestAnimationFrame(programar)
    }

    const aplicarPaletaOculta = (paleta: PaletaPresentacion) => {
      botonOpcion('temas')?.click()
      esperar(() => {
        const grilla = root()?.querySelector<HTMLElement>('[aria-label="Temas en filas de tres"]')
        if (!grilla) return false
        const botones = Array.from(grilla.querySelectorAll<HTMLButtonElement>(':scope > button'))
        const indice = PALETAS_PRESENTACION.indexOf(paleta)
        const boton = indice >= 0 ? botones[indice] : botones.find((item) => normalizar(item.textContent ?? '') === normalizar(paleta.label))
        if (!boton) return false
        boton.click()
        restauracionDinamica?.()
        restauracionDinamica = null
        volverAFondos()
        return true
      })
    }

    const aplicarFondoDinamico = (fondo: string, texto: string, etiqueta: string) => {
      const paleta = PALETAS_PRESENTACION[0]
      if (!paleta) return
      const original = { ...paleta }
      paleta.fondo = fondo
      paleta.texto = texto
      paleta.titulo = texto
      paleta.acento = texto
      paleta.label = etiqueta
      restauracionDinamica = () => Object.assign(paleta, original)
      aplicarPaletaOculta(paleta)
    }

    const abrirBiblioteca = (subirDirecto: boolean) => {
      botonOpcion('imágenes')?.click()
      esperar(() => {
        const contenido = root()?.querySelector<HTMLElement>('.pastoral-elements-panel')
        if (!contenido) return false
        const botones = Array.from(contenido.querySelectorAll<HTMLButtonElement>('button'))
        const comoFondo = botones.find((boton) => textoBoton(boton) === 'como fondo')
        if (comoFondo?.getAttribute('aria-pressed') !== 'true') comoFondo?.click()
        if (subirDirecto) {
          const subir = botones.find((boton) => textoBoton(boton).includes('subir'))
          subir?.click()
          window.setTimeout(volverAFondos, 0)
        }
        return true
      })
    }

    const estilizarDock = () => {
      const contenedor = dock()
      const fondos = botonFondos()
      const texto = botonTexto()
      const capas = botonCapas()
      if (!contenedor || !fondos || !texto || !capas) return

      fondos.hidden = false
      fondos.style.display = ''
      fondos.removeAttribute('aria-hidden')
      fondos.tabIndex = 0
      fondos.setAttribute('aria-label', 'Fondos')
      fondos.title = 'Fondos'
      const etiqueta = fondos.querySelector('small')
      if (etiqueta) etiqueta.textContent = 'Fondos'

      const borrar = Array.from(contenedor.querySelectorAll<HTMLButtonElement>(':scope > button')).find((boton) => !boton.classList.contains('pastoral-tool-button')) ?? null
      contenedor.insertBefore(fondos, texto)
      contenedor.insertBefore(texto, capas)
      if (borrar) contenedor.insertBefore(capas, borrar)

      contenedor.style.display = 'grid'
      contenedor.style.gridTemplateColumns = 'repeat(3,minmax(0,1fr)) 44px'
      contenedor.style.gap = '8px'
      ;[fondos, texto, capas].forEach((boton) => {
        boton.style.gridColumn = 'auto'
        boton.style.width = '100%'
        boton.style.minWidth = '0'
      })
    }

    const tarjeta = (paleta: PaletaPresentacion) => {
      const boton = document.createElement('button')
      boton.type = 'button'
      boton.dataset.vidaFondoId = paleta.id
      boton.title = paleta.label
      boton.setAttribute('aria-label', `Aplicar fondo ${paleta.label}`)
      boton.style.display = 'grid'
      boton.style.gap = '5px'
      boton.style.minWidth = '0'
      boton.style.textAlign = 'center'

      const muestra = document.createElement('span')
      muestra.style.display = 'block'
      muestra.style.width = '100%'
      muestra.style.aspectRatio = '1 / 1'
      muestra.style.borderRadius = '18px'
      muestra.style.background = paleta.fondo
      muestra.style.boxShadow = 'inset 0 0 0 1px rgba(15,23,42,.08)'

      const nombre = document.createElement('small')
      nombre.textContent = paleta.label
      nombre.style.fontSize = '10px'
      nombre.style.fontWeight = '700'
      nombre.style.color = '#64748b'
      nombre.style.overflow = 'hidden'
      nombre.style.textOverflow = 'ellipsis'
      nombre.style.whiteSpace = 'nowrap'
      boton.append(muestra, nombre)
      boton.addEventListener('click', () => aplicarPaletaOculta(paleta))
      return boton
    }

    const seccionGaleria = (titulo: string, fondos: PaletaPresentacion[]) => {
      const seccion = document.createElement('section')
      seccion.style.display = 'grid'
      seccion.style.gap = '8px'
      const encabezado = document.createElement('strong')
      encabezado.textContent = titulo
      encabezado.style.fontSize = '11px'
      encabezado.style.color = '#475569'
      const grilla = document.createElement('div')
      grilla.style.display = 'grid'
      grilla.style.gridTemplateColumns = 'repeat(5,minmax(0,1fr))'
      grilla.style.gap = '10px'
      fondos.forEach((item) => grilla.appendChild(tarjeta(item)))
      seccion.append(encabezado, grilla)
      return seccion
    }

    const crearPanelFondos = () => {
      const aside = panel()
      if (!aside) return
      const opciones = barraOpciones()
      if (opciones) {
        opciones.style.display = 'none'
        opciones.setAttribute('aria-hidden', 'true')
      }
      aside.setAttribute('aria-label', 'Panel fondos')

      const original = aside.querySelector<HTMLElement>('.pastoral-panel-content')
      const esHost = Boolean(original?.querySelector('[aria-label="Plantillas en filas de tres"]'))
      if (!esHost) {
        const recursos = aside.querySelector<HTMLElement>('.pastoral-elements-panel')
        if (recursos && !recursos.querySelector('[data-vida-volver-fondos="true"]')) {
          const volver = document.createElement('button')
          volver.type = 'button'
          volver.dataset.vidaVolverFondos = 'true'
          volver.textContent = '← Fondos'
          volver.style.minHeight = '40px'
          volver.style.padding = '0 14px'
          volver.style.borderRadius = '9999px'
          volver.style.border = '1px solid #e2e8f0'
          volver.style.background = '#fff'
          volver.style.fontSize = '12px'
          volver.style.fontWeight = '800'
          volver.style.color = '#475569'
          volver.addEventListener('click', volverAFondos)
          recursos.prepend(volver)
        }
        return
      }

      if (original) original.style.display = 'none'
      const host = aside.querySelector<HTMLElement>('[data-vida-panel-fondos="true"]')
      if (host) return

      const contenedor = document.createElement('div')
      contenedor.dataset.vidaPanelFondos = 'true'
      contenedor.style.display = 'grid'
      contenedor.style.gap = '18px'
      contenedor.style.padding = '2px 0 8px'

      const cabecera = document.createElement('div')
      cabecera.innerHTML = '<strong style="display:block;font-size:14px;color:#0f172a">Fondos</strong><small style="font-size:11px;color:#64748b">Color, degradado, textura, efecto o imagen.</small>'

      const color = document.createElement('section')
      color.style.display = 'grid'
      color.style.gap = '8px'
      const tituloColor = document.createElement('strong')
      tituloColor.textContent = 'Color personalizado'
      tituloColor.style.fontSize = '11px'
      tituloColor.style.color = '#475569'
      const filaColor = document.createElement('div')
      filaColor.style.display = 'grid'
      filaColor.style.gridTemplateColumns = '54px minmax(0,1fr) auto'
      filaColor.style.gap = '8px'
      filaColor.style.alignItems = 'center'
      const selector = document.createElement('input')
      selector.type = 'color'
      selector.value = '#ffffff'
      selector.setAttribute('aria-label', 'Selector completo de color de fondo')
      selector.style.width = '54px'
      selector.style.height = '44px'
      selector.style.padding = '2px'
      selector.style.border = '1px solid #e2e8f0'
      selector.style.borderRadius = '12px'
      selector.style.background = '#fff'
      const hex = document.createElement('input')
      hex.value = '#FFFFFF'
      hex.maxLength = 7
      hex.setAttribute('aria-label', 'Código hexadecimal del fondo')
      hex.style.minHeight = '44px'
      hex.style.minWidth = '0'
      hex.style.border = '1px solid #e2e8f0'
      hex.style.borderRadius = '12px'
      hex.style.padding = '0 12px'
      hex.style.fontSize = '12px'
      hex.style.fontWeight = '700'
      const aplicar = document.createElement('button')
      aplicar.type = 'button'
      aplicar.textContent = 'Aplicar'
      aplicar.style.minHeight = '44px'
      aplicar.style.padding = '0 14px'
      aplicar.style.borderRadius = '9999px'
      aplicar.style.background = '#4f46e5'
      aplicar.style.color = '#fff'
      aplicar.style.fontSize = '12px'
      aplicar.style.fontWeight = '800'
      selector.addEventListener('input', () => { hex.value = selector.value.toUpperCase() })
      hex.addEventListener('input', () => { if (esHex(hex.value)) selector.value = hex.value })
      aplicar.addEventListener('click', () => {
        const valor = esHex(hex.value) ? hex.value.toUpperCase() : selector.value.toUpperCase()
        aplicarFondoDinamico(valor, contrasteHex(valor), 'Color personalizado')
      })
      filaColor.append(selector, hex, aplicar)
      color.append(tituloColor, filaColor)

      const degradado = document.createElement('section')
      degradado.style.display = 'grid'
      degradado.style.gap = '8px'
      const tituloDegradado = document.createElement('strong')
      tituloDegradado.textContent = 'Crear degradado'
      tituloDegradado.style.fontSize = '11px'
      tituloDegradado.style.color = '#475569'
      const controles = document.createElement('div')
      controles.style.display = 'grid'
      controles.style.gridTemplateColumns = '46px 46px minmax(90px,1fr) auto'
      controles.style.gap = '8px'
      controles.style.alignItems = 'center'
      const colorA = document.createElement('input')
      colorA.type = 'color'
      colorA.value = '#1D4ED8'
      colorA.setAttribute('aria-label', 'Primer color del degradado')
      const colorB = document.createElement('input')
      colorB.type = 'color'
      colorB.value = '#7C3AED'
      colorB.setAttribute('aria-label', 'Segundo color del degradado')
      ;[colorA, colorB].forEach((input) => {
        input.style.width = '46px'
        input.style.height = '42px'
        input.style.padding = '2px'
        input.style.border = '1px solid #e2e8f0'
        input.style.borderRadius = '12px'
        input.style.background = '#fff'
      })
      const angulo = document.createElement('input')
      angulo.type = 'range'
      angulo.min = '0'
      angulo.max = '360'
      angulo.value = '135'
      angulo.setAttribute('aria-label', 'Ángulo del degradado')
      const aplicarDegradado = document.createElement('button')
      aplicarDegradado.type = 'button'
      aplicarDegradado.textContent = 'Aplicar'
      aplicarDegradado.style.minHeight = '42px'
      aplicarDegradado.style.padding = '0 12px'
      aplicarDegradado.style.borderRadius = '9999px'
      aplicarDegradado.style.background = '#4f46e5'
      aplicarDegradado.style.color = '#fff'
      aplicarDegradado.style.fontSize = '12px'
      aplicarDegradado.style.fontWeight = '800'
      aplicarDegradado.addEventListener('click', () => {
        const fondo = `linear-gradient(${angulo.value}deg,${colorA.value},${colorB.value})`
        const textoA = contrasteHex(colorA.value)
        const textoB = contrasteHex(colorB.value)
        aplicarFondoDinamico(fondo, textoA === '#FFFFFF' || textoB === '#FFFFFF' ? '#FFFFFF' : '#0F172A', 'Degradado personalizado')
      })
      controles.append(colorA, colorB, angulo, aplicarDegradado)
      degradado.append(tituloDegradado, controles)

      const colores = FONDOS_PASTORALES.filter((item) => categoriaFondo(item) === 'colores')
      const degradados = FONDOS_PASTORALES.filter((item) => categoriaFondo(item) === 'degradados')
      const texturas = FONDOS_PASTORALES.filter((item) => categoriaFondo(item) === 'texturas')
      const efectos = FONDOS_PASTORALES.filter((item) => categoriaFondo(item) === 'efectos')

      const imagen = document.createElement('section')
      imagen.style.display = 'grid'
      imagen.style.gap = '8px'
      const tituloImagen = document.createElement('strong')
      tituloImagen.textContent = 'Imagen de fondo'
      tituloImagen.style.fontSize = '11px'
      tituloImagen.style.color = '#475569'
      const accionesImagen = document.createElement('div')
      accionesImagen.style.display = 'grid'
      accionesImagen.style.gridTemplateColumns = '1fr 1fr'
      accionesImagen.style.gap = '8px'
      const subir = document.createElement('button')
      subir.type = 'button'
      subir.textContent = 'Subir imagen'
      const biblioteca = document.createElement('button')
      biblioteca.type = 'button'
      biblioteca.textContent = 'Biblioteca'
      ;[subir, biblioteca].forEach((boton) => {
        boton.style.minHeight = '44px'
        boton.style.border = '1px solid #e2e8f0'
        boton.style.borderRadius = '9999px'
        boton.style.background = '#fff'
        boton.style.fontSize = '12px'
        boton.style.fontWeight = '800'
        boton.style.color = '#475569'
      })
      subir.addEventListener('click', () => abrirBiblioteca(true))
      biblioteca.addEventListener('click', () => abrirBiblioteca(false))
      accionesImagen.append(subir, biblioteca)
      imagen.append(tituloImagen, accionesImagen)

      contenedor.append(
        cabecera,
        color,
        seccionGaleria('Paleta de colores', colores),
        degradado,
        seccionGaleria('Degradados', degradados),
        seccionGaleria('Texturas', texturas),
        seccionGaleria('Efectos', efectos),
        imagen,
      )
      original?.insertAdjacentElement('afterend', contenedor)
    }

    const sincronizar = () => {
      estilizarDock()
      const fondos = botonFondos()
      if (fondos?.getAttribute('aria-expanded') === 'true') crearPanelFondos()
    }

    const programar = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(sincronizar)
    }

    const observador = new MutationObserver(programar)
    observador.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-expanded', 'aria-pressed'] })
    document.addEventListener('click', programar, true)
    programar()

    return () => {
      window.cancelAnimationFrame(frame)
      observador.disconnect()
      document.removeEventListener('click', programar, true)
      restauracionDinamica?.()
    }
  }, [])

  return null
}
