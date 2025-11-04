import * as React from 'react'
import { createFileRoute, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchFissures, sortFissuresByTier, Platform } from '@/lib/warframe/api'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useTimeRemaining } from '@/hooks/use-time'

export const Route = createFileRoute('/fissures')({
  component: FissuresPage,
})

function FissuresPage() {
  const search = useSearch({ strict: false }) as { platform?: Platform }
  const platform = (search.platform ?? 'pc') as Platform
  const normal = useQuery({
    queryKey: ['wf', platform, 'normalFissures'],
    queryFn: () => fetchFissures(platform, 'normal'),
    staleTime: 45_000,
  })
  const steel = useQuery({
    queryKey: ['wf', platform, 'steelPathFissures'],
    queryFn: () => fetchFissures(platform, 'steelPath'),
    staleTime: 45_000,
  })
  const [normalTier, setNormalTier] = React.useState<string>('All')
  const [steelTier, setSteelTier] = React.useState<string>('All')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="relative px-4 sm:px-6 py-6">
        <div className="mx-auto max-w-7xl">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Void Fissures
            </h1>
            <p className="text-slate-400 text-sm">
              Normal and Steel Path fissures, updated live.
            </p>
          </header>
          <Tabs defaultValue="normal" className="w-full">
            <TabsList>
              <TabsTrigger value="normal">
                Normal{' '}
                <Badge className="ml-2 bg-blue-500/20 text-blue-200 border-blue-400/40 text-xs">
                  {normal.data?.length || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="steel">
                Steel Path{' '}
                <Badge className="ml-2 bg-orange-500/20 text-orange-200 border-orange-400/40 text-xs">
                  {steel.data?.length || 0}
                </Badge>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="normal" className="mt-4">
              {normal.isLoading ? (
                <FissuresSkeleton />
              ) : (
                <FissureSection
                  data={normal.data || []}
                  selectedTier={normalTier}
                  onChangeTier={setNormalTier}
                  color="blue"
                />
              )}
            </TabsContent>
            <TabsContent value="steel" className="mt-4">
              {steel.isLoading ? (
                <FissuresSkeleton />
              ) : (
                <FissureSection
                  data={steel.data || []}
                  selectedTier={steelTier}
                  onChangeTier={setSteelTier}
                  color="orange"
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

function FissuresSkeleton() {
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

function FissureSection({
  data,
  selectedTier,
  onChangeTier,
  color,
}: {
  data: any[]
  selectedTier: string
  onChangeTier: (t: string) => void
  color: 'blue' | 'orange'
}) {
  const sorted = sortFissuresByTier(data, false)
  const tiers = [
    'All',
    ...Array.from(new Set(sorted.map((f) => f.tier).filter(Boolean))),
  ]
  const filtered =
    selectedTier === 'All'
      ? sorted
      : sorted.filter((f) => f.tier === selectedTier)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-300">Filter by Relic Tier:</span>
        <div className="flex flex-wrap gap-2">
          {tiers.map((t) => (
            <button
              key={t}
              onClick={() => onChangeTier(t)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedTier === t
                  ? color === 'blue'
                    ? 'bg-blue-500 text-white'
                    : 'bg-orange-500 text-white'
                  : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((f: any, index: number) => (
          <FissureRow
            key={f.id || `fissure-${index}`}
            fissure={f}
            color={color}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-slate-400 py-4">No fissures</div>
        )}
      </div>
    </div>
  )
}

function FissureRow({
  fissure,
  color,
}: {
  fissure: any
  color: 'blue' | 'orange'
}) {
  const remaining = useTimeRemaining(fissure.expiry)
  return (
    <div
      className={`${
        color === 'blue'
          ? 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-400/20'
          : 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-400/20'
      } p-3 rounded-lg transition-colors border`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-slate-200 font-medium">
          {fissure.resolvedNodeLabel || fissure.node || 'Unknown Node'}
        </span>
        <span
          className={`text-xs ${
            color === 'blue'
              ? 'text-blue-300 bg-blue-500/20'
              : 'text-orange-300 bg-orange-500/20'
          } px-2 py-1 rounded`}
        >
          {fissure.tier || 'Unknown'}
        </span>
      </div>
      <div className="flex items-center justify-between">
        {fissure.missionType && (
          <div
            className={
              'text-xs ' +
              (color === 'blue' ? 'text-blue-200/80' : 'text-orange-200/80')
            }
          >
            Mission: {fissure.missionType}
          </div>
        )}
        {(remaining || fissure.timeLeft) && (
          <div
            className={
              'text-xs ' +
              (color === 'blue' ? 'text-blue-200/80' : 'text-orange-200/80')
            }
          >
            {remaining || fissure.timeLeft}
          </div>
        )}
      </div>
    </div>
  )
}

