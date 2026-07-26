import BibleCompareAndActionsPolish from '@/components/biblia/BibleCompareAndActionsPolish'
import BibleExperienceFixes from '@/components/biblia/BibleExperienceFixes'
import BibleNotesPrefetch from '@/components/biblia/BibleNotesPrefetch'
import BibleSelectorPolish from '@/components/biblia/BibleSelectorPolish'
import BibleVerseActionsNoFlash from '@/components/biblia/BibleVerseActionsNoFlash'
import BibleVerseActionsPersistent from '@/components/biblia/BibleVerseActionsPersistent'
import BottomNav from '@/components/layout/BottomNav'
import MobileFormPolish from '@/components/layout/MobileFormPolish'
import MobileTablePolish from '@/components/layout/MobileTablePolish'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <BibleVerseActionsNoFlash />
      <BibleVerseActionsPersistent />
      <BibleNotesPrefetch />
      <BibleSelectorPolish />
      <BibleExperienceFixes />
      <BibleCompareAndActionsPolish />
      <MobileTablePolish />
      <MobileFormPolish />
      <div
        data-mobile-table-scope="true"
        data-mobile-form-scope="true"
        className="flex-1 pb-16"
      >
        {/* pb-16 to account for the bottom nav height */}
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
