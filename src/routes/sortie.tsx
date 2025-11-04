import { createFileRoute, useSearch } from '@tanstack/react-router'
import type { Platform } from '@/lib/warframe/api'
import { SortieCard } from '@/components/dashboard/cards/SortieCard'

export const Route = createFileRoute('/sortie')({
  component: SortiePage,
})

function SortiePage() {
  const search = useSearch({ strict: false }) as { platform?: Platform }
  const platform = (search.platform ?? 'pc') as Platform

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="relative px-4 sm:px-6 py-6">
        <div className="mx-auto max-w-7xl">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Sortie
            </h1>
            <p className="text-slate-400 text-sm">
              Today's sortie and rewards.
            </p>
          </header>
          <div className="grid gap-4">
            <SortieCard platform={platform} />
          </div>
        </div>
      </div>
    </div>
  )
}
