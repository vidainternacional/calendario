import type { ReactNode } from 'react'

export default function AnalisisLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen w-full overflow-x-hidden bg-[#eef0f6]">{children}</div>
}
