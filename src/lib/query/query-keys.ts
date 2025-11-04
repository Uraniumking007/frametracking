import type { Platform } from "@/lib/warframe/api";

/**
 * Centralized query key factory for type-safe query keys.
 * This ensures consistency across the application and prevents typos.
 *
 * @example
 * const alertsQuery = useQuery({
 *   queryKey: queryKeys.alerts('pc'),
 *   queryFn: () => fetchAlerts('pc'),
 * })
 */
export const queryKeys = {
  /**
   * World state query key
   * @param platform - The platform to fetch world state for
   */
  worldState: (platform: Platform) => ["worldstate", platform] as const,

  /**
   * Alerts query key
   * @param platform - The platform to fetch alerts for
   */
  alerts: (platform: Platform) => ["wf", platform, "alerts"] as const,

  /**
   * Events query key
   * @param platform - The platform to fetch events for
   */
  events: (platform: Platform) => ["wf", platform, "events"] as const,

  /**
   * Normal fissures query key
   * @param platform - The platform to fetch fissures for
   */
  normalFissures: (platform: Platform) =>
    ["wf", platform, "normalFissures"] as const,

  /**
   * Steel Path fissures query key
   * @param platform - The platform to fetch fissures for
   */
  steelPathFissures: (platform: Platform) =>
    ["wf", platform, "steelPathFissures"] as const,

  /**
   * Invasions query key
   * @param platform - The platform to fetch invasions for
   */
  invasions: (platform: Platform) => ["wf", platform, "invasions"] as const,

  /**
   * Sortie query key
   * @param platform - The platform to fetch sortie for
   */
  sortie: (platform: Platform) => ["wf", platform, "sortie"] as const,

  /**
   * Archon Hunt query key
   * @param platform - The platform to fetch archon hunt for
   */
  archonHunt: (platform: Platform) => ["wf", platform, "archonHunt"] as const,

  /**
   * Arbitration query key
   * Note: Arbitration doesn't use platform parameter
   */
  arbitration: () => ["wf", "arbitration"] as const,

  /**
   * Bounties query key
   */
  bounties: () => ["wf", "bounties"] as const,

  /**
   * Cycles query key
   * @param platform - The platform to fetch cycles for
   */
  cycles: (platform: Platform) => ["wf", platform, "cycles"] as const,

  /**
   * News query key
   * @param platform - The platform to fetch news for
   */
  news: (platform: Platform) => ["wf", platform, "news"] as const,

  /**
   * Steel Path incursions query key
   */
  steelPathIncursions: () => ["wf", "steelPathIncursions"] as const,

  /**
   * Node label resolution query key
   * @param nodeCode - The node code to resolve
   */
  nodeLabel: (nodeCode: string) => ["nodeLabel", nodeCode] as const,

  /**
   * Batch node label resolution query key
   * @param nodeCodes - Array of node codes to resolve
   */
  nodeLabels: (nodeCodes: string[]) =>
    ["nodeLabels", ...nodeCodes.sort()] as const,

  /**
   * Item resolution query key
   * @param identifiers - Array of item identifiers to resolve
   */
  items: (identifiers: string[]) => ["items", ...identifiers.sort()] as const,

  /**
   * Dictionary query key
   * @param language - The language code (e.g., 'en')
   */
  dictionary: (language: string = "en") => ["dictionary", language] as const,
} as const;
