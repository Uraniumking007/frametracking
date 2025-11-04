import { createFileRoute } from '@tanstack/react-router'
import { getPlatformFromUrl } from "@/lib/warframe/platform";
import { fetchWorldState } from "@/server/warframe/worldstate";
import { resolveNodeLabel } from "@/lib/helpers/helpers";

export interface SortieVariant {
  missionType: string
  modifierType: string
  node: string
  resolvedNodeLabel?: string
  tileset: string
}

export interface SortieResponse {
  boss: string
  faction: string
  eta: string
  variants: SortieVariant[]
}

export interface WorldStateSortie {
  _id: { $oid: string }
  Activation: { $date: { $numberLong: string } }
  Expiry: { $date: { $numberLong: string } }
  Reward: string
  Seed: number
  Boss: string
  ExtraDrops: any[]
  Variants: Array<{
    missionType: string
    modifierType: string
    node: string
    tileset: string
  }>
  Twitter: boolean
}

async function transformSortieData(
  worldStateSortie: WorldStateSortie,
): Promise<SortieResponse> {
  const now = Date.now()
  const expiryTime = parseInt(worldStateSortie.Expiry.$date.$numberLong)
  const timeRemaining = expiryTime - now

  // Calculate ETA string
  let eta = ''
  if (timeRemaining > 0) {
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60))
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      eta = `${hours}h ${minutes}m`
    } else {
      eta = `${minutes}m`
    }
  } else {
    eta = 'Expired'
  }

  // Extract faction from boss name (common patterns)
  let faction = ''
  const boss = worldStateSortie.Boss || ''
  if (boss.includes('JACKAL') || boss.includes('CORPUS')) {
    faction = 'Corpus'
  } else if (
    boss.includes('GRINEER') ||
    boss.includes('VOR') ||
    boss.includes('KRIL')
  ) {
    faction = 'Grineer'
  } else if (boss.includes('INFESTED') || boss.includes('LEPHANTIS')) {
    faction = 'Infested'
  }

  // Resolve node labels for variants
  const resolvedVariants = await Promise.all(
    (worldStateSortie.Variants || []).map(async (variant) => {
      const nodeCode = variant.node || ''
      const resolvedNodeLabel = await resolveNodeLabel(nodeCode)
      return {
        ...variant,
        node: nodeCode,
        resolvedNodeLabel: resolvedNodeLabel || nodeCode || 'Unknown Node',
      }
    }),
  )

  return {
    boss: boss.replace('SORTIE_BOSS_', ''),
    faction,
    eta,
    variants: resolvedVariants,
  }
}

export const Route = createFileRoute('/api/warframe/sortie')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const platform = getPlatformFromUrl(request.url);
          const data = await fetchWorldState(platform)

          // Transform the world state sortie data
          if (
            data.Sorties &&
            Array.isArray(data.Sorties) &&
            data.Sorties.length > 0
          ) {
            const transformedSortie = await transformSortieData(data.Sorties[0])
            return Response.json(transformedSortie)
          }

          // Return empty sortie if none available
          return Response.json({
            boss: '',
            faction: '',
            eta: 'No sortie available',
            variants: [],
          })
        } catch (err: any) {
          return new Response(
            JSON.stringify({ error: err?.message || 'Failed to fetch sortie' }),
            { status: 500, headers: { 'content-type': 'application/json' } },
          )
        }
      },
    },
  },
})

