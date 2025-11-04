import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ExpandableCard } from '@/components/ui/expandable-card'
import {
  safeText,
  resolveNodeLabel,
  resolveMissionType,
} from '@/lib/helpers/helpers'
import { fetchArchonHunt } from '@/lib/warframe/api'
import { useQuery } from '@tanstack/react-query'
import { Platform } from '@/lib/warframe/api'
import { useSearch } from '@tanstack/react-router'

export function ArchonCard({ full = false }: { full?: boolean }) {
  const search = useSearch({ strict: false }) as { platform?: Platform }
  const platform = (search.platform ?? 'pc') as Platform
  const archon = useQuery({
    queryKey: ['wf', platform, 'archonHunt'],
    queryFn: () => fetchArchonHunt(platform),
    staleTime: 15 * 60_000, // 15 minutes - archon hunt changes weekly
  })
  return (
    <ExpandableCard
      title="Weekly Archon Hunt"
      expanded={
        <ArchonExpanded isLoading={archon.isLoading} data={archon.data} />
      }
    >
      <Card className="group hover:shadow-xl transition-all duration-300 border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm hover:from-slate-800/70 hover:to-slate-900/70 flex flex-col h-72 md:h-80 overflow-hidden">
        <CardHeader className="px-4 border-b border-slate-700/30">
          <CardTitle className="flex items-center gap-2 text-white">
            <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
            Weekly Archon Hunt
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          {archon.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4 bg-slate-700" />
              <Skeleton className="h-4 w-2/3 bg-slate-700" />
              <Skeleton className="h-4 w-1/2 bg-slate-700" />
            </div>
          ) : full ? (
            <ArchonExpanded isLoading={false} data={archon.data} />
          ) : (
            <ArchonList missions={archon.data?.missions} limit={3} />
          )}
        </CardContent>
      </Card>
    </ExpandableCard>
  )
}

function ArchonExpanded({
  isLoading,
  data,
}: {
  isLoading: boolean
  data?: any
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-3/4 bg-slate-700" />
        <Skeleton className="h-4 w-2/3 bg-slate-700" />
        <Skeleton className="h-4 w-1/2 bg-slate-700" />
      </div>
    )
  }
  return <ArchonList missions={data?.missions} />
}

function ArchonList({ missions, limit }: { missions?: any[]; limit?: number }) {
  const list = Array.isArray(missions) ? missions : []
  const slice = typeof limit === 'number' ? list.slice(0, limit) : list
  return (
    <div className="space-y-3">
      {slice.map((m: any, i: number) => (
        <ArchonMissionItem key={i} mission={m} index={i} />
      ))}
    </div>
  )
}

function ArchonMissionItem({
  mission,
  index,
}: {
  mission: any
  index: number
}) {
  const nodeLabel = mission.resolvedNodeLabel || mission.node || 'Unknown Node'

  return (
    <div className="p-3 rounded-lg mr-6 bg-slate-700/30 hover:bg-slate-700/50 transition-colors border border-slate-600/30">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-slate-200">
          Mission {index + 1}
        </span>
        <Badge
          variant="secondary"
          className="bg-indigo-500/20 text-indigo-300 border-indigo-400/30 text-xs"
        >
          {resolveMissionType(safeText(mission.missionType) || '')}
        </Badge>
      </div>
      <div className="text-sm text-slate-300">{nodeLabel}</div>
    </div>
  )
}

