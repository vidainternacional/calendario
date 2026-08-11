import ProgramacionUXEnhancer from '@/components/ministerios/ProgramacionUXEnhancer'

export default function ProgramacionMinisterialLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div id="programacion-ministerial-root" className="programacion-ministerial min-h-screen bg-[#f5f5f7] pt-16 sm:pt-0">
      <ProgramacionUXEnhancer />
      {children}
    </div>
  )
}
