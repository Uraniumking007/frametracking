import { createFileRoute } from '@tanstack/react-router'
import { getPlatformFromUrl } from "@/lib/warframe/platform";
import { fetchWorldState } from "@/server/warframe/worldstate";
import { resolveNodeLabel, resolveFactionLabel } from "@/lib/helpers/helpers";
import { resolveItemName } from "@/server/warframe/items";
import { resolveLocalizedText } from "@/lib/helpers/dict";

async function resolveEventData(events: any[]): Promise<any[]> {
  const resolvedEvents = await Promise.all(
    events.map(async (event: any) => {
      try {
        // Resolve description
        const description = event.Desc || event.ToolTip || event.description || event.tooltip || ''
        const resolvedDescription = description.startsWith('/Lotus/Language/')
          ? await resolveLocalizedText(description)
          : description

        // Resolve location from Node field
        let location = ''
        if (event.Node) {
          location = await resolveNodeLabel(event.Node)
        }

        // Resolve faction
        const faction = event.faction ? await resolveFactionLabel(event.faction) : ''

        // Resolve rewards
        const resolvedRewards: string[] = []
        
        // Main reward items
        if (event.Reward?.items) {
          for (const itemPath of event.Reward.items) {
            try {
              const itemName = await resolveItemName(itemPath)
              resolvedRewards.push(itemName)
            } catch (error) {
              console.error(`Error resolving reward item ${itemPath}:`, error)
              resolvedRewards.push(itemPath.split('/').pop() || itemPath)
            }
          }
        }

        // Interim reward items
        if (event.InterimRewards) {
          for (const interimReward of event.InterimRewards) {
            if (interimReward.items) {
              for (const itemPath of interimReward.items) {
                try {
                  const itemName = await resolveItemName(itemPath)
                  resolvedRewards.push(itemName)
                } catch (error) {
                  console.error(`Error resolving interim reward item ${itemPath}:`, error)
                  resolvedRewards.push(itemPath.split('/').pop() || itemPath)
                }
              }
            }
          }
        }

        return {
          ...event,
          resolvedDescription,
          resolvedLocation: location,
          resolvedFaction: faction,
          resolvedRewards: [...new Set(resolvedRewards)], // Remove duplicates
        }
      } catch (error) {
        console.error('Error resolving event data:', error)
        return event
      }
    })
  )

  return resolvedEvents
}

export const Route = createFileRoute('/api/warframe/events')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const platform = getPlatformFromUrl(request.url);
          const data = await fetchWorldState(platform)
          const events = data.Goals || []

          // Resolve all event data server-side
          const resolvedEvents = await resolveEventData(events)

          return Response.json(resolvedEvents)
        } catch (err: any) {
          return new Response(
            JSON.stringify({ error: err?.message || 'Failed to fetch events' }),
            { status: 500, headers: { 'content-type': 'application/json' } },
          )
        }
      },
    },
  },
})

