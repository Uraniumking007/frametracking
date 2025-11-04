import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ExpandableCard } from '@/components/ui/expandable-card'
import { sortFissuresByTier, Platform } from "@/lib/warframe/api";
import { useNormalFissures } from "@/lib/warframe/queries";
import { useTimeRemaining } from "@/hooks/use-time";
import { useDashboardPrefs } from "@/lib/store/dashboardPrefs";
import { useSearch } from "@tanstack/react-router";

export function NormalFissuresCard() {
  const prefs = useDashboardPrefs()
  const search = useSearch({ strict: false }) as { platform?: Platform }
  const platform = (search.platform ?? 'pc') as Platform
  const fissuresQuery = useNormalFissures(platform);
  const fissuresCount = fissuresQuery.data?.length || 0

  return (
    <ExpandableCard
      title={`Normal Void Fissures ${fissuresCount > 0 ? `(${fissuresCount})` : ''}`}
      expanded={
        <NormalFissuresExpanded
          isLoading={fissuresQuery.isLoading}
          data={fissuresQuery.data}
        />
      }
    >
      <Card className="group hover:shadow-xl transition-all duration-300 border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm hover:from-slate-800/70 hover:to-slate-900/70 flex flex-col h-72 md:h-80 overflow-hidden">
        <CardHeader className="px-4 border-b border-slate-700/30">
          <CardTitle className="flex items-center gap-2 text-white">
            <div className="relative">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-2 h-2 bg-blue-300 rounded-full animate-ping opacity-30"></div>
            </div>
            <span className="text-sm font-medium">Normal Void Fissures</span>
            {prefs.showOmniFirst && (
              <Badge className="bg-purple-500/20 text-purple-200 border-purple-400/40 text-xs px-2 py-0.5 font-medium">
                Omnia First
              </Badge>
            )}
            {fissuresCount > 0 && (
              <Badge className="bg-blue-500/20 text-blue-200 border-blue-400/40 text-xs px-2 py-0.5 font-medium">
                {fissuresCount}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          <div className="flex justify-center">
            <div className="w-full max-w-full">
              <NormalFissuresContent
                isLoading={fissuresQuery.isLoading}
                data={fissuresQuery.data}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </ExpandableCard>
  )
}

function NormalFissuresContent({
  isLoading,
  data,
  limit,
}: {
  isLoading: boolean
  data?: any[]
  limit?: number
}) {
  const prefs = useDashboardPrefs()
  const normalFissures = data
    ? sortFissuresByTier(data, prefs.showOmniFirst)
    : []

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(limit || 5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30"
          >
            <Skeleton className="h-4 w-32 bg-slate-700" />
            <Skeleton className="h-6 w-16 bg-slate-700" />
          </div>
        ))}
      </div>
    )
  }

  const displayFissures = normalFissures.slice(0, limit)

  return (
    <div className="space-y-2">
      {displayFissures.map((f: any, index: number) => (
        <FissureItem
          key={f.id || `fissure-${index}`}
          fissure={f}
          compact={true}
        />
      ))}
      {normalFissures.length === 0 && (
        <div className="text-center text-slate-400 py-4">
          No active normal fissures
        </div>
      )}
    </div>
  )
}

function NormalFissuresExpanded({
  isLoading,
  data,
}: {
  isLoading: boolean
  data?: any[]
}) {
  const [selectedTier, setSelectedTier] = useState<string>('All')
  const prefs = useDashboardPrefs()

  const normalFissures = data
    ? sortFissuresByTier(data, prefs.showOmniFirst)
    : []
  const availableTiers = [
    'All',
    ...Array.from(new Set(normalFissures.map((f) => f.tier).filter(Boolean))),
  ]

  const filteredFissures =
    selectedTier === 'All'
      ? normalFissures
      : normalFissures.filter((f) => f.tier === selectedTier)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30"
          >
            <Skeleton className="h-4 w-32 bg-slate-700" />
            <Skeleton className="h-6 w-16 bg-slate-700" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
        <span className="text-sm text-slate-300 font-medium">
          Filter by Relic Tier:
        </span>
        <div className="flex flex-wrap gap-2">
          {availableTiers.map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedTier === tier
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Filtered Results */}
      <div className="space-y-2">
        {filteredFissures.map((f: any, index: number) => (
          <FissureItem
            key={f.id || `fissure-${index}`}
            fissure={f}
            compact={false}
          />
        ))}
        {filteredFissures.length === 0 && (
          <div className="text-center text-slate-400 py-4">
            {selectedTier === 'All'
              ? 'No active normal fissures'
              : `No ${selectedTier} fissures available`}
          </div>
        )}
      </div>
    </div>
  )
}

function FissureItem({
  fissure,
  compact = false,
}: {
  fissure: any
  compact?: boolean
}) {
  const timeRemaining = useTimeRemaining(fissure.expiry)

  if (compact) {
    return (
      <div className="flex items-center justify-between p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors border border-blue-400/20">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm text-slate-200 font-medium truncate">
            {fissure.resolvedNodeLabel || fissure.node || 'Unknown Node'}
          </span>
          <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded shrink-0">
            {fissure.tier || 'Unknown'}
          </span>
        </div>
        <div className="text-xs text-blue-200/80 font-medium shrink-0 ml-2">
          {timeRemaining || 'Unknown'}
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors border border-blue-400/20">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-slate-200 font-medium">
          {fissure.resolvedNodeLabel || fissure.node || 'Unknown Node'}
        </span>
        <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded">
          {fissure.tier || 'Unknown'}
        </span>
      </div>
      <div className="flex items-center justify-between">
        {fissure.missionType && (
          <div className="text-xs text-blue-200/80">
            Mission: {fissure.missionType}
          </div>
        )}
        {timeRemaining && (
          <div className="text-xs text-blue-200/80">{timeRemaining}</div>
        )}
      </div>
    </div>
  )
}

