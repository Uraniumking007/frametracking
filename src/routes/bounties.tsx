import { createFileRoute } from '@tanstack/react-router'
import { BountiesCard } from '@/components/dashboard/cards/BountiesCard'
import { SteelPathIncursionsCard } from '@/components/dashboard/cards/SteelPathIncursionsCard'

export const Route = createFileRoute('/bounties')({
  component: BountiesPage,
})

function BountiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="relative px-4 sm:px-6 py-6">
        <div className="mx-auto max-w-7xl">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Bounties
            </h1>
            <p className="text-slate-400 text-sm">
              Open world bounties and Steel Path incursions.
            </p>
          </header>
          <div className="grid gap-4">
            <BountiesCard full />
            <SteelPathIncursionsCard full />
          </div>
        </div>
      </div>
    </div>
  )
}

