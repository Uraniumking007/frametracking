import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ExpandableCard } from '@/components/ui/expandable-card'
import { resolveEventDescription, safeText } from '@/lib/helpers/helpers'
import { Calendar, MapPin, Gift } from 'lucide-react'
import { Platform } from '@/lib/warframe/api'
import { fetchEvents } from '@/lib/warframe/api'
import { useQuery } from '@tanstack/react-query'
import { useSearch } from '@tanstack/react-router'
import { Suspense, useEffect, useRef, useState } from 'react'

export function EventsCard({ full = false }: { full?: boolean }) {
  const search = useSearch({ strict: false }) as { platform?: Platform }
  const platform = (search.platform ?? 'pc') as Platform
  const events = useQuery({
    queryKey: ['wf', platform, 'events'],
    queryFn: () => fetchEvents(platform),
    staleTime: 2 * 60_000, // 2 minutes - events change less frequently than alerts
  })
  return (
    <ExpandableCard
      title="Special Events"
      expanded={
        <EventsExpanded isLoading={events.isLoading} data={events.data} />
      }
    >
      <Card className="group hover:shadow-xl transition-all duration-300 border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm hover:from-slate-800/70 hover:to-slate-900/70 flex flex-col h-72 md:h-80 overflow-hidden">
        <CardHeader className="px-4 border-b border-slate-700/30">
          <CardTitle className="flex items-center gap-3 text-white">
            <span className="text-lg font-semibold">Special Events</span>
            <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="w-3 h-3" />
              <span>{events.data?.length || 0} active</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          <div className="min-h-full">
            {events.isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <Skeleton className="h-20 w-full bg-gradient-to-r from-slate-700/50 to-slate-600/50 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : full ? (
              <EventsExpanded isLoading={false} data={events.data} />
            ) : (
              <EventsList items={events.data} limit={3} />
            )}
          </div>
        </CardContent>
      </Card>
    </ExpandableCard>
  )
}

function EventsExpanded({
  isLoading,
  data,
}: {
  isLoading: boolean
  data?: any[]
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <Skeleton className="h-32 w-full bg-gradient-to-r from-slate-700/50 to-slate-600/50 rounded-xl" />
          </div>
        ))}
      </div>
    )
  }
  return <EventsList items={data} expanded />
}

function EventsList({
  items,
  limit,
  expanded,
}: {
  items?: any[]
  limit?: number
  expanded?: boolean
}) {
  const rows = items || []
  const slice = typeof limit === 'number' ? rows.slice(0, limit) : rows

  if (slice.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full text-slate-400">
        <Calendar className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-sm">No active events</p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${expanded ? 'grid gap-4 md:grid-cols-2' : ''}`}>
      {slice.map((ev: any, index: number) => (
        <EventItem key={ev.id || `event-${index}`} event={ev} />
      ))}
    </div>
  )
}

function EventItem({ event }: { event: any }) {
  const isActive = event.active || event.isActive
  const count = event.Count || 0
  const goal = event.Goal || 0
  const healthPct = event.HealthPct || 0
  const interimGoals = event.InterimGoals || []
  const activation = event.Activation?.$date?.$numberLong
  const expiry = event.Expiry?.$date?.$numberLong
  const [description, setDescription] = useState(
    event.Desc || event.ToolTip || event.description || event.tooltip || '',
  )
  const isLoading = useRef(false)
  useEffect(() => {
    if (isLoading.current) return
    isLoading.current = true
    const fetchDescription = async () => {
      const desc = await resolveEventDescription(description)
      setDescription(desc)
      isLoading.current = false
    }
    fetchDescription()
  }, [description])
  const location = event.resolvedLocation || event.Node || ''
  const faction = event.resolvedFaction || event.faction || ''
  const rewards = event.resolvedRewards || []

  // Calculate progress percentage for community events
  const progressPercentage = goal > 0 ? Math.round((count / goal) * 100) : 0

  // Format dates
  const formatDate = (timestamp: number) => {
    if (!timestamp) return null
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getFactionColor = (faction?: string) => {
    if (!faction) return 'bg-purple-500/20 text-purple-300 border-purple-400/30'
    const factionKey = faction.toLowerCase()
    if (factionKey.includes('grineer'))
      return 'bg-red-500/20 text-red-300 border-red-400/30'
    if (factionKey.includes('corpus'))
      return 'bg-blue-500/20 text-blue-300 border-blue-400/30'
    if (factionKey.includes('infested'))
      return 'bg-green-500/20 text-green-300 border-green-400/30'
    if (factionKey.includes('orokin'))
      return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
    return 'bg-purple-500/20 text-purple-300 border-purple-400/30'
  }

  return (
    <div className="group relative p-4 mr-4 rounded-xl bg-gradient-to-br from-slate-700/40 to-slate-600/40 hover:from-slate-700/60 hover:to-slate-600/60 transition-all duration-300 border border-slate-600/30 hover:border-slate-500/50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Badge className={`text-xs font-medium ${getFactionColor(faction)}`}>
            {safeText(faction) || "Event"}
          </Badge>
          {isActive && (
            <div className="flex items-center gap-1 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium">Active</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {/* Event Description */}
        <Suspense
          fallback={
            <Skeleton className="h-4 w-full bg-gradient-to-r from-slate-700/50 to-slate-600/50 rounded-xl" />
          }
        >
          <p className="text-sm text-slate-200 capitalize leading-relaxed line-clamp-2">
            {description}
          </p>
        </Suspense>

        {/* Location Information */}
        {location && (
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <MapPin className="w-3 h-3" />
            <span>Location: {location}</span>
          </div>
        )}

        {/* Community Event Progress */}
        {goal > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Community Progress</span>
              <span className="text-slate-400">
                {count.toLocaleString()} / {goal.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-slate-600/30 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-slate-400 text-center">
              {progressPercentage}% Complete
            </div>
          </div>
        )}

        {/* Health Percentage for Events */}
        {healthPct > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Event Health</span>
            <span className="text-orange-400 font-medium">
              {Math.round(healthPct * 100)}%
            </span>
          </div>
        )}

        {/* Interim Goals Progress */}
        {interimGoals.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-slate-300 mb-2">Milestone Rewards</div>
            <div className="flex flex-wrap gap-1">
              {interimGoals.map((goal: number, index: number) => {
                const isCompleted = count >= goal;
                return (
                  <div
                    key={index}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      isCompleted
                        ? "bg-green-500/20 text-green-300 border border-green-400/30"
                        : "bg-slate-600/30 text-slate-400 border border-slate-500/30"
                    }`}
                  >
                    {goal}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Event Duration */}
        {activation && expiry && (
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Started:</span>
              <span className="text-slate-300">{formatDate(activation)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Ends:</span>
              <span className="text-slate-300">{formatDate(expiry)}</span>
            </div>
          </div>
        )}

        {/* Rewards Display */}
        {rewards.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Gift className="w-3 h-3" />
              <span>Rewards</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {rewards.slice(0, 3).map((reward: string, index: number) => (
                <div
                  key={index}
                  className="px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-400/30"
                >
                  {reward}
                </div>
              ))}
              {rewards.length > 3 && (
                <div className="px-2 py-1 rounded text-xs font-medium bg-slate-600/30 text-slate-400 border border-slate-500/30">
                  +{rewards.length - 3} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"></div>
    </div>
  );
}

