'use client'

import PastoralVisualWorkspaceV4 from '@/components/pastoral/PastoralVisualWorkspaceV4'
import PastoralTemplateRuntime from '@/components/pastoral/PastoralTemplateRuntime'
import { aplicarCatalogoAdministrado } from '@/components/pastoral/pastoral-template-admin-model'

export default function ProyectoContenidoWorkspace(props: any) {
  const { plantillasAdministradas, ...workspaceProps } = props
  const catalogo = aplicarCatalogoAdministrado(plantillasAdministradas)
  return <>
    <PastoralVisualWorkspaceV4 {...workspaceProps} />
    <PastoralTemplateRuntime catalogo={catalogo} />
  </>
}
