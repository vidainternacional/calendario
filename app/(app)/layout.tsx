import BibleCompareAllVersions from '@/components/biblia/BibleCompareAllVersions'
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
    <div className="vida-app-shell flex min-h-screen flex-col">
      <BibleVerseActionsNoFlash />
      <BibleVerseActionsPersistent />
      <BibleNotesPrefetch />
      <BibleSelectorPolish />
      <BibleExperienceFixes />
      <BibleCompareAndActionsPolish />
      <BibleCompareAllVersions />
      <div className="vida-app-content flex-1 pb-16">
        {/* pb-16 to account for the bottom nav height */}
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
