import { formatDistanceToNow } from 'date-fns'
import { AlertTriangle, Clock, Gift, MapPin } from 'lucide-react'
import { memo, useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ExpandableCard } from '@/components/ui/expandable-card'
import {
  resolveMissionType,
  resolveNodeLabel,
  safeText,
} from '@/lib/helpers/helpers'
import { useQuery } from '@tanstack/react-query'
import { fetchAlerts, Platform } from '@/lib/warframe/api'
import { useResolvedItemNames } from '@/lib/helpers/resolveItems'

// Type definitions for better type safety
interface AlertReward {
  items?: string[]
  countedItems?: Array<{
    type?: string
    _id?: string
    item?: string
    name?: string
    count?: number
    quantity?: number
    qty?: number
  }>
  itemString?: string
  asString?: string
  credits?: number
}

interface MissionInfo {
  location: string
  missionType: string
  missionReward: AlertReward
}

interface Alert {
  id: string
  MissionInfo: MissionInfo
  Expiry: {
    $date: {
      $numberLong: string
    }
  }
  ExpiryTime?: number
  Expiration?: number
  ExpiryDate?: number
}

interface AlertRowProps {
  alert: Alert
}

interface AlertsTableProps {
  isLoading: boolean
  data?: Alert[]
  limit?: number
}

interface AlertsExpandedProps {
  isLoading: boolean
  data?: Alert[]
}

export const AlertsCard = memo(function AlertsCard(props: {
  platform: Platform
  full?: boolean
}) {
  const alerts = useQuery({
    queryKey: ['wf', props.platform, 'alerts'],
    queryFn: () => fetchAlerts(props.platform),
    staleTime: 45_000, // 45 seconds - alerts can appear/disappear frequently
  })

  const alertsCount = useMemo(
    () => alerts.data?.length || 0,
    [alerts.data?.length],
  )

  const title = useMemo(
    () => `Active Alerts ${alertsCount > 0 ? `(${alertsCount})` : ''}`,
    [alertsCount],
  )

  const expandedContent = useMemo(
    () => <AlertsExpanded isLoading={alerts.isLoading} data={alerts.data} />,
    [alerts.isLoading, alerts.data],
  )

  return (
    <ExpandableCard title={title} expanded={expandedContent}>
      <Card className="group hover:shadow-xl transition-all duration-300 border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm hover:from-slate-800/70 hover:to-slate-900/70 flex flex-col h-72 md:h-80 overflow-hidden">
        <CardHeader className="px-4 border-b border-slate-700/30">
          <CardTitle className="flex items-center gap-2 text-white">
            <div className="relative">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-2 h-2 bg-red-300 rounded-full animate-ping opacity-30"></div>
            </div>
            <span className="text-sm font-medium">Active Alerts</span>
            {alertsCount > 0 && (
              <Badge className="bg-red-500/20 text-red-200 border-red-400/40 text-xs px-2 py-0.5 font-medium">
                {alertsCount}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          <div className="flex justify-center">
            <div className="w-full max-w-full">
              {props.full ? (
                <AlertsExpanded
                  isLoading={alerts.isLoading}
                  data={alerts.data}
                />
              ) : (
                <AlertsTable isLoading={alerts.isLoading} data={alerts.data} />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </ExpandableCard>
  )
})

const AlertsExpanded = memo(function AlertsExpanded({
  isLoading,
  data,
}: AlertsExpandedProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-full">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 bg-slate-700/50" />
              <Skeleton className="h-6 w-20 bg-slate-700/50" />
              <Skeleton className="h-6 w-28 bg-slate-700/50" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertTriangle className="w-12 h-12 text-slate-400 mb-3" />
        <div className="text-slate-400 text-sm">No active alerts</div>
        <div className="text-slate-500 text-xs mt-1">
          Alerts will appear here when available
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-full">
        <div className="space-y-4">
          <AlertsTable isLoading={isLoading} data={data} />
        </div>
      </div>
    </div>
  )
})

const AlertsTable = memo(function AlertsTable({
  isLoading,
  data,
  limit,
}: AlertsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24 bg-slate-700/50" />
          <Skeleton className="h-6 w-20 bg-slate-700/50" />
          <Skeleton className="h-6 w-28 bg-slate-700/50" />
        </div>
      </div>
    )
  }

  const rows = data || []
  const slice = typeof limit === 'number' ? rows.slice(0, limit) : rows

  if (slice.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <AlertTriangle className="w-8 h-8 text-slate-400 mb-2" />
        <div className="text-slate-400 text-sm">No active alerts</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {slice.map((alert) => (
        <AlertRow key={alert.id} alert={alert} />
      ))}
    </div>
  )
})

// Custom hook to resolve node labels asynchronously
function useResolvedNodeLabel(location: string) {
  const [resolvedLabel, setResolvedLabel] = useState<string>(location)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!location) {
      setResolvedLabel('—')
      return
    }

    const resolveLabel = async () => {
      setIsLoading(true)
      try {
        const label = await resolveNodeLabel(location)
        setResolvedLabel(label)
      } catch (error) {
        console.warn('Failed to resolve node label:', error)
        setResolvedLabel(location)
      } finally {
        setIsLoading(false)
      }
    }

    resolveLabel()
  }, [location])

  return { resolvedLabel, isLoading }
}

// Custom hook to process alert rewards
function useAlertRewards(alert: Alert) {
  const itemIdentifiers = useMemo(() => {
    const identifiers: string[] = []
    const { missionReward } = alert.MissionInfo

    // Extract items from items array
    if (Array.isArray(missionReward.items)) {
      identifiers.push(...missionReward.items)
    }

    // Extract identifiers from counted items
    if (Array.isArray(missionReward.countedItems)) {
      for (const item of missionReward.countedItems) {
        const identifier =
          safeText(item.type) || safeText(item._id) || safeText(item.item)
        if (identifier) identifiers.push(identifier)
      }
    }

    return identifiers
  }, [alert.MissionInfo.missionReward])

  const { resolvedNames, isLoading } = useResolvedItemNames(itemIdentifiers)

  const rewardText = useMemo(() => {
    const parts: string[] = []
    const { missionReward } = alert.MissionInfo

    // Check for item string first
    const itemStr =
      safeText(missionReward.itemString) || safeText(missionReward.asString)
    if (itemStr) {
      parts.push(itemStr)
    } else {
      // Process counted items with resolved names
      if (Array.isArray(missionReward.countedItems)) {
        for (const item of missionReward.countedItems) {
          const qty = item.count || item.quantity || item.qty
          const identifier =
            safeText(item.type) || safeText(item._id) || safeText(item.item)
          const name = identifier
            ? resolvedNames[identifier] || identifier
            : safeText(item.name)
          if (name) {
            parts.push(`${qty ? `${qty}x ` : ''}${name}`)
          }
        }
      }

      // Add credits
      if (missionReward.credits) {
        parts.push(`${missionReward.credits}cr`)
      }

      // Add resolved items from items array
      if (Array.isArray(missionReward.items)) {
        const resolvedItems = missionReward.items.map(
          (item: string) => resolvedNames[item] || item,
        )
        if (resolvedItems.length) {
          parts.push(resolvedItems.join(' + '))
        }
      }
    }

    return parts.length ? parts.join(' + ') : '—'
  }, [alert.MissionInfo.missionReward, resolvedNames])

  return { rewardText, isLoading }
}

// Custom hook to process alert expiration
function useAlertExpiration(alert: Alert) {
  return useMemo(() => {
    const raw =
      Number(alert.Expiry.$date.$numberLong) ||
      Number(alert.ExpiryTime) ||
      Number(alert.Expiration) ||
      Number(alert.ExpiryDate)

    if (!raw) return { expiresText: '—', isExpiringSoon: false }

    const exp = new Date(raw)
    if (isNaN(exp.getTime())) return { expiresText: '—', isExpiringSoon: false }

    const expiresText = formatDistanceToNow(exp, { addSuffix: true })
    const isExpiringSoon = exp.getTime() - Date.now() < 30 * 60 * 1000 // 30 minutes

    return { expiresText, isExpiringSoon }
  }, [alert.Expiry, alert.ExpiryTime, alert.Expiration, alert.ExpiryDate])
}

const AlertRow = memo(function AlertRow({ alert }: AlertRowProps) {
  const { rewardText, isLoading: rewardsLoading } = useAlertRewards(alert)
  const { expiresText, isExpiringSoon } = useAlertExpiration(alert)

  const rawLocation =
    safeText(alert.MissionInfo.location) || alert.MissionInfo.location
  const { resolvedLabel: resolvedLocation, isLoading: locationLoading } =
    useResolvedNodeLabel(rawLocation)

  const locationText = useMemo(() => {
    const missionType =
      resolveMissionType(alert.MissionInfo.missionType) || 'Unknown Mission'
    return `${resolvedLocation} • ${missionType}`
  }, [resolvedLocation, alert.MissionInfo.missionType])

  return (
    <div className="group p-3 rounded-lg bg-slate-700/30 border border-slate-600/30 hover:bg-slate-700/50 hover:border-slate-500/50 transition-all duration-200">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <MapPin className="w-4 h-4 text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-sm font-medium text-slate-200 truncate">
              {locationLoading ? 'Loading location...' : locationText}
            </div>
          </div>
          {rewardText !== '—' && (
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              <div className="text-xs text-emerald-200 font-medium truncate">
                {rewardsLoading ? 'Loading rewards...' : rewardText}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Clock
                className={`w-3 h-3 ${isExpiringSoon ? 'text-red-400' : 'text-slate-400'}`}
              />
              <span
                className={`text-xs ${isExpiringSoon ? 'text-red-300 font-medium' : 'text-slate-400'}`}
              >
                {expiresText}
              </span>
            </div>
            {isExpiringSoon && (
              <Badge className="bg-red-500/20 text-red-200 border-red-400/40 text-xs px-2 py-0.5 font-medium">
                Expiring Soon
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

