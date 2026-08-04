import type { ReactNode } from 'react'
import './analisis.css'

export default function AnalisisLayout({ children }: { children: ReactNode }) {
  return <div className="analisis-layout min-h-screen w-full overflow-x-hidden bg-[#eef0f6]">{children}</div>
}
