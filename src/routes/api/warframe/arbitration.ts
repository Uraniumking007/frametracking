import { createFileRoute } from '@tanstack/react-router'
import { fetchArbitration, type Platform } from '@/lib/warframe/api'

const validPlatforms: Platform[] = ['pc', 'ps4', 'xb1', 'swi']

export const Route = createFileRoute('/api/warframe/arbitration')({
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
          const data = await fetchArbitration(platform)
          return Response.json(data)
        } catch (err: any) {
          return new Response(
            JSON.stringify({
              error: err?.message || 'Failed to fetch arbitration',
            }),
            { status: 500, headers: { 'content-type': 'application/json' } },
          )
        }
      },
    },
  },
})
