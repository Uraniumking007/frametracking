import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ExpandableCard } from '@/components/ui/expandable-card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { fetchBounties } from '@/lib/warframe/api'
import { useQuery } from '@tanstack/react-query'

export function BountiesCard({ full = false }: { full?: boolean }) {
  const bounties = useQuery({
    queryKey: ['oracle', 'bounties'],
    queryFn: async () => {
      const data = await fetchBounties('pc')
      return data
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  })

  const [difficulty, setDifficulty] = useState<'normal' | 'hard'>('normal')

  // Get active bounties count for collapsed view
  const activeBountiesCount = bounties.data?.bounties
    ? Object.values(bounties.data.bounties as Record<string, any[]>).reduce(
        (total: number, bounties: any[]) => total + bounties.length,
        0,
      )
    : 0

  return (
    <ExpandableCard
      title={`Bounties ${activeBountiesCount > 0 ? `(${activeBountiesCount})` : ''}`}
      expanded={
        <BountiesExpanded
          isLoading={bounties.isLoading}
          bounties={bounties.data}
          difficulty={difficulty}
          onToggleDifficulty={() =>
            setDifficulty((d) => (d === 'normal' ? 'hard' : 'normal'))
          }
        />
      }
    >
      <Card className="group hover:shadow-xl transition-all duration-300 border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm hover:from-slate-800/70 hover:to-slate-900/70 flex flex-col h-72 md:h-80 overflow-hidden">
        <CardHeader className="px-4 border-b border-slate-700/30">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              Bounties
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="difficulty-toggle"
                className="text-xs text-slate-300"
              >
                {difficulty === 'normal' ? 'Normal' : 'Hard'}
              </Label>
              <Switch
                id="difficulty-toggle"
                checked={difficulty === 'hard'}
                onCheckedChange={() =>
                  setDifficulty((d) => (d === 'normal' ? 'hard' : 'normal'))
                }
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          {bounties.isLoading ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 bg-slate-700" />
                <Skeleton className="h-6 w-24 bg-slate-700" />
                <Skeleton className="h-6 w-20 bg-slate-700" />
              </div>
            </div>
          ) : full ? (
            <BountiesExpanded
              isLoading={false}
              bounties={bounties.data}
              difficulty={difficulty}
              onToggleDifficulty={() =>
                setDifficulty((d) => (d === 'normal' ? 'hard' : 'normal'))
              }
            />
          ) : (
            <BountiesList
              bounties={bounties.data}
              difficulty={difficulty}
              limit={3}
            />
          )}
        </CardContent>
      </Card>
    </ExpandableCard>
  )
}

function BountiesExpanded({
  isLoading,
  bounties,
  difficulty,
  onToggleDifficulty,
}: {
  isLoading: boolean
  bounties?: { bounties?: any }
  difficulty: 'normal' | 'hard'
  onToggleDifficulty: () => void
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
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <Label
          htmlFor="difficulty-toggle-expanded"
          className="text-xs text-slate-300"
        >
          {difficulty === 'normal' ? 'Normal' : 'Hard'}
        </Label>
        <Switch
          id="difficulty-toggle-expanded"
          checked={difficulty === 'hard'}
          onCheckedChange={onToggleDifficulty}
        />
      </div>
      <BountiesList bounties={bounties} difficulty={difficulty} />
    </div>
  )
}

function BountiesList({
  bounties,
  difficulty = 'normal',
  limit,
}: {
  bounties?: {
    bounties?: any
  }
  difficulty?: 'normal' | 'hard'
  limit?: number
}) {
  if (!bounties) {
    return (
      <div className="text-slate-400 text-sm text-center py-4">
        No bounty data available
      </div>
    )
  }

  // Helper function to get localized name from dict (like browse.wf)
  const formatChallengeName = (challengePath: string) => {
    if (!challengePath) return 'Mission'
    const last = challengePath.split('/').pop() || ''
    return last
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .trim()
  }

  // Helper function to get level range from node (simplified)
  const getLevelRange = (syndicateTag: string, missionIndex: number) => {
    const levelRanges = {
      EntratiLabSyndicate: {
        '1': '55-60',
        '2': '65-70',
        '3': '75-80',
        '4': '95-100',
        '5': '115-120',
      },
      ZarimanSyndicate: {
        '1': '50-55',
        '2': '60-65',
        '3': '70-75',
        '4': '80-85',
        '5': '90-95',
      },
      HexSyndicate: {
        '1': '65-70',
        '2': '75-80',
        '3': '85-90',
        '4': '95-100',
        '5': '105-110',
        '6': '115-120',
        '7': '125-130',
      },
    }

    const syndicateLevelRanges =
      levelRanges[syndicateTag as keyof typeof levelRanges]
    if (!syndicateLevelRanges) return '50-100'

    const baseRange =
      syndicateLevelRanges[
        String(missionIndex) as keyof typeof syndicateLevelRanges
      ] || '50-100'

    // Apply difficulty modifier
    if (difficulty === 'hard') {
      const [min, max] = baseRange.split('-').map(Number)
      const newMin = min + 100
      const newMax = max + 100
      return `${newMin}-${newMax}`
    }

    return baseRange
  }

  // Helper function to get standing from tier
  const getStandingFromTier = (syndicateTag: string, tier: number) => {
    const standingRewards = {
      EntratiLabSyndicate: [1000, 2000, 3000, 4000, 5000],
      ZarimanSyndicate: [2500, 5000, 7500, 10000, 12500],
      HexSyndicate: [1000, 2000, 3000, 4000, 5000, 6000, 7500],
    }

    const rewards =
      standingRewards[syndicateTag as keyof typeof standingRewards]
    if (!rewards) return 1000

    // Apply difficulty modifier
    const baseReward = rewards[tier - 1] || 1000
    return difficulty === 'hard' ? Math.floor(baseReward * 1.5) : baseReward
  }

  // Extract detailed bounty information for node-based syndicates
  const getMainBountyDetails = () => {
    if (!bounties.bounties) return []

    const mainSyndicates = [
      'EntratiLabSyndicate', // Cavia
      'ZarimanSyndicate', // The Holdfasts
      'HexSyndicate', // The Hex
    ]

    return mainSyndicates
      .map((syndicateTag: string) => {
        const syndicateBounties = bounties.bounties[syndicateTag] || []

        return {
          syndicate: syndicateTag,
          bounties: syndicateBounties.map((bounty: any, index: number) => ({
            tier: index + 1,
            location: bounty.resolvedNodeLabel || 'Unknown Location',
            missionType: formatChallengeName(bounty.challenge),
            levelRange: getLevelRange(syndicateTag, index + 1),
            standing: getStandingFromTier(syndicateTag, index + 1),
          })),
        }
      })
      .filter((syndicate: any) => syndicate.bounties.length > 0)
  }

  const mainBountyDetails = getMainBountyDetails()
  const displaySyndicates = limit
    ? mainBountyDetails.slice(0, limit)
    : mainBountyDetails

  return (
    <div className="space-y-3">
      {displaySyndicates.length > 0 ? (
        displaySyndicates.map((bounty: any, index: number) => {
          const getSyndicateName = (syndicate: string) => {
            switch (syndicate) {
              case 'EntratiLabSyndicate':
                return 'Cavia'
              case 'ZarimanSyndicate':
                return 'The Holdfasts'
              case 'HexSyndicate':
                return 'The Hex'
              default:
                return 'Unknown Syndicate'
            }
          }

          if (bounty.bounties.length === 0) return null

          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-200">
                  {getSyndicateName(bounty.syndicate)}
                </h3>
                <Badge
                  variant="secondary"
                  className="bg-green-500/20 text-green-300 border-green-400/30 text-xs"
                >
                  {bounty.bounties.length} missions
                </Badge>
              </div>

              <div className="space-y-2">
                {bounty.bounties.map((bountyItem: any, bountyIndex: number) => (
                  <div
                    key={bountyIndex}
                    className="p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors border border-slate-600/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-200">
                          {bountyItem.missionType}
                        </div>
                        <div className="text-xs text-slate-400">
                          {bountyItem.location}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400">
                          Level {bountyItem.levelRange}
                        </div>
                        <div className="text-sm font-medium text-green-400">
                          {bountyItem.standing.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })
      ) : (
        <div className="text-center py-8">
          <div className="text-slate-400 text-sm mb-2">No active bounties</div>
          <div className="text-slate-500 text-xs">
            Check back later for new rotations
          </div>
        </div>
      )}
    </div>
  )
}

