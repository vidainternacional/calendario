import BibleThemeRouteSync from '@/components/biblia/BibleThemeRouteSync'
import BibleVerseActionsNoFlash from '@/components/biblia/BibleVerseActionsNoFlash'
import BibleVerseActionsPersistent from '@/components/biblia/BibleVerseActionsPersistent'
import BottomNav from '@/components/layout/BottomNav'
import PushSubscriptionSync from '@/components/pwa/PushSubscriptionSync'
import MisServiciosShortcut from '@/components/inicio/MisServiciosShortcut'
import PendingAttentionShortcut from '@/components/notificaciones/PendingAttentionShortcut'
import SolidarityAccessBadgeSync from '@/components/solidaridad/SolidarityAccessBadgeSync'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <PushSubscriptionSync />
      <BibleThemeRouteSync />
      <BibleVerseActionsNoFlash />
      <BibleVerseActionsPersistent />
      <SolidarityAccessBadgeSync />
      <div className="flex-1 pb-16">
        {children}
      </div>
      <MisServiciosShortcut />
      <PendingAttentionShortcut />
      <BottomNav />
    </div>
  )
}
