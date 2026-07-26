import BibleCompareAndActionsPolish from '@/components/biblia/BibleCompareAndActionsPolish'
import BibleExperienceFixes from '@/components/biblia/BibleExperienceFixes'
import BibleNotesPrefetch from '@/components/biblia/BibleNotesPrefetch'
import BibleSelectorPolish from '@/components/biblia/BibleSelectorPolish'
import BibleVerseActionsNoFlash from '@/components/biblia/BibleVerseActionsNoFlash'
import BibleVerseActionsPersistent from '@/components/biblia/BibleVerseActionsPersistent'
import BottomNav from '@/components/layout/BottomNav'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <BibleVerseActionsNoFlash />
      <BibleVerseActionsPersistent />
      <BibleNotesPrefetch />
      <BibleSelectorPolish />
      <BibleExperienceFixes />
      <BibleCompareAndActionsPolish />
      <div className="flex-1 pb-16">
        {/* pb-16 to account for the bottom nav height */}
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
