export default function ProgramacionMinisterialLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#f5f5f7] pt-10 sm:pt-0">
      {children}
    </div>
  )
}
