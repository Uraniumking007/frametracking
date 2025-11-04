import { createFileRoute } from '@tanstack/react-router'
import { fetchOracleBountyCycle } from '@/lib/warframe/api'
import { resolveNodeLabel } from '@/lib/helpers/helpers'

async function resolveBountyData(bounties: any): Promise<any> {
  if (!bounties) return bounties

  // Handle different bounty data structures
  if (bounties?.bounties) {
    // Resolve nodes in bountyCycle.bounties
    const resolvedBounties: Record<string, any[]> = {}

    for (const [syndicateTag, syndicateBounties] of Object.entries(
      bounties.bounties,
    )) {
      if (Array.isArray(syndicateBounties)) {
        resolvedBounties[syndicateTag] = await Promise.all(
          syndicateBounties.map(async (bounty: any) => {
            if (bounty.node) {
              const resolvedNodeLabel = await resolveNodeLabel(bounty.node)
              return {
                ...bounty,
                resolvedNodeLabel,
              }
            }
            return bounty
          }),
        )
      } else {
        resolvedBounties[syndicateTag] = syndicateBounties as any[]
      }
    }

    return {
      ...bounties,
      bounties: resolvedBounties,
    }
  }

  // Handle direct bounty arrays
  if (Array.isArray(bounties)) {
    return Promise.all(
      bounties.map(async (bounty: any) => {
        if (bounty.node) {
          const resolvedNodeLabel = await resolveNodeLabel(bounty.node)
          return {
            ...bounty,
            resolvedNodeLabel,
          }
        }
        return bounty
      }),
    )
  }

  return bounties
}

export const Route = createFileRoute('/api/warframe/bounties')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const data = await fetchOracleBountyCycle()
          const resolvedData = await resolveBountyData(data)
          return Response.json(resolvedData)
        } catch (err: any) {
          return new Response(
            JSON.stringify({
              error: err?.message || 'Failed to fetch bounties',
            }),
            { status: 500, headers: { 'content-type': 'application/json' } },
          )
        }
      },
    },
  },
})

