import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ExpandableCard } from '@/components/ui/expandable-card'
import { useTimeRemaining } from '@/hooks/use-time'
import { fetchCycles, Platform } from '@/lib/warframe/api'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearch } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export function CyclesCard() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Don't render anything during SSR
  if (!isClient) {
    return (
      <ExpandableCard title="Open World Cycles">
        <Card className="group hover:shadow-xl transition-all duration-300 border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm hover:from-slate-800/70 hover:to-slate-900/70 flex flex-col h-72 md:h-80 overflow-hidden">
          <CardHeader className="px-4 border-b border-slate-700/30">
            <CardTitle className="flex items-center gap-2 text-white">
              <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
              Open World Cycles
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 bg-slate-700" />
                <Skeleton className="h-6 w-20 bg-slate-700" />
                <Skeleton className="h-6 w-24 bg-slate-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </ExpandableCard>
    )
  }

  return <CyclesCardClient />
}

function CyclesCardClient() {
  const search = useSearch({ strict: false }) as { platform?: Platform }
  const platform = (search.platform ?? 'pc') as Platform
  const cycles = useQuery({
    queryKey: ['wf', platform, 'cycles'],
    queryFn: () => fetchCycles(platform),
    staleTime: 15_000, // 15 seconds - cycles change every 2.5-4 hours but need precise timing
    refetchInterval: 15_000, // Refetch every 15 seconds for accurate countdowns
  })
  return (
    <ExpandableCard
      title="Open World Cycles"
      expanded={
        <CyclesExpanded
          isLoading={cycles.isLoading}
          data={cycles.data}
          platform={platform}
        />
      }
    >
      <Card className="group hover:shadow-xl transition-all duration-300 border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm hover:from-slate-800/70 hover:to-slate-900/70 flex flex-col h-72 md:h-80 overflow-hidden">
        <CardHeader className="px-4 border-b border-slate-700/30">
          <CardTitle className="flex items-center gap-2 text-white">
            <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
            Open World Cycles
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          {cycles.isLoading ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 bg-slate-700" />
                <Skeleton className="h-6 w-20 bg-slate-700" />
                <Skeleton className="h-6 w-24 bg-slate-700" />
              </div>
            </div>
          ) : (
            <CyclesList data={cycles.data} platform={platform} />
          )}
        </CardContent>
      </Card>
    </ExpandableCard>
  )
}

function CyclesExpanded({
  isLoading,
  data,
  platform,
}: {
  isLoading: boolean
  data?: any
  platform: Platform
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24 bg-slate-700" />
          <Skeleton className="h-6 w-24 bg-slate-700" />
          <Skeleton className="h-6 w-28 bg-slate-700" />
        </div>
      </div>
    )
  }
  return <CyclesList data={data} platform={platform} />
}

function CyclesList({ data, platform }: { data?: any; platform: Platform }) {
  const qc = useQueryClient()
  // Use the time hook for active time updates
  const vallisTimeLeft = useTimeRemaining(data?.vallis?.expiry)
  const cetusTimeLeft = useTimeRemaining(data?.cetus?.expiry)
  const cambionTimeLeft = useTimeRemaining(data?.cambion?.expiry)

  if (
    vallisTimeLeft === '0m 0s' ||
    cetusTimeLeft === '0m 0s' ||
    cambionTimeLeft === '0m 0s'
  ) {
    qc.invalidateQueries({ queryKey: ['wf', platform, 'cycles'] })
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      <CycleRow
        dotClass="bg-blue-400"
        title="Cetus (Earth)"
        state={data?.cetus?.state}
        timeLeft={cetusTimeLeft || data?.cetus?.timeLeft}
      />
      <CycleRow
        dotClass="bg-cyan-400"
        title="Orb Vallis (Venus)"
        state={data?.vallis?.state}
        timeLeft={vallisTimeLeft}
      />
      <CycleRow
        dotClass="bg-purple-400"
        title="Cambion Drift (Deimos)"
        state={data?.cambion?.state}
        timeLeft={cambionTimeLeft || data?.cambion?.timeLeft}
      />
    </div>
  )
}

function CycleRow({
  dotClass,
  title,
  state,
  timeLeft,
}: {
  dotClass: string
  title: string
  state?: string
  timeLeft?: string
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/30">
      <div className={`w-3 h-3 ${dotClass} rounded-full`}></div>
      <div className="flex-1">
        <div className="text-sm font-medium text-slate-200">{title}</div>
        <div className="text-xs text-slate-400 capitalize">
          {state || 'Unknown'}
          {timeLeft && <span className="ml-2">• {timeLeft}</span>}
        </div>
      </div>
    </div>
  )
}

