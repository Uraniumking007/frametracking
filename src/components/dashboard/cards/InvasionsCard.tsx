import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ExpandableCard } from '@/components/ui/expandable-card'
import { useQuery } from '@tanstack/react-query'
import { fetchInvasions, Platform } from '@/lib/warframe/api'
import { useSearch } from '@tanstack/react-router'

export function InvasionsCard({ full = false }: { full?: boolean }) {
  const search = useSearch({ strict: false }) as { platform?: Platform }
  const platform = (search.platform ?? 'pc') as Platform
  const invasions = useQuery({
    queryKey: ['wf', platform, 'invasions'],
    queryFn: () => fetchInvasions(platform),
    staleTime: 3 * 60_000, // 3 minutes - invasions change moderately
  })
  return (
    <ExpandableCard
      title="Ongoing Invasions"
      expanded={
        <InvasionsExpanded
          isLoading={invasions.isLoading}
          data={invasions.data}
        />
      }
    >
      <Card className="group hover:shadow-xl transition-all duration-300 border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm hover:from-slate-800/70 hover:to-slate-900/70 flex flex-col h-72 md:h-80 overflow-hidden">
        <CardHeader className="px-4 border-b border-slate-700/30">
          <CardTitle className="flex items-center gap-2 text-white">
            <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
            Ongoing Invasions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          {invasions.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full bg-slate-700" />
              <Skeleton className="h-8 w-3/4 bg-slate-700" />
              <Skeleton className="h-8 w-2/3 bg-slate-700" />
            </div>
          ) : full ? (
            <InvasionsExpanded isLoading={false} data={invasions.data} />
          ) : (
            <InvasionsList items={invasions.data} limit={5} />
          )}
        </CardContent>
      </Card>
    </ExpandableCard>
  )
}

function InvasionsExpanded({
  isLoading,
  data,
}: {
  isLoading: boolean
  data?: any[]
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full bg-slate-700" />
        <Skeleton className="h-8 w-3/4 bg-slate-700" />
        <Skeleton className="h-8 w-2/3 bg-slate-700" />
      </div>
    )
  }
  return <InvasionsList items={data} />
}

function InvasionsList({ items, limit }: { items?: any[]; limit?: number }) {
  const rows = items || []
  const slice = typeof limit === 'number' ? rows.slice(0, limit) : rows

  return (
    <div className="space-y-3">
      {slice.map((inv: any, index: number) => {
        // Calculate completion percentage based on Count and Goal
        let percent: number | undefined = undefined
        try {
          const count = Number(inv.Count || 0)
          const goal = Number(inv.Goal || 0)
          if (Number.isFinite(count) && Number.isFinite(goal) && goal > 0) {
            // For negative counts (infested winning), calculate based on absolute values
            const absCount = Math.abs(count)
            percent = Math.max(
              0,
              Math.min(100, Math.round((absCount / goal) * 100)),
            )
          }
        } catch {}

        return (
          <div
            key={inv._id?.$oid || inv.id || `invasion-${index}`}
            className="p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors border border-slate-600/30"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-200 truncate">
                {inv.resolvedNodeLabel || String(inv.Node || inv.node || '')}
              </span>
              <Badge
                variant={inv.Completed ? 'secondary' : 'default'}
                className={`text-xs ${inv.Completed ? 'bg-slate-500/20 text-slate-300 border-slate-400/30' : 'bg-pink-500/20 text-pink-300 border-pink-400/30'}`}
              >
                {inv.Completed ? 'Completed' : 'Active'}
              </Badge>
            </div>
            {(inv.resolvedAttackerFaction || inv.resolvedDefenderFaction) && (
              <div className="text-[11px] text-slate-400 mb-2">
                {inv.resolvedAttackerFaction
                  ? `Atk: ${inv.resolvedAttackerFaction}`
                  : ''}
                {inv.resolvedAttackerFaction && inv.resolvedDefenderFaction
                  ? ' • '
                  : ''}
                {inv.resolvedDefenderFaction
                  ? `Def: ${inv.resolvedDefenderFaction}`
                  : ''}
              </div>
            )}
            {inv.resolvedRewardText && (
              <div
                className="text-[11px] text-slate-300 mb-2 truncate"
                title={inv.resolvedRewardText}
              >
                {inv.resolvedRewardText.length > 90
                  ? `${inv.resolvedRewardText.slice(0, 90)}…`
                  : inv.resolvedRewardText}
              </div>
            )}
            {typeof percent === 'number' ? (
              <div>
                <div className="h-2 w-full bg-slate-600/40 rounded overflow-hidden">
                  <div
                    className="h-2 bg-gradient-to-r from-pink-500 to-rose-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  {percent}% ({inv.Count || 0}/{inv.Goal || 0})
                </div>
              </div>
            ) : (
              inv.Count && (
                <div className="text-[11px] text-slate-400">
                  Progress: {inv.Count}/{inv.Goal || 'N/A'}
                </div>
              )
            )}
          </div>
        )
      })}
    </div>
  )
}

