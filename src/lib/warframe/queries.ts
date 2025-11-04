/**
 * Shared React Query hooks for Warframe data fetching
 * These hooks provide consistent query patterns across the application
 */

import { useQuery } from '@tanstack/react-query'
import type { Platform } from './api'
import {
  fetchAlerts,
  fetchEvents,
  fetchFissures,
  fetchInvasions,
  fetchSortie,
  fetchArchonHunt,
  fetchArbitration,
  fetchBounties,
  fetchCycles,
  fetchNews,
} from './api'
import { queryKeys } from '../query/query-keys'
import type {
  Alert,
  Event,
  Fissure,
  Invasion,
  SortieResponse,
  ArchonHuntResponse,
} from './types'

/**
 * Hook to fetch alerts for a platform
 * @param platform - The platform to fetch alerts for
 * @param options - Additional query options
 */
export function useAlerts(platform: Platform) {
  return useQuery<Alert[]>({
    queryKey: queryKeys.alerts(platform),
    queryFn: () => fetchAlerts(platform),
    staleTime: 45_000, // 45 seconds - alerts can appear/disappear frequently
  })
}

/**
 * Hook to fetch events for a platform
 * @param platform - The platform to fetch events for
 */
export function useEvents(platform: Platform) {
  return useQuery<Event[]>({
    queryKey: queryKeys.events(platform),
    queryFn: () => fetchEvents(platform),
    staleTime: 45_000, // 45 seconds
  })
}

/**
 * Hook to fetch normal fissures for a platform
 * @param platform - The platform to fetch fissures for
 */
export function useNormalFissures(platform: Platform) {
  return useQuery<Fissure[]>({
    queryKey: queryKeys.normalFissures(platform),
    queryFn: () => fetchFissures(platform, 'normal'),
    staleTime: 45_000, // 45 seconds - fissures appear/disappear frequently
  })
}

/**
 * Hook to fetch Steel Path fissures for a platform
 * @param platform - The platform to fetch fissures for
 */
export function useSteelPathFissures(platform: Platform) {
  return useQuery<Fissure[]>({
    queryKey: queryKeys.steelPathFissures(platform),
    queryFn: () => fetchFissures(platform, 'steelPath'),
    staleTime: 45_000, // 45 seconds
  })
}

/**
 * Hook to fetch invasions for a platform
 * @param platform - The platform to fetch invasions for
 */
export function useInvasions(platform: Platform) {
  return useQuery<Invasion[]>({
    queryKey: queryKeys.invasions(platform),
    queryFn: () => fetchInvasions(platform),
    staleTime: 45_000, // 45 seconds
  })
}

/**
 * Hook to fetch sortie for a platform
 * @param platform - The platform to fetch sortie for
 */
export function useSortie(platform: Platform) {
  return useQuery<SortieResponse>({
    queryKey: queryKeys.sortie(platform),
    queryFn: () => fetchSortie(platform),
    staleTime: 60_000, // 1 minute - sorties change less frequently
  })
}

/**
 * Hook to fetch Archon Hunt for a platform
 * @param platform - The platform to fetch Archon Hunt for
 */
export function useArchonHunt(platform: Platform) {
  return useQuery<ArchonHuntResponse>({
    queryKey: queryKeys.archonHunt(platform),
    queryFn: () => fetchArchonHunt(platform),
    staleTime: 60_000, // 1 minute
  })
}

/**
 * Hook to fetch arbitration
 * Note: Arbitration doesn't use platform parameter
 */
export function useArbitration() {
  return useQuery({
    queryKey: queryKeys.arbitration(),
    queryFn: () => fetchArbitration('pc'), // API uses pc as default
    staleTime: 60_000, // 1 minute
  })
}

/**
 * Hook to fetch bounties
 */
export function useBounties() {
  return useQuery({
    queryKey: queryKeys.bounties(),
    queryFn: () => fetchBounties('pc'),
    staleTime: 60_000, // 1 minute
  })
}

/**
 * Hook to fetch cycles for a platform
 * @param platform - The platform to fetch cycles for
 */
export function useCycles(platform: Platform) {
  return useQuery({
    queryKey: queryKeys.cycles(platform),
    queryFn: () => fetchCycles(platform),
    staleTime: 60_000, // 1 minute
  })
}

/**
 * Hook to fetch news for a platform
 * @param platform - The platform to fetch news for
 */
export function useNews(platform: Platform) {
  return useQuery({
    queryKey: queryKeys.news(platform),
    queryFn: () => fetchNews(platform),
    staleTime: 300_000, // 5 minutes - news changes less frequently
  })
}

