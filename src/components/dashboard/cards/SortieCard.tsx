import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Clock, Shield, Target } from 'lucide-react'
import { memo, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ExpandableCard } from '@/components/ui/expandable-card'
import type {
  SortieResponse,
  SortieVariant,
} from '@/routes/api/warframe/sortie'
import {
  resolveMissionType,
  resolveNodeLabel,
  safeText,
} from '@/lib/helpers/helpers'
import type { Platform } from '@/lib/warframe/api'
import { fetchSortie } from '@/lib/warframe/api'
import { useSearch } from '@tanstack/react-router'

// Type definitions for better type safety
interface SortieCardProps {
  platform: Platform
}

interface SortieRowProps {
  variant: SortieVariant
  index: number
  isExpanded: boolean
  sortieData?: SortieResponse
}

interface SortieTableProps {
  isLoading: boolean
  data?: SortieResponse
  limit?: number
}

interface SortieExpandedProps {
  isLoading: boolean
  data?: SortieResponse
}
export const SortieCard = memo(function SortieCard(props: SortieCardProps) {
  const sortie = useQuery({
    queryKey: ['wf', props.platform, 'sortie'],
    queryFn: () => fetchSortie(props.platform),
    staleTime: 10 * 60_000, // 10 minutes - sortie changes daily
  })

  const sortieCount = useMemo(
    () => sortie.data?.variants?.length || 0,
    [sortie.data?.variants?.length],
  )

  const title = useMemo(
    () => `Daily Sortie ${sortieCount > 0 ? `(${sortieCount})` : ''}`,
    [sortieCount],
  )

  const expandedContent = useMemo(
    () => <SortieExpanded isLoading={sortie.isLoading} data={sortie.data} />,
    [sortie.isLoading, sortie.data],
  )

  return (
    <ExpandableCard title={title} expanded={expandedContent}>
      <Card className="group hover:shadow-xl transition-all duration-300 border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm hover:from-slate-800/70 hover:to-slate-900/70 flex flex-col h-72 md:h-80 overflow-hidden">
        <CardHeader className="px-4 border-b border-slate-700/30">
          <CardTitle className="flex items-center gap-2 text-white">
            <div className="relative">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-2 h-2 bg-amber-300 rounded-full animate-ping opacity-30"></div>
            </div>
            <span className="text-sm font-medium">Daily Sortie</span>
            {sortieCount > 0 && (
              <Badge className="bg-amber-500/20 text-amber-200 border-amber-400/40 text-xs px-2 py-0.5 font-medium">
                {sortieCount}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          <div className="flex justify-center">
            <div className="w-full max-w-full">
              <SortieTable isLoading={sortie.isLoading} data={sortie.data} />
            </div>
          </div>
        </CardContent>
      </Card>
    </ExpandableCard>
  )
})

const SortieExpanded = memo(function SortieExpanded({
  isLoading,
  data,
}: SortieExpandedProps) {
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

  if (!data || !data.variants?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertTriangle className="w-12 h-12 text-slate-400 mb-3" />
        <div className="text-slate-400 text-sm">
          No sortie missions available
        </div>
        <div className="text-slate-500 text-xs mt-1">
          Sortie missions will appear here when available
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-full">
        <div className="space-y-4">
          <SortieTable isLoading={isLoading} data={data} />
        </div>
      </div>
    </div>
  )
})

const SortieTable = memo(function SortieTable({
  isLoading,
  data,
  limit,
}: SortieTableProps) {
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

  if (!data || !data.variants?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <AlertTriangle className="w-8 h-8 text-slate-400 mb-2" />
        <div className="text-slate-400 text-sm">
          No sortie missions available
        </div>
      </div>
    )
  }

  const variants = data.variants || []
  const slice = typeof limit === 'number' ? variants.slice(0, limit) : variants

  return (
    <div className="space-y-3">
      {slice.map((variant, index) => (
        <SortieRow
          key={`${variant.node}-${index}`}
          variant={variant}
          index={index}
          isExpanded={false}
          sortieData={data}
        />
      ))}
    </div>
  )
})

// Custom hook to resolve node labels asynchronously
function useResolvedNodeLabel(node: string) {
  const [resolvedLabel, setResolvedLabel] = useState<string>(node)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!node) {
      setResolvedLabel('—')
      return
    }

    const resolveLabel = async () => {
      setIsLoading(true)
      try {
        const label = await resolveNodeLabel(node)
        setResolvedLabel(label)
      } catch (error) {
        console.warn('Failed to resolve node label:', error)
        setResolvedLabel(node)
      } finally {
        setIsLoading(false)
      }
    }

    resolveLabel()
  }, [node])

  return { resolvedLabel, isLoading }
}

// Custom hook to process sortie expiration
function useSortieExpiration(data?: SortieResponse) {
  return useMemo(() => {
    if (!data?.eta || data.eta === 'No sortie available') {
      return { expiresText: '—', isExpiringSoon: false }
    }

    // For now, we'll show the ETA as provided by the API
    // In a real implementation, you might want to parse the actual expiry time
    const expiresText = data.eta
    const isExpiringSoon = data.eta.includes('m') && !data.eta.includes('h')

    return { expiresText, isExpiringSoon }
  }, [data?.eta])
}

const SortieRow = memo(function SortieRow({
  variant,
  index,
  isExpanded,
  sortieData,
}: SortieRowProps) {
  const { expiresText, isExpiringSoon } = useSortieExpiration(sortieData)

  const missionTypeText = useMemo(() => {
    return resolveMissionType(variant.missionType) || variant.missionType
  }, [variant.missionType])

  const locationText = useMemo(() => {
    const nodeLabel =
      (variant as any).resolvedNodeLabel || variant.node || 'Unknown Node'
    return `${nodeLabel} • ${missionTypeText}`
  }, [variant, missionTypeText])

  return (
    <div className="group p-3 rounded-lg bg-slate-700/30 border border-slate-600/30 hover:bg-slate-700/50 hover:border-slate-500/50 transition-all duration-200">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
            <span className="text-xs font-bold text-amber-300">
              {index + 1}
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div className="text-sm font-medium text-slate-200 truncate">
              {locationText}
            </div>
          </div>
          {safeText(variant.modifierType) && (
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-3 h-3 text-blue-400 flex-shrink-0" />
              <div className="relative flex-shrink-0">
                <Badge
                  variant="secondary"
                  className={`bg-blue-500/10 text-blue-200 border-blue-400/20 text-xs ${isExpanded ? 'cursor-help' : ''}`}
                  title={
                    isExpanded ? safeText(variant.modifierType) : undefined
                  }
                >
                  {safeText(variant.modifierType)}
                </Badge>
                {isExpanded && safeText(variant.modifierType) && (
                  <div className="absolute bottom-full left-0 mb-3 px-3 py-2 bg-slate-900 text-slate-200 text-xs rounded-lg border border-slate-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-normal break-words z-50 shadow-xl w-64 max-w-[calc(100vw-4rem)]">
                    {safeText(variant.modifierType)}
                    <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-600"></div>
                  </div>
                )}
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
                Ends Soon
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

