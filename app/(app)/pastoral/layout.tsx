import './pastoral-visual-system.css'
import './pastoral-workspace-v2.css'
import './pastoral-editor-minimal.css'

export default function PastoralLayout({ children }: { children: React.ReactNode }) {
  return <div className="pastoral-visual-system">{children}</div>
}
