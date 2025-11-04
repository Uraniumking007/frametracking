import { resolveFactionForNode, resolveFactionLabel } from '@/lib/helpers/helpers'
import { resolveNodeLabel, resolveNodeMeta } from '@/lib/helpers/helpers'

export interface SteelPathIncursion {
  ts: string
  code: string
  label: string
  faction: string
  factionLabel: string
  missionType?: string
}

// Returns only today's Steel Path incursion entries as structured data
export async function getSpIncursionsTodayText(): Promise<SteelPathIncursion[]> {
  try {
    const data = await fetch('https://browse.wf/sp-incursions.txt')
    const txt = await data.text()
    const raw = (txt || '').trim()
    if (!raw) return []

    // Split by newlines and also split concatenated segments that start with a 10-digit unix ts followed by ';'
    const byLine = raw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    const segments: string[] = []
    for (const line of byLine) {
      const parts = line.split(/(?=\b\d{10};)/g)
      for (const p of parts) {
        const s = p.trim()
        if (s) segments.push(s)
      }
    }
    if (!segments.length) return []

    // Compute today's date in UTC
    const today = new Date()
    const y = today.getUTCFullYear()
    const m = today.getUTCMonth()
    const d = today.getUTCDate()

    const expanded: string[] = []
    for (const seg of segments) {
      if (seg.includes(';')) {
        const [tsStr, codesStr] = seg.split(';')
        const tsMs = Number(tsStr) * 1000
        if (!Number.isFinite(tsMs)) continue
        const dt = new Date(tsMs)
        if (
          dt.getUTCFullYear() === y &&
          dt.getUTCMonth() === m &&
          dt.getUTCDate() === d
        ) {
          const codes = (codesStr || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
          for (const code of codes) expanded.push(`${tsStr},${code}`)
        }
      } else if (seg.includes(',')) {
        const [tsStr] = seg.split(',')
        const tsMs = Number(tsStr) * 1000
        if (!Number.isFinite(tsMs)) continue
        const dt = new Date(tsMs)
        if (
          dt.getUTCFullYear() === y &&
          dt.getUTCMonth() === m &&
          dt.getUTCDate() === d
        ) {
          expanded.push(seg)
        }
      }
    }

    if (!expanded.length) return []
    // Convert expanded (array of "ts,code,ts,code,...") into array of objects: { [ts]: code }
    const expandedArr: { ts: string; code: string }[] = []
    for (const entry of expanded) {
      // entry is a string like "1759968000,SolNode107,1759968000,SolNode30,..."
      const parts = entry.split(',')
      expandedArr.push({ ts: parts[0], code: parts[1] })
    }

    const resolved = expandedArr.map((e) => {
      return { ts: e.ts, code: e.code }
    })
    const resolvedArr = await Promise.all(
      resolved.map(async (e) => {
        const [label, faction, meta] = await Promise.all([
          resolveNodeLabel(e.code),
          resolveFactionForNode(e.code),
          resolveNodeMeta(e.code),
        ])
        const factionLabel = await resolveFactionLabel(faction)
        return {
          ts: e.ts,
          code: e.code,
          label,
          faction: faction || '',
          factionLabel: factionLabel || '',
          missionType: meta?.type,
        }
      }),
    )

    return resolvedArr
  } catch {
    return []
  }
}

