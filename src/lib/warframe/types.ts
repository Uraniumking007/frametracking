/**
 * Type definitions for Warframe API responses
 * These types ensure type safety across the application
 */

import type { Platform } from './api'

/**
 * Base date structure used in Warframe API responses
 */
export interface WarframeDate {
  $date: {
    $numberLong: string
  }
}

/**
 * Alert reward structure
 */
export interface AlertReward {
  items?: string[]
  countedItems?: Array<{
    type?: string
    _id?: string
    item?: string
    name?: string
    count?: number
    quantity?: number
    qty?: number
  }>
  itemString?: string
  asString?: string
  credits?: number
}

/**
 * Mission information structure
 */
export interface MissionInfo {
  location?: string
  Node?: string
  missionType: string
  missionReward?: AlertReward
  description?: string
  faction?: string
}

/**
 * Alert data structure (from API response)
 */
export interface Alert {
  id: string
  MissionInfo: MissionInfo
  Expiry: WarframeDate
  ExpiryTime?: number
  Expiration?: number
  ExpiryDate?: number
  Node?: string
  // Resolved fields (added server-side)
  resolvedDescription?: string
  resolvedNodeLabel?: string
  resolvedFaction?: string
  resolvedRewards?: string[]
}

/**
 * Fissure data structure
 */
export interface Fissure {
  id?: string
  node: string
  resolvedNodeLabel?: string
  tier: string
  missionType?: string
  expiry: string | number
  timeLeft?: string
  Modifier?: string
  MissionType?: string
  Expiry?: WarframeDate
  Hard?: boolean
  hard?: boolean
}

/**
 * Event reward structure
 */
export interface EventReward {
  items?: string[]
  countedItems?: Array<{
    type?: string
    _id?: string
    item?: string
    name?: string
    count?: number
    quantity?: number
    qty?: number
  }>
}

/**
 * Event data structure
 */
export interface Event {
  _id?: { $oid: string }
  id?: string
  Desc?: string
  ToolTip?: string
  description?: string
  tooltip?: string
  Node?: string
  faction?: string
  Reward?: EventReward
  InterimRewards?: Array<EventReward>
  Activation?: WarframeDate
  Expiry?: WarframeDate
  // Resolved fields (added server-side)
  resolvedDescription?: string
  resolvedLocation?: string
  resolvedFaction?: string
  resolvedRewards?: string[]
}

/**
 * Invasion reward structure
 */
export interface InvasionReward {
  countedItems?: Array<{
    ItemCount?: number
    count?: number
    quantity?: number
    qty?: number
    ItemType?: string
    type?: string
    _id?: string
    item?: string
    name?: string
  }>
}

/**
 * Invasion data structure
 */
export interface Invasion {
  _id?: { $oid: string }
  id?: string
  Node?: string
  node?: string
  Faction?: string
  attackerFaction?: string
  DefenderFaction?: string
  defenderFaction?: string
  AttackerReward?: InvasionReward
  attackerReward?: InvasionReward
  DefenderReward?: InvasionReward
  defenderReward?: InvasionReward
  Activation?: WarframeDate
  Expiry?: WarframeDate
  // Resolved fields (added server-side)
  resolvedNodeLabel?: string
  resolvedAttackerFaction?: string
  resolvedDefenderFaction?: string
  resolvedRewardText?: string
}

/**
 * Sortie variant structure
 */
export interface SortieVariant {
  missionType: string
  modifierType: string
  node: string
  resolvedNodeLabel?: string
  tileset: string
}

/**
 * Sortie response structure
 */
export interface SortieResponse {
  boss: string
  faction: string
  eta: string
  variants: SortieVariant[]
}

/**
 * World State Sortie structure (raw API)
 */
export interface WorldStateSortie {
  _id: { $oid: string }
  Activation: WarframeDate
  Expiry: WarframeDate
  Reward: string
  Seed: number
  Boss: string
  ExtraDrops: unknown[]
  Variants: Array<{
    missionType: string
    modifierType: string
    node: string
    tileset: string
  }>
  Twitter: boolean
}

/**
 * Archon mission structure
 */
export interface ArchonMission {
  missionType: string
  node: string
  resolvedNodeLabel?: string
}

/**
 * Archon Hunt response structure
 */
export interface ArchonHuntResponse {
  boss: string
  eta: string
  missions: ArchonMission[]
}

/**
 * World State Archon Hunt structure (raw API)
 */
export interface WorldStateArchonHunt {
  _id: { $oid: string }
  Activation: WarframeDate
  Expiry: WarframeDate
  Reward: string
  Seed: number
  Boss: string
  Missions: ArchonMission[]
}

/**
 * Arbitration data structure
 */
export interface Arbitration {
  _id?: { $oid: string }
  Activation?: WarframeDate
  Expiry?: WarframeDate
  node?: string
  type?: string
  enemy?: string
  // Resolved fields
  resolvedNodeLabel?: string
}

/**
 * Cycle data structure (Cetus, Vallis, Cambion)
 */
export interface Cycle {
  id: string
  state: string
  timeLeft: string
  expiry?: string
}

/**
 * Bounty data structure
 */
export interface Bounty {
  id: string
  rewardPool?: string[]
  locations?: string[]
  expiry?: string
}

/**
 * News item structure
 */
export interface NewsItem {
  id: string
  title: string
  eta?: string
  message?: string
  link?: string
  imageLink?: string
  priority?: boolean
  date?: string
  startDate?: string
  endDate?: string
}

/**
 * World State data structure (main API response)
 */
export interface WorldState {
  Alerts?: Alert[]
  Goals?: Event[]
  Invasions?: Invasion[]
  ActiveMissions?: Array<{
    Node?: string
    Modifier?: string
    MissionType?: string
    Expiry?: WarframeDate
    Hard?: boolean
    hard?: boolean
  }>
  Sorties?: WorldStateSortie[]
  LiteSorties?: WorldStateArchonHunt[]
  Arbitration?: Arbitration
  [key: string]: unknown
}


