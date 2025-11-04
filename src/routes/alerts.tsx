import * as React from 'react'
import { createFileRoute, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type { Platform } from '@/lib/warframe/api'
import { fetchAlerts } from '@/lib/warframe/api'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, Clock, Gift, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  resolveMissionType,
  resolveNodeLabel,
  safeText,
} from '@/lib/helpers/helpers'
import { useResolvedItemNames } from '@/lib/helpers/resolveItems'

export const Route = createFileRoute('/alerts')({
  component: AlertsPage,
})

function AlertsPage() {
  const search = useSearch({ strict: false }) as { platform?: Platform }
  const platform = (search.platform ?? 'pc') as Platform
  const alerts = useQuery({
    queryKey: ['wf', platform, 'alerts'],
    queryFn: () => fetchAlerts(platform),
    staleTime: 45_000,
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="relative px-4 sm:px-6 py-6">
        <div className="mx-auto max-w-7xl">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Alerts
            </h1>
            <p className="text-slate-400 text-sm">
              All active alerts, updated live.
            </p>
          </header>
          <div className="space-y-4">
            {alerts.isLoading ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-24 bg-slate-700/50" />
                  <Skeleton className="h-6 w-20 bg-slate-700/50" />
                  <Skeleton className="h-6 w-28 bg-slate-700/50" />
                </div>
              </div>
            ) : !alerts.data || alerts.data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertTriangle className="w-12 h-12 text-slate-400 mb-3" />
                <div className="text-slate-400 text-sm">No active alerts</div>
                <div className="text-slate-500 text-xs mt-1">
                  Alerts will appear here when available
                </div>
              </div>
            ) : (
              <AlertsList data={alerts.data} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

type AlertReward = {
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

type MissionInfo = {
  location: string
  missionType: string
  missionReward: AlertReward
}

type AlertType = {
  id: string
  MissionInfo: MissionInfo
  Expiry: { $date: { $numberLong: string } }
  ExpiryTime?: number
  Expiration?: number
  ExpiryDate?: number
}

function useResolvedNodeLabel(location: string) {
  const [resolvedLabel, setResolvedLabel] = React.useState<string>(location)
  const [isLoading, setIsLoading] = React.useState(false)
  React.useEffect(() => {
    if (!location) {
      setResolvedLabel('—')
      return
    }
    let mounted = true
    const run = async () => {
      setIsLoading(true)
      try {
        const label = await resolveNodeLabel(location)
        if (mounted) setResolvedLabel(label)
      } catch {
        if (mounted) setResolvedLabel(location)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [location])
  return { resolvedLabel, isLoading }
}

function useAlertRewards(alert: AlertType) {
  const itemIdentifiers = React.useMemo(() => {
    const identifiers: string[] = []
    const { missionReward } = alert.MissionInfo
    if (Array.isArray(missionReward.items))
      identifiers.push(...missionReward.items)
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

  const rewardText = React.useMemo(() => {
    const parts: string[] = []
    const { missionReward } = alert.MissionInfo
    const itemStr =
      safeText(missionReward.itemString) || safeText(missionReward.asString)
    if (itemStr) {
      parts.push(itemStr)
    } else {
      if (Array.isArray(missionReward.countedItems)) {
        for (const item of missionReward.countedItems) {
          const qty = item.count || item.quantity || item.qty
          const identifier =
            safeText(item.type) || safeText(item._id) || safeText(item.item)
          const name = identifier
            ? resolvedNames[identifier] || identifier
            : safeText(item.name)
          if (name) parts.push(`${qty ? `${qty}x ` : ''}${name}`)
        }
      }
      if (missionReward.credits) parts.push(`${missionReward.credits}cr`)
      if (Array.isArray(missionReward.items)) {
        const resolvedItems = missionReward.items.map(
          (it) => resolvedNames[it] || it,
        )
        if (resolvedItems.length) parts.push(resolvedItems.join(' + '))
      }
    }
    return parts.length ? parts.join(' + ') : '—'
  }, [alert.MissionInfo.missionReward, resolvedNames])

  return { rewardText, isLoading }
}

function useAlertExpiration(alert: AlertType) {
  return React.useMemo(() => {
    const raw =
      Number(alert.Expiry.$date.$numberLong) ||
      Number(alert.ExpiryTime) ||
      Number(alert.Expiration) ||
      Number(alert.ExpiryDate)
    if (!raw) return { expiresText: '—', isExpiringSoon: false }
    const exp = new Date(raw)
    if (isNaN(exp.getTime())) return { expiresText: '—', isExpiringSoon: false }
    const diff = exp.getTime() - Date.now()
    const mins = Math.max(0, Math.round(diff / 60000))
    const expiresText = mins > 0 ? `${mins}m remaining` : 'Expired'
    const isExpiringSoon = diff < 30 * 60 * 1000
    return { expiresText, isExpiringSoon }
  }, [alert.Expiry, alert.ExpiryTime, alert.Expiration, alert.ExpiryDate])
}

function AlertsList({ data }: { data: AlertType[] }) {
  const rows = data || []
  return (
    <div className="space-y-3">
      {rows.map((alert) => (
        <AlertRow key={alert.id} alert={alert} />
      ))}
    </div>
  )
}

function AlertRow({ alert }: { alert: AlertType }) {
  const { rewardText, isLoading: rewardsLoading } = useAlertRewards(alert)
  const { expiresText, isExpiringSoon } = useAlertExpiration(alert)
  const rawLocation =
    safeText(alert.MissionInfo.location) || alert.MissionInfo.location
  const { resolvedLabel: resolvedLocation, isLoading: locationLoading } =
    useResolvedNodeLabel(rawLocation)
  const locationText = React.useMemo(() => {
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
}

