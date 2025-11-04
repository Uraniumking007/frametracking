import { createFileRoute, useSearch } from '@tanstack/react-router'
import type { Platform } from '@/lib/warframe/api'
import { useEffect, useState } from 'react'
import { useDashboardPrefs } from '@/lib/store/dashboardPrefs'
import { NewsCard } from '@/components/dashboard/cards/NewsCard'
import { ArbitrationCard } from '@/components/dashboard/cards/ArbitrationCard'
import { AlertsCard } from '@/components/dashboard/cards/AlertsCard'
import { EventsCard } from '@/components/dashboard/cards/EventsCard'
import { NormalFissuresCard } from '@/components/dashboard/cards/NormalFissuresCard'
import { SteelPathFissuresCard } from '@/components/dashboard/cards/SteelPathFissuresCard'
import { BountiesCard } from '@/components/dashboard/cards/BountiesCard'
import { SteelPathIncursionsCard } from '@/components/dashboard/cards/SteelPathIncursionsCard'
import { SortieCard } from '@/components/dashboard/cards/SortieCard'
import { ArchonCard } from '@/components/dashboard/cards/ArchonCard'
import { InvasionsCard } from '@/components/dashboard/cards/InvasionsCard'
import { CyclesCard } from '@/components/dashboard/cards/CyclesCard'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Don't render anything during SSR to avoid router hook issues
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Loading...</h1>
            <div className="animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-1/4 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <DashboardClient />
}

function DashboardClient() {
  const prefs = useDashboardPrefs()
  const search = useSearch({ strict: false }) as { platform?: Platform }
  const platform = (search.platform ?? 'pc') as Platform

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>
      {/* Main Dashboard Grid */}
      <div className="p-4 sm:p-6">
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {prefs.showNews && <NewsCard platform={platform} />}

          {prefs.showArbitration && <ArbitrationCard />}

          {prefs.showAlerts && <AlertsCard platform={platform} />}

          {prefs.showEvents && <EventsCard />}

          {prefs.showFissures && <NormalFissuresCard />}

          {prefs.showFissures && <SteelPathFissuresCard />}

          {prefs.showBounties && <BountiesCard />}
          {prefs.showBounties && <SteelPathIncursionsCard />}

          {prefs.showSortie && <SortieCard platform={platform} />}

          {prefs.showArchon && <ArchonCard />}

          {prefs.showInvasions && <InvasionsCard />}

          {prefs.showCycles && <CyclesCard />}
        </div>
      </div>
    </div>
  )
}
