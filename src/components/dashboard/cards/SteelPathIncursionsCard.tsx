import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ExpandableCard } from '@/components/ui/expandable-card'
import { SteelPathIncursion } from '@/server/warframe/spIncursions'
import { useQuery } from '@tanstack/react-query'

// Faction color mapping for visual indicators
const factionColors = {
  grineer: 'bg-red-500/20 text-red-300 border-red-400/30',
  corpus: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
  infested: 'bg-green-500/20 text-green-300 border-green-400/30',
  orokin: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
  narmer: 'bg-orange-500/20 text-orange-300 border-orange-400/30',
  crossfire: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
} as const

// Default color for unknown factions
const defaultFactionColor = 'bg-slate-500/20 text-slate-300 border-slate-400/30'

function getFactionColor(factionLabel: string): string {
  const normalizedFaction = factionLabel.toLowerCase()
  return (
    factionColors[normalizedFaction as keyof typeof factionColors] ||
    defaultFactionColor
  )
}

async function fetchSpIncursions(): Promise<SteelPathIncursion[]> {
  const res = await fetch('/api/warframe/sp-incursions-today')
  if (!res.ok) throw new Error('Failed to fetch SP incursions')
  return res.json()
}

export function SteelPathIncursionsCard({ full = false }: { full?: boolean }) {
  const spIncursions = useQuery({
    queryKey: ['browse', 'sp-incursions-today'],
    queryFn: fetchSpIncursions,
    staleTime: 15 * 60_000, // 15 minutes - SP incursions change daily
  })
  const data = spIncursions.data ?? []
  // Count active incursions for collapsed view
  const activeIncursionsCount = data.length || 0

  return (
    <ExpandableCard
      title={`Steel Path Incursions ${activeIncursionsCount > 0 ? `(${activeIncursionsCount})` : ''}`}
      expanded={
        <IncursionsExpanded isLoading={spIncursions.isLoading} data={data} />
      }
    >
      <Card className="group hover:shadow-xl transition-all duration-300 border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm hover:from-slate-800/70 hover:to-slate-900/70 flex flex-col h-72 md:h-80 overflow-hidden">
        <CardHeader className="px-4 border-b border-slate-700/30">
          <CardTitle className="flex items-center gap-2 text-white">
            <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
            Steel Path Incursions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          {spIncursions.isLoading ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 bg-slate-700" />
                <Skeleton className="h-6 w-24 bg-slate-700" />
                <Skeleton className="h-6 w-20 bg-slate-700" />
              </div>
            </div>
          ) : spIncursions.data && spIncursions.data.length > 0 ? (
            <IncursionsList
              data={spIncursions.data ?? []}
              limit={full ? undefined : spIncursions.data?.length || 0}
            />
          ) : (
            <div className="text-slate-400 text-sm text-center py-4">
              <div className="text-slate-400 text-sm mb-2">
                No active incursions
              </div>
              <div className="text-slate-500 text-xs">
                Check back later for new Steel Path activities
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </ExpandableCard>
  )
}

function IncursionsExpanded({
  isLoading,
  data,
}: {
  isLoading: boolean
  data?: SteelPathIncursion[]
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

  if (!data || data.length === 0) return null

  return <IncursionsList data={data} />
}

function IncursionsList({
  data,
  limit,
}: {
  data: SteelPathIncursion[]
  limit?: number
}) {
  const displayData = limit ? data.slice(0, limit) : data

  return (
    <div className="space-y-3">
      {displayData.map((incursion, index) => {
        const factionColor = getFactionColor(incursion.factionLabel)

        return (
          <div
            key={index}
            className="p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors border border-slate-600/30"
          >
            <div className="flex items-center justify-center gap-3">
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-200">
                  {incursion.label}
                </div>
                <div className="text-xs text-slate-400">
                  {incursion.missionType || 'Steel Path Incursion'}
                </div>
              </div>
              <Badge variant="secondary" className={`${factionColor} text-xs`}>
                {incursion.factionLabel || 'Unknown'}
              </Badge>
            </div>
          </div>
        )
      })}
    </div>
  )
}

