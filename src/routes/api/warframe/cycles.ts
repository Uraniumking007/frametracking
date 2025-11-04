import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/warframe/cycles')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const formatTimeLeft = (msRemaining: number) => {
            const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000))
            const hours = Math.floor(totalSeconds / 3600)
            const minutes = Math.floor((totalSeconds % 3600) / 60)
            const seconds = totalSeconds % 60
            const pad = (n: number) => n.toString().padStart(2, '0')
            return hours > 0
              ? `${hours}:${pad(minutes)}:${pad(seconds)}`
              : `${minutes}:${pad(seconds)}`
          }

          // Anchor to match browse.wf snapshot exactly at 2025-10-31T08:33:06Z
          const ANCHOR = Date.UTC(2025, 9, 31, 8, 33, 6)

          const now = Date.now()

          // Vallis (Orb Vallis), cycle 26m40s with warm first 6m40s then cold 20m
          // Derived to match: Cold 7m13s at ANCHOR
          const cycleLenVallis = 1_600_000 // 26m40s
          const warmLenVallis = 400_000 // 6m40s
          const coldLenVallis = cycleLenVallis - warmLenVallis // 20m
          const targetElapsedVallis = warmLenVallis + (coldLenVallis - 433_000)
          const EPOCH_VALLIS = ANCHOR - targetElapsedVallis

          const cyclesSinceVallis = Math.trunc(
            (now - EPOCH_VALLIS) / cycleLenVallis,
          )
          const cycleStartVallis =
            EPOCH_VALLIS + cyclesSinceVallis * cycleLenVallis
          const coldStart = cycleStartVallis + warmLenVallis
          const cycleEndVallis = cycleStartVallis + cycleLenVallis
          const isCold = now > coldStart
          const stateEndVallis = isCold ? cycleEndVallis : coldStart

          const vallis = {
            state: isCold ? 'cold' : 'warm',
            expiry: new Date(stateEndVallis).toISOString(),
            timeLeft: formatTimeLeft(stateEndVallis - now),
          }

          // Cetus (Plains of Eidolon): day (100m) / night (50m)
          // Derived to match: Night 13m22s at ANCHOR
          const cetusDayLen = 100 * 60 * 1000
          const cetusNightLen = 50 * 60 * 1000
          const cetusCycleLen = cetusDayLen + cetusNightLen
          const targetElapsedCetus = cetusDayLen + (cetusNightLen - 802_000)
          const EPOCH_CETUS = ANCHOR - targetElapsedCetus

          const cyclesSinceCetus = Math.trunc(
            (now - EPOCH_CETUS) / cetusCycleLen,
          )
          const cycleStartCetus = EPOCH_CETUS + cyclesSinceCetus * cetusCycleLen
          const cetusElapsed = now - cycleStartCetus
          const isDay = cetusElapsed < cetusDayLen
          const stateEndCetus = isDay
            ? cycleStartCetus + cetusDayLen
            : cycleStartCetus + cetusCycleLen

          const cetus = {
            state: isDay ? 'day' : 'night',
            expiry: new Date(stateEndCetus).toISOString(),
            timeLeft: formatTimeLeft(stateEndCetus - now),
          }

          // Cambion Drift (Deimos): Fass / Vome (30m / 30m)
          // Derived to match: Vome 13m22s at ANCHOR (phase order Fass then Vome)
          const phaseLenCambion = 30 * 60 * 1000
          const cambionCycleLen = phaseLenCambion * 2
          const targetElapsedCambion =
            phaseLenCambion + (phaseLenCambion - 802_000)
          const EPOCH_CAMBION = ANCHOR - targetElapsedCambion

          const cyclesSinceCambion = Math.trunc(
            (now - EPOCH_CAMBION) / cambionCycleLen,
          )
          const cycleStartCambion =
            EPOCH_CAMBION + cyclesSinceCambion * cambionCycleLen
          const cambionElapsed = now - cycleStartCambion
          const isFass = cambionElapsed < phaseLenCambion
          const stateEndCambion = isFass
            ? cycleStartCambion + phaseLenCambion
            : cycleStartCambion + cambionCycleLen

          const cambion = {
            state: isFass ? 'fass' : 'vome',
            expiry: new Date(stateEndCambion).toISOString(),
            timeLeft: formatTimeLeft(stateEndCambion - now),
          }

          return Response.json({ vallis, cetus, cambion })
        } catch (err: any) {
          return new Response(
            JSON.stringify({
              error: err?.message || 'Failed to fetch cycles',
            }),
            { status: 500, headers: { 'content-type': 'application/json' } },
          )
        }
      },
    },
  },
})
