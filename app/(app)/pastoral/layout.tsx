import './pastoral-visual-system.css'
import './pastoral-workspace-v2.css'
import './pastoral-editor-minimal.css'
import './pastoral-editor-structure.css'
import './pastoral-editor-hierarchy-v2.css'
import './pastoral-editor-compact-mobile.css'
import './pastoral-editor-fixed-workspace.css'
import './pastoral-editor-v3.css'
import './pastoral-editor-v3-reset.css'
import './pastoral-editor-capcut.css'
import './pastoral-editor-capcut-v2.css'
import './pastoral-editor-elegance-v4.css'
import './pastoral-editor-elegance-v4-final.css'

export default function PastoralLayout({ children }: { children: React.ReactNode }) {
  return <div className="pastoral-visual-system">{children}</div>
}
