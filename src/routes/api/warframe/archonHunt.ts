import { createFileRoute } from '@tanstack/react-router'
import { getPlatformFromUrl } from "@/lib/warframe/platform";
import { fetchWorldState } from "@/server/warframe/worldstate";
import { resolveNodeLabel } from "@/lib/helpers/helpers";

export interface ArchonMission {
  missionType: string
  node: string
  resolvedNodeLabel?: string
}

export interface ArchonHuntResponse {
  boss: string
  eta: string
  missions: ArchonMission[]
}

export interface WorldStateArchonHunt {
  _id: { $oid: string }
  Activation: { $date: { $numberLong: string } }
  Expiry: { $date: { $numberLong: string } }
  Reward: string
  Seed: number
  Boss: string
  Missions: ArchonMission[]
}

async function transformArchonHuntData(
  worldStateArchonHunt: WorldStateArchonHunt,
): Promise<ArchonHuntResponse> {
  const now = Date.now()
  const expiryTime = parseInt(worldStateArchonHunt.Expiry.$date.$numberLong)
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

  // Resolve node labels for missions
  const resolvedMissions = await Promise.all(
    (worldStateArchonHunt.Missions || []).map(async (mission) => {
      const nodeCode = mission.node || ''
      const resolvedNodeLabel = await resolveNodeLabel(nodeCode)
      return {
        ...mission,
        node: nodeCode,
        resolvedNodeLabel: resolvedNodeLabel || nodeCode || 'Unknown Node',
      }
    }),
  )

  return {
    boss: worldStateArchonHunt.Boss.replace('SORTIE_BOSS_', ''),
    eta,
    missions: resolvedMissions,
  }
}

export const Route = createFileRoute('/api/warframe/archonHunt')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const platform = getPlatformFromUrl(request.url);
          const data = await fetchWorldState(platform)

          // Transform the world state archon hunt data
          if (
            data.LiteSorties &&
            Array.isArray(data.LiteSorties) &&
            data.LiteSorties.length > 0
          ) {
            const transformedArchonHunt = await transformArchonHuntData(
              data.LiteSorties[0],
            )
            return Response.json(transformedArchonHunt)
          }

          // Return empty archon hunt if none available
          return Response.json({
            boss: '',
            eta: 'No archon hunt available',
            missions: [],
          })
        } catch (err: any) {
          return new Response(
            JSON.stringify({
              error: err?.message || 'Failed to fetch archon hunt',
            }),
            { status: 500, headers: { 'content-type': 'application/json' } },
          )
        }
      },
    },
  },
})
