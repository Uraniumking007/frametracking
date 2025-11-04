import { createFileRoute } from '@tanstack/react-router'
import { type Platform } from '@/lib/warframe/api'
import { fetchWorldState } from '@/server/warframe/worldstate'
import { resolveNodeLabel, resolveFactionLabel } from '@/lib/helpers/helpers'
import { resolveItemName } from '@/server/warframe/items'

const validPlatforms: Platform[] = ['pc', 'ps4', 'xb1', 'swi']

async function resolveInvasionData(invasions: any[]): Promise<any[]> {
  const resolvedInvasions = await Promise.all(
    invasions.map(async (inv: any) => {
      try {
        // Resolve node label
        const nodeLabel = await resolveNodeLabel(inv.Node || inv.node)

        // Resolve faction names
        const attackerFaction = await resolveFactionLabel(
          inv.Faction || inv.attackerFaction,
        )
        const defenderFaction = await resolveFactionLabel(
          inv.DefenderFaction || inv.defenderFaction,
        )

        // Resolve rewards
        const formatReward = async (reward: any): Promise<string> => {
          if (!reward) return ''
          const parts: string[] = []
          try {
            if (Array.isArray(reward.countedItems)) {
              for (const it of reward.countedItems) {
                const qty = it.ItemCount || it.count || it.quantity || it.qty
                const itemType =
                  it.ItemType || it.type || it._id || it.item || it.name
                if (itemType) {
                  try {
                    // Use server-side WFCD items resolver
                    const displayName = await resolveItemName(itemType)
                    console.log(`Resolved ${itemType} -> ${displayName}`)
                    parts.push(`${qty ? qty + 'x ' : ''}${displayName}`)
                  } catch (error) {
                    console.error(`Error resolving ${itemType}:`, error)
                    // Fallback to extracting name from path
                    const fallbackName = itemType.split('/').pop() || itemType
                    parts.push(`${qty ? qty + 'x ' : ''}${fallbackName}`)
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error formatting reward:', error)
          }
          return parts.join(' + ')
        }

        const atkReward = inv.AttackerReward || inv.attackerReward || {}
        const defReward = inv.DefenderReward || inv.defenderReward || {}
        const atkRewardText = await formatReward(atkReward)
        const defRewardText = await formatReward(defReward)

        const rewardText = [
          atkRewardText ? `Atk: ${atkRewardText}` : '',
          defRewardText ? `Def: ${defRewardText}` : '',
        ]
          .filter(Boolean)
          .join('  |  ')

        return {
          ...inv,
          resolvedNodeLabel: nodeLabel,
          resolvedAttackerFaction: attackerFaction,
          resolvedDefenderFaction: defenderFaction,
          resolvedRewardText: rewardText,
        }
      } catch (error) {
        // Return original data if resolution fails
        return inv
      }
    }),
  )

  return resolvedInvasions
}

export const Route = createFileRoute('/api/warframe/invasions')({
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
          const data = await fetchWorldState(platform)
          const invasions = data.Invasions || []

          // Resolve all invasion data server-side
          const resolvedInvasions = await resolveInvasionData(invasions)

          return Response.json(resolvedInvasions)
        } catch (err: any) {
          return new Response(
            JSON.stringify({
              error: err?.message || 'Failed to fetch invasions',
            }),
            { status: 500, headers: { 'content-type': 'application/json' } },
          )
        }
      },
    },
  },
})

