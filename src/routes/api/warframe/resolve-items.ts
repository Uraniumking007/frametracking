import { createFileRoute } from '@tanstack/react-router'
import { resolveMultipleItems } from '@/server/warframe/items'

export const Route = createFileRoute('/api/warframe/resolve-items')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { identifiers } = await request.json()

          if (!identifiers || !Array.isArray(identifiers)) {
            return new Response(
              JSON.stringify({ error: 'Invalid identifiers array' }),
              { status: 400, headers: { 'content-type': 'application/json' } },
            )
          }

          const resolved = await resolveMultipleItems(identifiers)
          return Response.json(resolved)
        } catch (err: any) {
          return new Response(
            JSON.stringify({
              error: err?.message || 'Failed to resolve items',
            }),
            { status: 500, headers: { 'content-type': 'application/json' } },
          )
        }
      },
    },
  },
})

