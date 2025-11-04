// Utilities to resolve internal node codes like "SolNode64" to readable labels
// using WFCD's public worldstate data.

import { fetchDictionary } from './dict'

export type SolNodeEntry = { value: string; enemy?: string; type?: string }

let solNodesCache: Record<string, SolNodeEntry> | null = null

// Helper to clear cache (useful for testing)
export function clearSolNodesCache() {
  solNodesCache = null
}

export async function fetchSolNodes(): Promise<Record<string, SolNodeEntry>> {
  if (solNodesCache && Object.keys(solNodesCache).length > 0)
    return solNodesCache

  // Use HTTP fetch for both client and server since the file is in public/
  // This avoids filesystem access issues in Vite SSR/edge runtime environments
  try {
    // Determine the base URL based on environment
    let url = '/data/nodes.json'

    if (typeof process !== 'undefined' && process.versions?.node) {
      const baseCandidates = [
        process.env.PUBLIC_BASE_URL,
        process.env.SITE_URL,
        process.env.URL,
        process.env.DEPLOY_URL,
        process.env.DEPLOY_PRIME_URL,
        process.env.NETLIFY_SITE_URL,
      ].filter((value): value is string => typeof value === 'string')

      const envBase = baseCandidates.length > 0 ? baseCandidates[0] : undefined

      if (envBase) {
        url = `${envBase.replace(/\/$/, '')}/data/nodes.json`
      } else if (process.env.NETLIFY_DEV === 'true') {
        const devPort = process.env.NETLIFY_DEV_PORT || '8888'
        url = `http://localhost:${devPort}/data/nodes.json`
      } else {
        const port = process.env.PORT || process.env.VITE_PORT || '3000'
        url = `http://localhost:${port}/data/nodes.json`
      }
    }

    const res = await fetch(url)

    if (!res.ok) {
      console.warn(
        `Failed to fetch nodes.json: ${res.status} ${res.statusText}`,
      )
      return {}
    }

    const parsed = (await res.json()) as Record<string, SolNodeEntry>

    // Only cache if we successfully loaded data
    if (parsed && Object.keys(parsed).length > 0) {
      solNodesCache = parsed
      return parsed
    }

    return {}
  } catch (error) {
    console.warn('Failed to fetch nodes.json:', error)
    return {}
  }
}

export async function resolveNodeLabel(code?: any): Promise<string> {
  const raw = safeText(code) ?? (code != null ? String(code) : "");
  if (!raw) return "—";
  const normalized = normalizeNodeCode(raw);
  const lookupKey = normalized || raw;
  const dict = await fetchSolNodes();

  // Try lookup with normalized key
  let label = dict[lookupKey]?.value || dict[raw]?.value;

  // If not found and it's a HexNode, try to provide a better fallback
  if (!label && lookupKey.startsWith("HexNode")) {
    // Hex nodes are typically locations in The Hex (1999 mode)
    // Try to extract meaningful info from the node code
    const hexNodeNum = lookupKey.replace(/^HexNode/i, "");
    if (hexNodeNum) {
      label = `Hex Node ${hexNodeNum}`;
    } else {
      label = "The Hex";
    }
  }

  return label || raw;
}

export async function resolveNodeMeta(
  code?: any,
): Promise<{ enemy?: string; type?: string }> {
  const raw = safeText(code) ?? (code != null ? String(code) : '')
  if (!raw) return {}
  const normalized = normalizeNodeCode(raw)
  const dict = await fetchSolNodes()
  const entry = dict[normalized]
  if (!entry) return {}
  return { enemy: entry.enemy, type: entry.type }
}

export function normalizeNodeCode(input: string): string {
  let s = input.trim();
  // Fix common typo variations like "SoleNode" -> "SolNode"
  s = s.replace(/^SoleNode/i, "SolNode");
  // Normalize case: ensure proper capitalization for SolNode prefix
  s = s.replace(/^solnode/i, "SolNode");
  // Normalize HexNode prefix (case-insensitive)
  s = s.replace(/^hexnode/i, "HexNode");
  // Strip leading zeros from numeric suffix (e.g., SolNode000 -> SolNode0)
  const m = s.match(/^([A-Za-z]+)(\d+)$/);
  if (m) {
    const prefix = m[1];
    // Normalize prefix: capitalize first letter, lowercase the rest, then fix common patterns
    const normalizedPrefix =
      prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase();
    // Fix common node prefixes
    let fixedPrefix = normalizedPrefix;
    if (normalizedPrefix === "Solnode") {
      fixedPrefix = "SolNode";
    } else if (normalizedPrefix === "Hexnode") {
      fixedPrefix = "HexNode";
    }
    const num = String(parseInt(m[2], 10));
    return `${fixedPrefix}${num}`;
  }
  return s;
}

export function safeText(v: any): string | undefined {
  if (!v) return undefined
  if (typeof v === 'string') return v
  if (typeof v === 'object') {
    if (typeof v.value === 'string') return v.value
    if (typeof v.type === 'string') return v.type
    if (typeof v.enemy === 'string') return v.enemy
  }
  return undefined
}

export function formatArbitrationLine(
  type?: any,
  enemy?: any,
  nodeLabel?: string,
) {
  const parts: string[] = []
  const typeStr = safeText(type)
  const enemyStr = safeText(enemy)
  if (typeStr) parts.push(typeStr)
  if (enemyStr) parts.push(enemyStr)
  const prefix = parts.length ? parts.join(' - ') : undefined
  if (prefix && nodeLabel) return `${prefix} @ ${nodeLabel}`
  if (nodeLabel) return nodeLabel
  return prefix || '—'
}

export function resolveMissionType(type: string): string {
  const missionTypes: Record<string, string> = {
    MT_ARENA: 'Rathuum',
    MT_ARMAGEDDON: 'Void Armageddon',
    MT_ARTIFACT: 'Disruption',
    MT_ASSAULT: 'Assault',
    MT_ASSASSINATION: 'Assassination',
    MT_CAPTURE: 'Capture',
    MT_CORRUPTION: 'Void Flood',
    MT_DEFAULT: 'Unknown',
    MT_DEFENSE: 'Defense',
    MT_ENDLESS_EXTERMINATION: '(Elite) Sanctuary Onslaught',
    MT_EVACUATION: 'Defection',
    MT_EXCAVATE: 'Excavation',
    MT_EXTERMINATION: 'Exterminate',
    MT_HIVE: 'Hive Sabotage',
    MT_INTEL: 'Spy',
    MT_LANDSCAPE: 'Landscape',
    MT_MOBILE_DEFENSE: 'Mobile Defense',
    MT_PURIFY: 'Infested Salvage',
    MT_PVP: 'Conclave',
    MT_RACE: 'Rush (Archwing)',
    MT_RESCUE: 'Rescue',
    MT_RETRIEVAL: 'Hijack',
    MT_SABOTAGE: 'Sabotage',
    MT_SURVIVAL: 'Survival',
    MT_TERRITORY: 'Interception',
    MT_VOID_CASCADE: 'Void Cascade',
  }

  return missionTypes[type] || type
}

// Faction and region resolution utilities
// Cache for export data
let factionsCache: any | null = null
let regionsCache: any | null = null

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return res.json() as Promise<T>
}

export async function fetchExportFactions() {
  if (factionsCache) return factionsCache
  factionsCache = await getJson<any>(
    'https://raw.githubusercontent.com/calamity-inc/warframe-public-export-plus/senpai/ExportFactions.json',
  )
  return factionsCache
}

export async function fetchExportRegions() {
  if (regionsCache) return regionsCache
  regionsCache = await getJson<any>(
    'https://raw.githubusercontent.com/calamity-inc/warframe-public-export-plus/senpai/ExportRegions.json',
  )
  return regionsCache
}

// Best-effort resolver to map a node code (e.g. SolNode450) to a faction label using
// ExportRegions + ExportFactions. Falls back to undefined if not found.
export async function resolveFactionForNode(
  nodeCode?: string,
): Promise<string | undefined> {
  if (!nodeCode) return undefined
  const regions = await fetchExportRegions()
  const factions = await fetchExportFactions()

  const getFactionName = (idxOrKey: any): string | undefined => {
    try {
      if (typeof idxOrKey === 'number') {
        const entry = Array.isArray(factions)
          ? factions[idxOrKey]
          : factions?.[idxOrKey]
        return entry?.name || entry?.label || entry?.locName || undefined
      }
      if (typeof idxOrKey === 'string') {
        const byKey = factions?.[idxOrKey]
        return byKey?.name || byKey?.label || byKey?.locName || idxOrKey
      }
    } catch {}
    return undefined
  }

  const checkEntry = (entry: any): string | undefined => {
    if (!entry || typeof entry !== 'object') return undefined
    // Direct mappings by known fields
    if (
      typeof entry.nodeCode === 'string' &&
      entry.nodeCode.toLowerCase() === String(nodeCode).toLowerCase()
    ) {
      return getFactionName(entry.faction ?? entry.factionIndex)
    }
    // Arrays of node codes
    for (const key of Object.keys(entry)) {
      const val = entry[key]
      if (Array.isArray(val)) {
        if (
          val.some(
            (v) => String(v).toLowerCase() === String(nodeCode).toLowerCase(),
          )
        ) {
          return getFactionName(entry.faction ?? entry.factionIndex)
        }
      }
      if (typeof val === 'string') {
        if (val.toLowerCase() === String(nodeCode).toLowerCase()) {
          return getFactionName(entry.faction ?? entry.factionIndex)
        }
      }
    }
    return undefined
  }

  // Regions could be an array or object. Traverse shallowly.
  try {
    if (Array.isArray(regions)) {
      for (const r of regions) {
        const name = checkEntry(r)
        if (name) return name
      }
    } else if (regions && typeof regions === 'object') {
      for (const k of Object.keys(regions)) {
        const name = checkEntry(regions[k])
        if (name) return name
      }
    }
  } catch {}

  return undefined
}

export async function resolveFactionLabel(
  faction?: string,
): Promise<string | undefined> {
  if (!faction) return undefined
  const cleanedFaction = faction.replace(/\d+/g, '')
  try {
    const res = await fetch(
      'https://raw.githubusercontent.com/calamity-inc/warframe-public-export-plus/refs/heads/senpai/ExportFactions.json',
    )
    if (!res.ok) return cleanedFaction
    const factions: Record<string, { index: number; name: string }> =
      await res.json()
    for (const [key, value] of Object.entries(factions)) {
      if (value.name.includes(cleanedFaction)) {
        return key.replace(/^fc_/i, '')
      }
    }
    return cleanedFaction.replace(/[^a-z]/gi, '')
  } catch {
    return cleanedFaction
  }
}

export async function resolveEventDescription(
  description: string,
): Promise<string> {
  if (!description) return '—'
  const dict = await fetchDictionary('en')
  const label = dict[description] || description
  return label
}

