import * as React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ExpandableCard } from '@/components/ui/expandable-card'
import { useTime } from '@/hooks/use-time'
import {
  resolveNodeLabel,
  resolveNodeMeta,
  formatArbitrationLine,
} from '@/lib/helpers/helpers'
import { useArbitrationStore } from '@/lib/store/arbitrationStore'

// Cache for processed arbitration data to avoid re-computation
const arbitrationDataCache = new Map<
  string,
  {
    line: string
    next: { label: string; eta: string }[]
    timestamp: number
  }
>()

// Cache for node resolution results
const nodeResolutionCache = new Map<
  string,
  {
    label: string
    meta: { enemy?: string; type?: string }
    timestamp: number
  }
>()

// Helper function to get cached node resolution
async function getCachedNodeResolution(code: string) {
  const cacheKey = code
  const cached = nodeResolutionCache.get(cacheKey)

  // Cache for 5 minutes
  if (cached && Date.now() - cached.timestamp < 5 * 60_000) {
    return cached
  }

  const [label, meta] = await Promise.all([
    resolveNodeLabel(code),
    resolveNodeMeta(code),
  ])

  const result = { label, meta, timestamp: Date.now() }
  nodeResolutionCache.set(cacheKey, result)
  return result
}

export function ArbitrationCard() {
  const arbitrationStore = useArbitrationStore()
  const { data, isLoading } = arbitrationStore

  const scheduleText = data.scheduleText

  return (
    <ExpandableCard
      title="Arbitration"
      expanded={
        <ArbitrationExpanded
          isLoading={isLoading}
          scheduleText={scheduleText || undefined}
        />
      }
    >
      <Card className="group hover:shadow-xl transition-all duration-300 border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm hover:from-slate-800/70 hover:to-slate-900/70 flex flex-col h-72 md:h-80 overflow-hidden">
        <CardHeader className="px-4 border-b border-slate-700/30">
          <CardTitle className="flex items-center gap-2 text-white">
            <div className="relative">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-2 h-2 bg-orange-300 rounded-full animate-ping opacity-30"></div>
            </div>
            <span className="text-sm font-medium">Arbitration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-3/4 bg-slate-700/50" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 bg-slate-700/50" />
                <Skeleton className="h-6 w-24 bg-slate-700/50" />
              </div>
            </div>
          ) : (
            <ArbitrationContent scheduleText={scheduleText || undefined} />
          )}
        </CardContent>
      </Card>
    </ExpandableCard>
  )
}

const ArbitrationContent = React.memo(function ArbitrationContent({
  scheduleText,
}: {
  scheduleText?: string
}) {
  const arbitrationStore = useArbitrationStore()
  const { data } = arbitrationStore

  const [line, setLine] = React.useState<string>('—')
  const [next, setNext] = React.useState<{ label: string; eta: string }[]>([])
  const currentTime = useTime()

  // Use store's parsed rotations if available, otherwise parse from scheduleText
  const rotations = React.useMemo(() => {
    if (data.parsedRotations.length > 0) {
      return data.parsedRotations
    }

    if (!scheduleText) return []

    return scheduleText
      .split('\n')
      .filter(Boolean)
      .map((r) => r.split(','))
      .map(([tsStr, code]) => ({
        ts: Number(tsStr) * 1000,
        code: code?.trim() || '',
        label: undefined,
        meta: undefined,
      }))
      .filter((x) => Number.isFinite(x.ts) && x.code)
      .sort((a, b) => a.ts - b.ts)
  }, [data.parsedRotations, scheduleText])

  // Memoize the cache key to avoid unnecessary re-computations
  const cacheKey = React.useMemo(() => {
    const scheduleKey = scheduleText
      ? scheduleText.slice(0, 100)
      : 'no-schedule'
    const timeKey = Math.floor(currentTime.getTime() / 30_000) // 30-second buckets
    return `${scheduleKey}-${timeKey}`
  }, [scheduleText, currentTime])

  React.useEffect(() => {
    let cancelled = false

    // Check cache first
    const cached = arbitrationDataCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < 30_000) {
      // 30-second cache
      setLine(cached.line)
      setNext(cached.next)
      return
    }

    ;(async () => {
      try {
        if (rotations.length > 0) {
          const now = currentTime.getTime()

          // Use store's parsed rotations
          const current = rotations.filter((x) => x.ts <= now).pop()
          let currentLine = '—'

          if (current) {
            // Use pre-resolved data if available, otherwise resolve
            if (current.label && current.meta) {
              currentLine = formatArbitrationLine(
                current.meta.type,
                current.meta.enemy,
                current.label,
              )
            } else {
              const { label: curLabel, meta: metaCur } =
                await getCachedNodeResolution(current.code)
              currentLine = formatArbitrationLine(
                metaCur.type,
                metaCur.enemy,
                curLabel,
              )
            }
          }

          const upcomingRotations = rotations
            .filter((x) => x.ts > now)
            .slice(0, 6)

          // Process rotations in parallel
          const resolutionPromises = upcomingRotations.map(
            async ({ ts, code, label }) => {
              let resolvedLabel = label
              if (!resolvedLabel) {
                const { label: resolved } = await getCachedNodeResolution(code)
                resolvedLabel = resolved
              }
              const eta = formatDistanceToNow(new Date(ts), { addSuffix: true })
              return { label: resolvedLabel, eta }
            },
          )

          const resolvedRotations = await Promise.all(resolutionPromises)

          if (!cancelled) {
            setLine(currentLine)
            setNext(resolvedRotations)

            // Cache the processed data
            arbitrationDataCache.set(cacheKey, {
              line: currentLine,
              next: resolvedRotations,
              timestamp: Date.now(),
            })
          }
        }
      } catch (error) {
        console.warn('Error processing arbitration data:', error)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [cacheKey, rotations, currentTime])

  return (
    <div className="space-y-3">
      <div className="bg-slate-700/30 rounded-lg p-2 border border-slate-600/30">
        <div className="text-sm font-medium text-slate-200 leading-relaxed">
          {line}
        </div>
      </div>

      {!!next.length && <ArbitrationRotations next={next} />}
    </div>
  )
})

function ArbitrationRotations({
  next,
}: {
  next: { label: string; eta: string }[]
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium text-slate-300 uppercase tracking-wide">
        Upcoming Rotations
      </div>
      <div className="space-y-1.5">
        {next.map((rotation, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-700/20 border border-slate-600/20 hover:bg-slate-700/30 transition-colors"
          >
            <span className="text-sm text-slate-200 font-medium">
              {rotation.label}
            </span>
            {rotation.eta && (
              <span className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded-md">
                {rotation.eta}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const ArbitrationExpanded = React.memo(function ArbitrationExpanded({
  isLoading,
  scheduleText,
}: {
  isLoading: boolean
  scheduleText?: string
}) {
  const arbitrationStore = useArbitrationStore()
  const { data } = arbitrationStore

  const [current, setCurrent] = React.useState<string>('—')
  const [next, setNext] = React.useState<{ label: string; eta: string }[]>([])
  const currentTime = useTime()

  // Use store's parsed rotations if available, otherwise parse from scheduleText
  const rotations = React.useMemo(() => {
    if (data.parsedRotations.length > 0) {
      return data.parsedRotations
    }

    if (!scheduleText) return []

    return scheduleText
      .split('\n')
      .filter(Boolean)
      .map((r) => r.split(','))
      .map(([tsStr, code]) => ({
        ts: Number(tsStr) * 1000,
        code: code?.trim() || '',
        label: undefined,
        meta: undefined,
      }))
      .filter((x) => Number.isFinite(x.ts) && x.code)
      .sort((a, b) => a.ts - b.ts)
  }, [data.parsedRotations, scheduleText])

  // Memoize the cache key for expanded view
  const expandedCacheKey = React.useMemo(() => {
    const scheduleKey = scheduleText
      ? scheduleText.slice(0, 100)
      : 'no-schedule'
    const timeKey = Math.floor(currentTime.getTime() / 30_000) // 30-second buckets
    return `expanded-${scheduleKey}-${timeKey}`
  }, [scheduleText, currentTime])

  React.useEffect(() => {
    let cancelled = false

    if (isLoading) return

    // Check cache first
    const cached = arbitrationDataCache.get(expandedCacheKey)
    if (cached && Date.now() - cached.timestamp < 30_000) {
      // 30-second cache
      setCurrent(cached.line)
      setNext(cached.next)
      return
    }

    ;(async () => {
      try {
        if (rotations.length > 0) {
          const now = currentTime.getTime()

          // Use store's parsed rotations
          const currentRotation = rotations.filter((x) => x.ts <= now).pop()
          let currentLine = '—'
          if (currentRotation) {
            let curLabel = currentRotation.label
            let metaCur = currentRotation.meta

            if (!curLabel || !metaCur) {
              const { label, meta } = await getCachedNodeResolution(
                currentRotation.code,
              )
              curLabel = label
              metaCur = meta
            }

            currentLine = formatArbitrationLine(
              metaCur.type,
              metaCur.enemy,
              curLabel,
            )
          }

          // Process schedule data for future rotations (more rotations in expanded view)
          const upcomingRotations = rotations
            .filter((x) => x.ts > now)
            .slice(0, 12)

          // Process rotations in parallel
          const resolutionPromises = upcomingRotations.map(
            async ({ ts, code, label }) => {
              let resolvedLabel = label
              if (!resolvedLabel) {
                const { label: resolved } = await getCachedNodeResolution(code)
                resolvedLabel = resolved
              }
              const eta = formatDistanceToNow(new Date(ts), { addSuffix: true })
              return { label: resolvedLabel, eta }
            },
          )

          const resolvedRotations = await Promise.all(resolutionPromises)

          if (!cancelled) {
            setCurrent(currentLine)
            setNext(resolvedRotations)

            // Cache the processed data
            arbitrationDataCache.set(expandedCacheKey, {
              line: currentLine,
              next: resolvedRotations,
              timestamp: Date.now(),
            })
          }
        }
      } catch (error) {
        console.warn('Error processing expanded arbitration data:', error)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [expandedCacheKey, isLoading, rotations, currentTime])

  if (!current && !next.length) return null

  return (
    <div className="space-y-4">
      {current && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-slate-200 border-b border-slate-700/50 pb-2">
            Current Arbitration
          </div>
          <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
            <div className="text-sm font-medium text-slate-200 leading-relaxed">
              {current}
            </div>
          </div>
        </div>
      )}

      {!!next.length && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-slate-200 border-b border-slate-700/50 pb-2">
            Extended Rotation Schedule
          </div>
          <div className="grid gap-2 max-h-64 overflow-y-auto">
            {next.map((rotation, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 border border-slate-600/30"
              >
                <span className="text-sm text-slate-200">{rotation.label}</span>
                <span className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded">
                  {rotation.eta}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

