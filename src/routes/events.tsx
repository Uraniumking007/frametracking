import { createFileRoute } from '@tanstack/react-router'
import { EventsCard } from '@/components/dashboard/cards/EventsCard'

export const Route = createFileRoute('/events')({
  component: EventsPage,
})

function EventsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="relative px-4 sm:px-6 py-6">
        <div className="mx-auto max-w-7xl">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Events
            </h1>
            <p className="text-slate-400 text-sm">
              Live events and special activities.
            </p>
          </header>
          <div className="grid gap-4">
            <EventsCard full />
          </div>
        </div>
      </div>
    </div>
  )
}

