import { z } from 'zod'

export type Platform = 'pc' | 'ps4' | 'xb1' | 'swi'

const baseUrl = (platform: Platform) =>
  `https://api.warframestat.us/${platform}`

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return res.json() as Promise<T>
}

export const newsItem = z.object({
  id: z.string(),
  title: z.string(),
  eta: z.string().optional(),
})

export async function fetchNews(platform: Platform) {
  return getJson<z.infer<typeof newsItem>[]>(
    `/api/warframe/news?platform=${platform}`,
  )
}

export async function fetchArbitration(platform: Platform) {
  return getJson<any>(`${baseUrl(platform)}/arbitration`)
}

export async function fetchAlerts(platform: Platform) {
  return getJson<any[]>(`/api/warframe/alerts?platform=${platform}`)
}

export async function fetchEvents(platform: Platform) {
  return getJson<any[]>(`/api/warframe/events?platform=${platform}`)
}

export async function fetchFissures(
  platform: Platform,
  type: 'normal' | 'steelPath' = 'normal',
) {
  const rows = await getJson<any[]>(
    `/api/warframe/fissures?platform=${platform}&type=${type}`,
  )
  // Enrich with resolved node label and time remaining client-side
  const computeTimeLeft = (expiry?: any): string | undefined => {
    try {
      const exp = expiry ? new Date(expiry) : undefined
      if (!exp || isNaN(exp.getTime())) return undefined
      const diffMs = exp.getTime() - Date.now()
      if (diffMs <= 0) return 'Expired'
      const mins = Math.floor(diffMs / 60000)
      const secs = Math.floor((diffMs % 60000) / 1000)
      const mm = Math.max(0, mins)
      const ss = Math.max(0, secs)
      return `${mm}m ${ss}s`
    } catch {
      return undefined
    }
  }

  try {
    const { resolveNodeLabel, safeText } = await import('@/lib/helpers/helpers')
    const enriched = await Promise.all(
      rows.map(async (r) => {
        try {
          const nodeLabel = await resolveNodeLabel(r.node)
          const timeLeft = computeTimeLeft(r.expiry)
          return {
            ...r,
            resolvedNodeLabel:
              nodeLabel || safeText(r.node) || r.node || 'Unknown Node',
            timeLeft,
          }
        } catch {
          // If resolution fails for individual row, still set fallback
          return {
            ...r,
            resolvedNodeLabel: safeText(r.node) || r.node || 'Unknown Node',
            timeLeft: computeTimeLeft(r.expiry),
          }
        }
      }),
    )
    return enriched
  } catch {
    // Fallback: ensure every row has resolvedNodeLabel even if bulk enrichment fails
    return rows.map((r) => ({
      ...r,
      resolvedNodeLabel: r.node || 'Unknown Node',
      timeLeft: computeTimeLeft(r.expiry),
    }))
  }
}

export function sortFissuresByTier(
  fissures: any[],
  showOmniFirst: boolean = false,
) {
  const defaultTierOrder = ['Lith', 'Neo', 'Meso', 'Axi', 'Requiem', 'Omnia']
  const omniFirstTierOrder = ['Omnia', 'Lith', 'Neo', 'Meso', 'Axi', 'Requiem']

  const tierOrder = showOmniFirst ? omniFirstTierOrder : defaultTierOrder

  const sortedFissures = [...fissures].sort((a, b) => {
    const aTier = a.tier || ''
    const bTier = b.tier || ''

    const aIndex = tierOrder.indexOf(aTier)
    const bIndex = tierOrder.indexOf(bTier)

    // If both tiers are in the order array, sort by their position
    if (aIndex !== -1 && bIndex !== -1) {
      const result = aIndex - bIndex
      return result
    }

    // If only one tier is in the order array, prioritize it
    if (aIndex !== -1) {
      return -1
    }
    if (bIndex !== -1) {
      return 1
    }

    // If neither tier is in the order array, sort alphabetically
    const result = aTier.localeCompare(bTier)
    return result
  })

  return sortedFissures
}

export async function fetchSortie(platform: Platform) {
  return getJson<any>(`/api/warframe/sortie?platform=${platform}`)
}

export async function fetchArchonHunt(platform: Platform) {
  return getJson<any>(`/api/warframe/archonHunt?platform=${platform}`)
}

export async function fetchInvasions(platform: Platform) {
  return getJson<any[]>(`/api/warframe/invasions?platform=${platform}`)
}

export async function fetchCycles(platform: Platform) {
  return getJson<any>(`/api/warframe/cycles?platform=${platform}`)
}

export async function fetchBounties(platform: Platform) {
  return getJson<any>(`/api/warframe/bounties`)
}

async function getText(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return res.text()
}

export async function fetchBrowseArbitrationSchedule() {
  try {
    const txt = await getText('/data/arbys.txt')
    return txt
  } catch {
    return ''
  }
}

export async function fetchBrowseSteelPathIncursions() {
  try {
    const txt = await getText(
      'https://raw.githubusercontent.com/calamity-inc/warframe-public-export-plus/senpai/supplementals/sp-incursions.txt',
    )
    return txt
  } catch {
    return ''
  }
}

// Only today's Steel Path incursions (best-effort filter)
export async function fetchBrowseSteelPathIncursionsToday() {
  try {
    const txt = await getText(
      'https://raw.githubusercontent.com/calamity-inc/warframe-public-export-plus/senpai/supplementals/sp-incursions.txt',
    )
    const lines = (txt || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    // Prefer entries explicitly marked as "Now"
    const nowLines = lines.filter((l) => /^now\b/i.test(l))
    if (nowLines.length) return nowLines.join('\n')

    // Otherwise, keep entries whose timestamp falls on today's date (UTC)
    const today = new Date()
    const y = today.getUTCFullYear()
    const m = today.getUTCMonth()
    const d = today.getUTCDate()
    const todays = lines.filter((l) => {
      const parts = l.split(',')
      if (parts.length < 2) return false
      const ts = Number(parts[0]) * 1000
      if (!Number.isFinite(ts)) return false
      const dt = new Date(ts)
      return (
        dt.getUTCFullYear() === y &&
        dt.getUTCMonth() === m &&
        dt.getUTCDate() === d
      )
    })
    return todays.join('\n')
  } catch {
    return ''
  }
}

// Environment cycles (browse.wf, best-effort text feeds)
export async function fetchBrowseCetusCycleText() {
  try {
    const txt = await getText(
      'https://raw.githubusercontent.com/calamity-inc/warframe-public-export-plus/senpai/supplementals/cetus.txt',
    )
    return txt
  } catch {
    return ''
  }
}

export async function fetchBrowseVallisCycleText() {
  try {
    const txt = await getText(
      'https://raw.githubusercontent.com/calamity-inc/warframe-public-export-plus/senpai/supplementals/vallis.txt',
    )
    return txt
  } catch {
    return ''
  }
}

export async function fetchBrowseCambionCycleText() {
  try {
    const txt = await getText(
      'https://raw.githubusercontent.com/calamity-inc/warframe-public-export-plus/senpai/supplementals/cambion.txt',
    )
    return txt
  } catch {
    return ''
  }
}

// Bounties (browse.wf, best-effort text feed)
export async function fetchBrowseBountiesText() {
  try {
    const txt = await getText(
      'https://raw.githubusercontent.com/calamity-inc/warframe-public-export-plus/senpai/supplementals/bounties.txt',
    )
    return txt
  } catch {
    return ''
  }
}

// Oracle API bounties endpoints
export async function fetchOracleBountyCycle() {
  try {
    return getJson<any>('https://oracle.browse.wf/bounty-cycle')
  } catch {
    return null
  }
}

export async function fetchOracleLocationBounties() {
  try {
    return getJson<any>('https://oracle.browse.wf/location-bounties')
  } catch {
    return null
  }
}

export async function fetchOracleWorldState() {
  try {
    return getJson<any>('https://oracle.browse.wf/worldState.json')
  } catch {
    return null
  }
}

// Public Export Plus datasets (GitHub)
let challengesCache: any | null = null

export async function fetchExportChallenges() {
  if (challengesCache) return challengesCache
  challengesCache = await getJson<any>(
    'https://browse.wf/warframe-public-export-plus/ExportChallenges.json',
  )
  return challengesCache
}

// Re-export faction/region resolvers from helpers to maintain API compatibility
export {
  fetchExportFactions,
  fetchExportRegions,
  resolveFactionForNode,
  resolveFactionLabel,
} from '@/lib/helpers/helpers'

