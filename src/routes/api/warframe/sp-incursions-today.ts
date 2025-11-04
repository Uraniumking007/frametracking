import { createFileRoute } from '@tanstack/react-router'
import { getSpIncursionsTodayText } from '@/server/warframe/spIncursions'

export const Route = createFileRoute('/api/warframe/sp-incursions-today')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const data = await getSpIncursionsTodayText()
          return Response.json(data)
        } catch (err: any) {
          return Response.json(
            { error: err?.message || 'Failed to fetch todays SP incursions' },
            { status: 500 },
          )
        }
      },
    },
  },
})
