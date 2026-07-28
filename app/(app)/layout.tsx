import BibleNotesInlinePolish from '@/components/biblia/BibleNotesInlinePolish'
import BibleUnifiedWorkspacePanels from '@/components/biblia/BibleUnifiedWorkspacePanels'
import BottomNav from '@/components/layout/BottomNav'
import PastoralEmbeddedBiblePolish from '@/components/pastoral/PastoralEmbeddedBiblePolish'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <BibleUnifiedWorkspacePanels />
      <BibleNotesInlinePolish />
      <PastoralEmbeddedBiblePolish />
      <div className="flex-1 pb-16">
        {/* pb-16 to account for the bottom nav height */}
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
