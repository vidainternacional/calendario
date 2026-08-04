import PilotProfileTools from '@/components/pilot/PilotProfileTools'
import SolidarityProfileShortcut from '@/components/solidaridad/SolidarityProfileShortcut'

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f4f5f9]">
      {children}
      <div className="relative z-10 mx-auto -mt-[calc(5rem+env(safe-area-inset-bottom))] max-w-xl space-y-3 px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-6">
        <SolidarityProfileShortcut />
        <PilotProfileTools />
      </div>
    </div>
  )
}
