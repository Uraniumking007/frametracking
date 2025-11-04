// Utilities to resolve Warframe items using server-side WFCD items library
// Reference: https://github.com/WFCD/warframe-items

import { useState, useEffect } from 'react'
import { resolveLocalizedText as resolveLotusText } from '@/lib/helpers/dict'

// Cache for resolved items
const resolvedItemsCache = new Map<string, string>()

// Re-export localized text resolver for compatibility with existing imports
export async function resolveLocalizedText(
  key: string,
  language: string = 'en',
): Promise<string> {
  return resolveLotusText(key, language)
}

/**
 * Resolves an item name using the server-side API
 * @param identifier - The item identifier to resolve
 * @returns Promise resolving to the best available name
 */
export async function resolveItemName(identifier: string): Promise<string> {
  if (!identifier) return 'Unknown Item'

  // Check cache first
  if (resolvedItemsCache.has(identifier)) {
    return resolvedItemsCache.get(identifier)!
  }

  try {
    const response = await fetch('/api/warframe/resolve-items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifiers: [identifier] }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const resolved = await response.json()
    const itemName = resolved[identifier] || cleanItemIdentifier(identifier)

    // Cache the result
    resolvedItemsCache.set(identifier, itemName)

    return itemName
  } catch (error) {
    console.warn(`Failed to resolve item name: ${identifier}`, error)
    const fallback = cleanItemIdentifier(identifier)
    resolvedItemsCache.set(identifier, fallback)
    return fallback
  }
}

/**
 * Resolves multiple items using the server-side API
 * @param identifiers - Array of item identifiers to resolve
 * @returns Promise resolving to array of resolved items (null for not found)
 */
export async function resolveMultipleItems(
  identifiers: string[],
): Promise<Record<string, string>> {
  const uncachedIdentifiers = identifiers.filter(
    (id) => !resolvedItemsCache.has(id),
  )

  if (uncachedIdentifiers.length === 0) {
    // All items are cached
    const result: Record<string, string> = {}
    identifiers.forEach((id) => {
      result[id] = resolvedItemsCache.get(id)!
    })
    return result
  }

  try {
    const response = await fetch('/api/warframe/resolve-items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifiers: uncachedIdentifiers }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const resolved = await response.json()

    // Cache the new results
    Object.entries(resolved).forEach(([id, name]) => {
      resolvedItemsCache.set(id, name as string)
    })

    // Return all results (cached + new)
    const result: Record<string, string> = {}
    identifiers.forEach((id) => {
      result[id] = resolvedItemsCache.get(id) || cleanItemIdentifier(id)
    })

    return result
  } catch (error) {
    console.warn(`Failed to resolve multiple items:`, error)
    const result: Record<string, string> = {}
    identifiers.forEach((id) => {
      result[id] = resolvedItemsCache.get(id) || cleanItemIdentifier(id)
    })
    return result
  }
}

/**
 * React hook to resolve multiple item names in parallel
 * @param itemIdentifiers - Array of item identifiers to resolve
 * @returns Object with resolvedNames and isLoading state
 */
export function useResolvedItemNames(itemIdentifiers: string[]) {
  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!itemIdentifiers.length) {
      return
    }

    setIsLoading(true)

    const resolveItems = async () => {
      try {
        const resolved = await resolveMultipleItems(itemIdentifiers)
        setResolvedNames(resolved)
      } catch (error) {
        console.warn('Failed to resolve items:', error)
        const fallback: Record<string, string> = {}
        itemIdentifiers.forEach((id) => {
          fallback[id] = cleanItemIdentifier(id)
        })
        setResolvedNames(fallback)
      } finally {
        setIsLoading(false)
      }
    }

    resolveItems()
  }, [itemIdentifiers.join(',')])

  return { resolvedNames, isLoading }
}

/**
 * Cleans an item identifier to make it more readable
 * @param identifier - The raw item identifier
 * @returns A cleaned, more readable version
 */
export function cleanItemIdentifier(identifier: string): string {
  if (!identifier) return 'Unknown Item'

  // Extract the last meaningful part of the path
  const parts = identifier.split('/')
  const lastPart = parts[parts.length - 1]

  // If it's a meaningful name, use it
  if (lastPart && lastPart !== 'Types' && lastPart !== 'Items') {
    return formatItemName(lastPart)
  }

  // Try to find a meaningful part from the middle
  for (let i = parts.length - 2; i >= 0; i--) {
    const part = parts[i]
    if (part && part !== 'Types' && part !== 'Items' && part !== 'Lotus') {
      return formatItemName(part)
    }
  }

  // Fallback to the full identifier
  return identifier
}

/**
 * Formats an item name with proper capitalization and spacing
 * @param name - The raw item name
 * @returns A properly formatted item name
 */
function formatItemName(name: string): string {
  if (!name) return 'Unknown Item'

  // Handle special cases and variants
  const specialCases: Record<string, string> = {
    Prime: 'Prime',
    Umbra: 'Umbra',
    Wraith: 'Wraith',
    Vandal: 'Vandal',
    Dex: 'Dex',
    Prisma: 'Prisma',
    Mara: 'Mara',
    Telos: 'Telos',
    Synoid: 'Synoid',
    Rakta: 'Rakta',
    Sancti: 'Sancti',
    Secura: 'Secura',
    Vaykor: 'Vaykor',
    Ak: 'Ak',
    Twin: 'Twin',
    Dual: 'Dual',
    MK1: 'MK1',
    MK2: 'MK2',
    MK3: 'MK3',
    Kuva: 'Kuva',
    Tenet: 'Tenet',
    Paracesis: 'Paracesis',
    Necramech: 'Necramech',
    Archwing: 'Archwing',
    Railjack: 'Railjack',
    Kubrow: 'Kubrow',
    Kavat: 'Kavat',
    Helminth: 'Helminth',
    HelminthCharger: 'Helminth Charger',
    HelminthChargerInfested: 'Helminth Charger',
    HelminthChargerInfestedPet: 'Helminth Charger',
  }

  // Handle common Warframe naming patterns
  const warframePatterns = [
    { pattern: /^([A-Z][a-z]+)([A-Z][a-z]+)$/, replacement: '$1 $2' },
    {
      pattern: /^([A-Z][a-z]+)([A-Z][a-z]+)([A-Z][a-z]+)$/,
      replacement: '$1 $2 $3',
    },
    {
      pattern: /^([A-Z][a-z]+)([A-Z][a-z]+)([A-Z][a-z]+)([A-Z][a-z]+)$/,
      replacement: '$1 $2 $3 $4',
    },
  ]

  // Apply Warframe patterns first
  for (const { pattern, replacement } of warframePatterns) {
    if (pattern.test(name)) {
      name = name.replace(pattern, replacement)
      break
    }
  }

  // Check for special cases
  for (const [key, value] of Object.entries(specialCases)) {
    if (name.includes(key)) {
      name = name.replace(new RegExp(key, 'g'), value)
    }
  }

  // Convert camelCase/PascalCase to readable format
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim()
}

// Legacy compatibility functions
export async function resolveItem(identifier: string): Promise<any> {
  const name = await resolveItemName(identifier)
  return name ? { name, uniqueName: identifier } : null
}

export async function findItemByUniqueName<T extends any>(
  uniqueName: string,
): Promise<T | null> {
  const name = await resolveItemName(uniqueName)
  return name ? ({ name, uniqueName } as T) : null
}

export async function findItemByName<T extends any>(
  _name: string,
): Promise<T | null> {
  // This is a simplified implementation - in practice you'd need a reverse lookup
  return null
}

export async function searchItems<T extends any>(
  _searchTerm: string,
  _limit: number = 10,
): Promise<T[]> {
  // This would require server-side search implementation
  return []
}

export async function resolveItemThorough(identifier: string): Promise<any> {
  return await resolveItem(identifier)
}

