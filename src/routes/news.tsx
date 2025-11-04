import { createFileRoute, useSearch } from '@tanstack/react-router'
import type { Platform } from '@/lib/warframe/api'
import { NewsCard } from '@/components/dashboard/cards/NewsCard'

export const Route = createFileRoute('/news')({
  component: NewsPage,
})

function NewsPage() {
  const search = useSearch({ strict: false }) as { platform?: Platform }
  const platform = (search.platform ?? 'pc') as Platform

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="relative px-4 sm:px-6 py-6">
        <div className="mx-auto max-w-7xl">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              News
            </h1>
            <p className="text-slate-400 text-sm">
              Latest Warframe updates and announcements.
            </p>
          </header>
          <div className="grid gap-4">
            <NewsCard platform={platform} />
          </div>
        </div>
      </div>
    </div>
  )
}

