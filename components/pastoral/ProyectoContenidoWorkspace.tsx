'use client'

import '@/components/pastoral/pastoral-background-catalog'
import PastoralVisualWorkspaceV4 from '@/components/pastoral/PastoralVisualWorkspaceV4'
import PastoralFondosRuntime from '@/components/pastoral/PastoralFondosRuntime'

export default function ProyectoContenidoWorkspace(props: any) {
  const { plantillasAdministradas: _plantillasAdministradas, ...workspaceProps } = props
  void _plantillasAdministradas

  return <>
    <PastoralVisualWorkspaceV4 {...workspaceProps} />
    <PastoralFondosRuntime />
  </>
}
