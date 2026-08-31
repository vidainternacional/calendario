'use client'

import PastoralVisualWorkspaceV4 from '@/components/pastoral/PastoralVisualWorkspaceV4'
import {
  aplicarCatalogoAdministrado,
  type PlantillaAdministrada,
} from '@/components/pastoral/pastoral-template-admin-model'

function textoPlanoLegado(valor: unknown) {
  return String(valor ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/[•◦▪●]/g, ' ')
    .replace(/\.n\b/gi, '.')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function muestrasConocidas(catalogo: PlantillaAdministrada[]) {
  const conocidas = new Set([
    'título',
    'subtítulo',
    'escribe el contenido',
    'escribe aquí',
  ])

  catalogo.forEach((plantilla) => {
    conocidas.add(textoPlanoLegado(plantilla.nombre))
    conocidas.add(textoPlanoLegado(`Estilo ${plantilla.categoria.toLowerCase()}`))
    conocidas.add(textoPlanoLegado(`Composición ${plantilla.nombre.toLowerCase()}`))
    conocidas.add(textoPlanoLegado(plantilla.muestras.titulo))
    conocidas.add(textoPlanoLegado(plantilla.muestras.subtitulo))
    conocidas.add(textoPlanoLegado(plantilla.muestras.cuerpo))
  })

  return conocidas
}

function esPaginaConMuestraLegadaIncompleta(
  pagina: any,
  conocidas: Set<string>,
) {
  const elementos = Array.isArray(pagina?.elementos) ? pagina.elementos : []
  const textos = elementos.filter((elemento: any) =>
    elemento && elemento.tipo !== 'imagen' && !elemento.fondo_visual,
  )

  if (!textos.length || textos.length >= 3) return false

  return textos.every((elemento: any) => {
    const texto = textoPlanoLegado(elemento.contenido)
    return !texto || conocidas.has(texto)
  })
}

function limpiarMuestrasLegadasRotas(
  paquete: any,
  catalogo: PlantillaAdministrada[],
) {
  if (!paquete || !Array.isArray(paquete.presentacion_diapositivas)) return paquete

  const conocidas = muestrasConocidas(catalogo)
  let cambio = false

  const paginas = paquete.presentacion_diapositivas.map((pagina: any) => {
    if (!esPaginaConMuestraLegadaIncompleta(pagina, conocidas)) return pagina

    cambio = true
    const elementos = Array.isArray(pagina?.elementos)
      ? pagina.elementos.filter((elemento: any) => elemento?.tipo === 'imagen')
      : []

    return {
      ...pagina,
      titulo: '',
      contenido: '',
      elementos,
    }
  })

  return cambio ? { ...paquete, presentacion_diapositivas: paginas } : paquete
}

export default function ProyectoContenidoWorkspace(props: any) {
  const { plantillasAdministradas, ...workspaceProps } = props
  const catalogo = aplicarCatalogoAdministrado(plantillasAdministradas)
  const paquete = limpiarMuestrasLegadasRotas(workspaceProps.paquete, catalogo)

  return <>
    <PastoralVisualWorkspaceV4 {...workspaceProps} paquete={paquete} />
  </>
}
