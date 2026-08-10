import ProgramacionUXEnhancer from '@/components/ministerios/ProgramacionUXEnhancer'

export default function ProgramacionMinisterialLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="programacion-ministerial min-h-screen bg-[#f5f5f7] pt-10 sm:pt-0">
      <ProgramacionUXEnhancer />
      {children}
    </div>
  )
}
