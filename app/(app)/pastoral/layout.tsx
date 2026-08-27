import PastoralEditorRuntimeEnhancements from '@/components/pastoral/PastoralEditorRuntimeEnhancements'
import PastoralElementsViewEnhancements from '@/components/pastoral/PastoralElementsViewEnhancements'
import './pastoral-visual-system.css'
import './pastoral-workspace-v2.css'
import './pastoral-editor-v3.css'
import './pastoral-editor-stable.css'
import './pastoral-editor-feedback-v13.css'
import './pastoral-editor-feedback-v14.css'
import './pastoral-editor-feedback-v15.css'
import './pastoral-editor-feedback-v16.css'

export default function PastoralLayout({ children }: { children: React.ReactNode }) {
  return <div className="pastoral-visual-system">{children}<PastoralEditorRuntimeEnhancements /><PastoralElementsViewEnhancements /></div>
}
