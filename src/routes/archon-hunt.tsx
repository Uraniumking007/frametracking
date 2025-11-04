import { createFileRoute, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchArchonHunt, Platform } from '@/lib/warframe/api'
import { resolveMissionType, safeText } from '@/lib/helpers/helpers'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/archon-hunt')({
  component: ArchonHuntPage,
})

function ArchonHuntPage() {
  const search = useSearch({ strict: false }) as { platform?: Platform }
  const platform = (search.platform ?? 'pc') as Platform
  const archon = useQuery({
    queryKey: ['wf', platform, 'archonHunt'],
    queryFn: () => fetchArchonHunt(platform),
    staleTime: 15 * 60_000,
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="relative px-4 sm:px-6 py-6">
        <div className="mx-auto max-w-7xl">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Archon Hunt
            </h1>
            <p className="text-slate-400 text-sm">
              Weekly Archon Hunt details.
            </p>
          </header>
          <div className="space-y-4">
            {archon.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4 bg-slate-700" />
                <Skeleton className="h-4 w-2/3 bg-slate-700" />
                <Skeleton className="h-4 w-1/2 bg-slate-700" />
              </div>
            ) : (
              <ArchonHuntSteps data={archon.data} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ArchonHuntSteps({ data }: { data?: any }) {
  const missions: any[] = Array.isArray(data?.missions) ? data.missions : []
  if (!missions.length) {
    return (
      <div className="text-slate-400 text-sm">No Archon Hunt available.</div>
    )
  }
  return (
    <div className="space-y-3">
      {missions.map((m, i) => (
        <MissionStep key={i} mission={m} index={i} />
      ))}
    </div>
  )
}

function MissionStep({ mission, index }: { mission: any; index: number }) {
  const nodeLabel = mission.resolvedNodeLabel || mission.node || 'Unknown Node'
  const missionType = resolveMissionType(safeText(mission.missionType) || '')

  return (
    <div className="p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors border border-slate-600/30">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-slate-200">
          Mission {index + 1}
        </span>
        <Badge
          variant="secondary"
          className="bg-indigo-500/20 text-indigo-300 border-indigo-400/30 text-xs"
        >
          {missionType}
        </Badge>
      </div>
      <div className="text-sm text-slate-300">{nodeLabel}</div>
    </div>
  )
}
