import BibleExperienceFixes from '@/components/biblia/BibleExperienceFixes'
import BibleSelectorPolish from '@/components/biblia/BibleSelectorPolish'
import BibleThemeRouteSync from '@/components/biblia/BibleThemeRouteSync'
import BibleVerseActionsNoFlash from '@/components/biblia/BibleVerseActionsNoFlash'
import BibleVerseActionsPersistent from '@/components/biblia/BibleVerseActionsPersistent'
import BottomNav from '@/components/layout/BottomNav'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <BibleThemeRouteSync />
      <BibleVerseActionsNoFlash />
      <BibleVerseActionsPersistent />
      <BibleSelectorPolish />
      <BibleExperienceFixes />
      <div className="flex-1 pb-16">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
