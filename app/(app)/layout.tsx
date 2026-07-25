import BottomNav from '@/components/layout/BottomNav'
import BibleSelectorPolish from '@/components/biblia/BibleSelectorPolish'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <BibleSelectorPolish />
      <div className="flex-1 pb-16">
        {/* pb-16 to account for the bottom nav height */}
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
