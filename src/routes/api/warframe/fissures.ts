import { createFileRoute } from '@tanstack/react-router'
import { type Platform } from '@/lib/warframe/api'
import { fetchWorldState } from '@/server/warframe/worldstate'
import { resolveMissionType, resolveNodeLabel } from '@/lib/helpers/helpers'

const validPlatforms: Platform[] = ['pc', 'ps4', 'xb1', 'swi']

function resolveFissureTier(modifier: string) {
  switch (modifier) {
    case 'VoidT1':
      return 'Lith'
    case 'VoidT2':
      return 'Meso'
    case 'VoidT3':
      return 'Neo'
    case 'VoidT4':
      return 'Axi'
    case 'VoidT5':
      return 'Requiem'
    case 'VoidT6':
      return 'Omnia'
    default:
      return modifier
  }
}

export const Route = createFileRoute('/api/warframe/fissures')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url)
          const platformParam = (url.searchParams.get('platform') ||
            'pc') as Platform
          const platform: Platform = validPlatforms.includes(platformParam)
            ? platformParam
            : 'pc'
          const worldstate = await fetchWorldState(platform)
          const typeParam = url.searchParams.get('type') || 'all'
          if (typeParam === 'normal') {
            return new Response(
              JSON.stringify(
                await Promise.all(
                  worldstate.ActiveMissions.filter(
                    (mission: any) =>
                      typeof mission.Hard === 'undefined' &&
                      typeof mission.hard === 'undefined',
                  ).map(async (mission: any) => {
                    const nodeCode = mission.Node || ''
                    const resolvedNodeLabel = await resolveNodeLabel(nodeCode)
                    return {
                      node: nodeCode,
                      resolvedNodeLabel:
                        resolvedNodeLabel || nodeCode || 'Unknown Node',
                      tier: resolveFissureTier(mission.Modifier),
                      missionType: resolveMissionType(mission.MissionType),
                      expiry: mission.Expiry.$date.$numberLong,
                    }
                  }),
                ),
              ),
              {
                headers: { 'Content-Type': 'application/json' },
              },
            )
          } else if (typeParam === 'steelPath') {
            return new Response(
              JSON.stringify(
                await Promise.all(
                  worldstate.ActiveMissions.filter(
                    (mission: any) =>
                      mission.Hard === true || mission.hard === true,
                  ).map(async (mission: any) => {
                    const nodeCode = mission.Node || ''
                    const resolvedNodeLabel = await resolveNodeLabel(nodeCode)
                    return {
                      node: nodeCode,
                      resolvedNodeLabel:
                        resolvedNodeLabel || nodeCode || 'Unknown Node',
                      tier: resolveFissureTier(mission.Modifier),
                      missionType: resolveMissionType(mission.MissionType),
                      expiry: mission.Expiry.$date.$numberLong,
                    }
                  }),
                ),
              ),
              { headers: { 'Content-Type': 'application/json' } },
            )
          } else {
            return new Response(
              JSON.stringify(await Promise.all(worldstate.ActiveMissions)),
              { headers: { 'Content-Type': 'application/json' } },
            )
          }
        } catch (error: any) {
          return new Response(
            JSON.stringify({
              error: error.message || 'Failed to fetch fissures',
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          )
        }
      },
    },
  },
})
