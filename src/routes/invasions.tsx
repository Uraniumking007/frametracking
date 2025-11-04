import { createFileRoute } from '@tanstack/react-router'
import { InvasionsCard } from '@/components/dashboard/cards/InvasionsCard'

export const Route = createFileRoute('/invasions')({
  component: InvasionsPage,
})

function InvasionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="relative px-4 sm:px-6 py-6">
        <div className="mx-auto max-w-7xl">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Invasions
            </h1>
            <p className="text-slate-400 text-sm">
              Current invasions and rewards.
            </p>
          </header>
          <div className="grid gap-4">
            <InvasionsCard full />
          </div>
        </div>
      </div>
    </div>
  )
}

