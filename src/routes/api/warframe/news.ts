import { createFileRoute } from '@tanstack/react-router'
import { type Platform } from '@/lib/warframe/api'
import { fetchWorldState } from '@/server/warframe/worldstate'

const validPlatforms: Platform[] = ['pc', 'ps4', 'xb1', 'swi']

export const Route = createFileRoute('/api/warframe/news')({
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
          // Map the Events data to match the expected news format
          const newsItems =
            data.Events?.map((event: any) => {
              let eta: string | undefined
              try {
                if (event.Date) {
                  const dateValue = event.Date.$date?.$numberLong || event.Date
                  if (dateValue) {
                    eta = new Date(Number(dateValue)).toISOString()
                  }
                }
              } catch (e) {
                // Ignore date parsing errors
              }

              // Only get English messages
              const englishMessage = event.Messages?.find(
                (msg: any) => msg.LanguageCode === 'en',
              )?.Message

              // Skip items without English message or without ETA
              if (!englishMessage || !eta) {
                return null
              }

              return {
                id: event._id?.$oid || event._id || Math.random().toString(),
                title: englishMessage,
                eta,
                url: event.Prop,
                imageUrl: event.ImageUrl,
                priority: event.Priority,
                community: event.Community,
                date: event.Date,
              }
            })
              .filter((item: any) => item !== null)
              .reverse() || []
          return Response.json(newsItems)
        } catch (err: any) {
          return new Response(
            JSON.stringify({ error: err?.message || 'Failed to fetch news' }),
            { status: 500, headers: { 'content-type': 'application/json' } },
          )
        }
      },
    },
  },
})
