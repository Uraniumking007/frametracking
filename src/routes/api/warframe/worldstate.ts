import { fetchWorldState } from '@/server/warframe/worldstate'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/warframe/worldstate')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const worldstate = await fetchWorldState()
          return new Response(JSON.stringify(worldstate), {
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          return new Response(
            JSON.stringify({ error: 'Failed to fetch world state' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          )
        }
      },
    },
  },
})

