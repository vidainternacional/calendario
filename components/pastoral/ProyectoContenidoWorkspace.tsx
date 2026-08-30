'use client'

import PastoralVisualWorkspaceV4 from '@/components/pastoral/PastoralVisualWorkspaceV4'
import PastoralTemplateRuntime from '@/components/pastoral/PastoralTemplateRuntime'
import { aplicarCatalogoAdministrado } from '@/components/pastoral/pastoral-template-admin-model'

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

function esPaginaConMuestraLegadaRota(pagina: any) {
  const elementos = Array.isArray(pagina?.elementos) ? pagina.elementos : []
  if (elementos.length !== 1) return false
  const elemento = elementos[0]
  if (!elemento || elemento.tipo === 'imagen' || elemento.fondo_visual) return false
  const texto = textoPlanoLegado(elemento.contenido)
  return texto.includes('este es un texto de ejemplo')
    && texto.includes('para visualizar la composición')
    && texto.includes('de esta plantilla')
}

function limpiarMuestrasLegadasRotas(paquete: any) {
  if (!paquete || !Array.isArray(paquete.presentacion_diapositivas)) return paquete
  let cambio = false
  const paginas = paquete.presentacion_diapositivas.map((pagina: any) => {
    if (!esPaginaConMuestraLegadaRota(pagina)) return pagina
    cambio = true
    return { ...pagina, titulo: '', contenido: '', elementos: [] }
  })
  return cambio ? { ...paquete, presentacion_diapositivas: paginas } : paquete
}

export default function ProyectoContenidoWorkspace(props: any) {
  const { plantillasAdministradas, ...workspaceProps } = props
  const catalogo = aplicarCatalogoAdministrado(plantillasAdministradas)
  const paquete = limpiarMuestrasLegadasRotas(workspaceProps.paquete)
  return <>
    <PastoralVisualWorkspaceV4 {...workspaceProps} paquete={paquete} />
    <PastoralTemplateRuntime catalogo={catalogo} />
  </>
}
