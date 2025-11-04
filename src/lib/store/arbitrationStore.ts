import { useEffect, useState } from 'react'
import { fetchBrowseArbitrationSchedule } from '@/lib/warframe/api'

export interface ArbitrationScheduleData {
  scheduleText: string | null
  isLoading: boolean
  error: string | null
  lastUpdated: number | null
  parsedRotations: Array<{
    ts: number
    code: string
    label?: string
    meta?: { enemy?: string; type?: string }
  }>
}

interface ArbitrationStore {
  data: ArbitrationScheduleData
  isLoading: boolean
  fetchSchedule: () => Promise<void>
  refreshSchedule: () => Promise<void>
  getCurrentRotation: () => ArbitrationScheduleData['parsedRotations'][0] | null
  getUpcomingRotations: (
    limit?: number,
  ) => ArbitrationScheduleData['parsedRotations']
}

// Global state
let globalArbitrationData: ArbitrationScheduleData = {
  scheduleText: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  parsedRotations: [],
}

let forceUpdateCounter = 0
let forceUpdateCallbacks: Set<() => void> = new Set()

// Cache for parsed rotations
const rotationCache = new Map<
  string,
  {
    label: string
    meta: { enemy?: string; type?: string }
    timestamp: number
  }
>()

// Helper function to parse schedule text
function parseScheduleText(
  scheduleText: string,
): ArbitrationScheduleData['parsedRotations'] {
  if (!scheduleText) return []

  return scheduleText
    .split('\n')
    .filter(Boolean)
    .map((r) => r.split(','))
    .map(([tsStr, code]) => ({
      ts: Number(tsStr) * 1000,
      code: code?.trim() || '',
    }))
    .filter((x) => Number.isFinite(x.ts) && x.code)
    .sort((a, b) => a.ts - b.ts)
}

// Helper function to get cached node resolution
async function getCachedNodeResolution(code: string) {
  const cacheKey = code
  const cached = rotationCache.get(cacheKey)

  // Cache for 5 minutes
  if (cached && Date.now() - cached.timestamp < 5 * 60_000) {
    return cached
  }

  // Import resolveNodeLabel and resolveNodeMeta dynamically to avoid circular imports
  const { resolveNodeLabel, resolveNodeMeta } = await import(
    '@/lib/helpers/helpers'
  )

  const [label, meta] = await Promise.all([
    resolveNodeLabel(code),
    resolveNodeMeta(code),
  ])

  const result = { label, meta, timestamp: Date.now() }
  rotationCache.set(cacheKey, result)
  return result
}

// Helper function to resolve rotation labels
async function resolveRotationLabels(
  rotations: ArbitrationScheduleData['parsedRotations'],
) {
  const resolvedRotations = await Promise.all(
    rotations.map(async (rotation) => {
      const { label, meta } = await getCachedNodeResolution(rotation.code)
      return {
        ...rotation,
        label,
        meta,
      }
    }),
  )

  return resolvedRotations
}

function forceUpdate() {
  forceUpdateCounter++
  forceUpdateCallbacks.forEach((callback) => callback())
}

async function fetchScheduleData(): Promise<void> {
  if (globalArbitrationData.isLoading) return

  globalArbitrationData = {
    ...globalArbitrationData,
    isLoading: true,
    error: null,
  }
  forceUpdate()

  try {
    const scheduleText = await fetchBrowseArbitrationSchedule()
    const parsedRotations = parseScheduleText(scheduleText)

    // Resolve labels for current and next few rotations
    const now = Date.now()
    const relevantRotations = parsedRotations
      .filter(
        (r) => r.ts <= now + 2 * 60 * 60 * 1000, // Next 2 hours
      )
      .slice(0, 10) // Limit to 10 rotations

    const resolvedRotations = await resolveRotationLabels(relevantRotations)

    // Update parsed rotations with resolved data
    const updatedParsedRotations = parsedRotations.map((rotation) => {
      const resolved = resolvedRotations.find(
        (r) => r.ts === rotation.ts && r.code === rotation.code,
      )
      return resolved || rotation
    })

    globalArbitrationData = {
      scheduleText,
      isLoading: false,
      error: null,
      lastUpdated: Date.now(),
      parsedRotations: updatedParsedRotations,
    }
  } catch (error) {
    globalArbitrationData = {
      ...globalArbitrationData,
      isLoading: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch arbitration schedule',
    }
  }

  forceUpdate()
}

function refreshScheduleData(): Promise<void> {
  globalArbitrationData = {
    ...globalArbitrationData,
    lastUpdated: null, // Force refresh
  }
  return fetchScheduleData()
}

function getCurrentRotation():
  | ArbitrationScheduleData['parsedRotations'][0]
  | null {
  const now = Date.now()
  return (
    globalArbitrationData.parsedRotations.filter((r) => r.ts <= now).pop() ||
    null
  )
}

function getUpcomingRotations(
  limit: number = 6,
): ArbitrationScheduleData['parsedRotations'] {
  const now = Date.now()
  return globalArbitrationData.parsedRotations
    .filter((r) => r.ts > now)
    .slice(0, limit)
}

// Auto-refresh every 30 seconds
let refreshInterval: NodeJS.Timeout | null = null

function startAutoRefresh() {
  if (refreshInterval) return

  refreshInterval = setInterval(() => {
    if (
      globalArbitrationData.lastUpdated &&
      Date.now() - globalArbitrationData.lastUpdated > 30_000
    ) {
      fetchScheduleData()
    }
  }, 30_000)
}

export function useArbitrationStore(): ArbitrationStore {
  const [, setUpdateCounter] = useState(0)

  useEffect(() => {
    // Add force update callback
    const callback = () => {
      setUpdateCounter((prev) => prev + 1)
    }
    forceUpdateCallbacks.add(callback)

    // Start auto-refresh
    startAutoRefresh()

    // Initial fetch if no data
    if (
      !globalArbitrationData.scheduleText &&
      !globalArbitrationData.isLoading
    ) {
      fetchScheduleData()
    }

    return () => {
      forceUpdateCallbacks.delete(callback)
    }
  }, [])

  return {
    data: globalArbitrationData,
    isLoading: globalArbitrationData.isLoading,
    fetchSchedule: fetchScheduleData,
    refreshSchedule: refreshScheduleData,
    getCurrentRotation,
    getUpcomingRotations,
  }
}

// Export for manual usage
export const arbitrationStore: ArbitrationStore = {
  data: globalArbitrationData,
  isLoading: globalArbitrationData.isLoading,
  fetchSchedule: fetchScheduleData,
  refreshSchedule: refreshScheduleData,
  getCurrentRotation,
  getUpcomingRotations,
}

