// Server-side WFCD items resolver using official itemsMap.json dataset
// This uses the official WFCD exports for accurate item names

import itemsMapData from "@/data/itemsMap.json";

// Load the items map once at module load
const ITEM_NAME_MAP: Record<string, string> = itemsMapData as Record<
  string,
  string
>;

/**
 * Resolves an item identifier to its official name from WFCD exports
 * @param identifier - The item identifier/path (e.g., "/Lotus/Weapons/...")
 * @returns The official item name from the exports
 */
export async function resolveItemName(identifier: string): Promise<string> {
  if (!identifier) {
    return "Unknown Item";
  }

  // Try direct lookup first
  const resolved = ITEM_NAME_MAP[identifier];
  if (resolved) {
    return resolved;
  }

  // Try case-insensitive lookup
  const lowerIdentifier = identifier.toLowerCase();
  for (const [key, value] of Object.entries(ITEM_NAME_MAP)) {
    if (key.toLowerCase() === lowerIdentifier) {
      return value;
    }
  }

  // Fallback to cleaning the identifier (should rarely happen with complete itemsMap)
  return cleanItemIdentifier(identifier);
}

/**
 * Resolves an item identifier to its full item object
 * @param identifier - The item identifier/path
 * @returns Item object with uniqueName and name, or null if not found
 */
export async function resolveItem(identifier: string): Promise<{
  uniqueName: string;
  name: string;
} | null> {
  if (!identifier) {
    return null;
  }

  // Try direct lookup
  let name = ITEM_NAME_MAP[identifier];
  if (name) {
    return {
      uniqueName: identifier,
      name,
    };
  }

  // Try case-insensitive lookup
  const lowerIdentifier = identifier.toLowerCase();
  for (const [key, value] of Object.entries(ITEM_NAME_MAP)) {
    if (key.toLowerCase() === lowerIdentifier) {
      return {
        uniqueName: key,
        name: value,
      };
    }
  }

  return null;
}

/**
 * Resolves multiple item identifiers to their official names
 * @param identifiers - Array of item identifiers
 * @returns Record mapping identifiers to official names
 */
export async function resolveMultipleItems(
  identifiers: string[]
): Promise<Record<string, string>> {
  const resolved: Record<string, string> = {};

  for (const identifier of identifiers) {
    if (!identifier) {
      continue;
    }

    // Try direct lookup first
    let name = ITEM_NAME_MAP[identifier];
    if (name) {
      resolved[identifier] = name;
      continue;
    }

    // Try case-insensitive lookup
    const lowerIdentifier = identifier.toLowerCase();
    let found = false;
    for (const [key, value] of Object.entries(ITEM_NAME_MAP)) {
      if (key.toLowerCase() === lowerIdentifier) {
        resolved[identifier] = value;
        found = true;
        break;
      }
    }

    // Fallback to cleaning if not found in map
    if (!found) {
      resolved[identifier] = cleanItemIdentifier(identifier);
    }
  }

  return resolved;
}

/**
 * Cleans an item identifier to make it more readable
 * @param identifier - The raw item identifier
 * @returns A cleaned, more readable version
 */
function cleanItemIdentifier(identifier: string): string {
  if (!identifier) return "Unknown Item";

  // Extract the last meaningful part of the path
  const parts = identifier.split("/");
  const lastPart = parts[parts.length - 1];

  // If it's a meaningful name, use it
  if (lastPart && lastPart !== "Types" && lastPart !== "Items") {
    return formatItemName(lastPart);
  }

  // Try to find a meaningful part from the middle
  for (let i = parts.length - 2; i >= 0; i--) {
    const part = parts[i];
    if (part && part !== "Types" && part !== "Items" && part !== "Lotus") {
      return formatItemName(part);
    }
  }

  // Fallback to the full identifier
  return identifier;
}

/**
 * Formats an item name with proper capitalization and spacing
 * @param name - The raw item name
 * @returns A properly formatted item name
 */
function formatItemName(name: string): string {
  if (!name) return "Unknown Item";

  // Handle special cases and variants
  const specialCases: Record<string, string> = {
    Prime: "Prime",
    Umbra: "Umbra",
    Wraith: "Wraith",
    Vandal: "Vandal",
    Dex: "Dex",
    Prisma: "Prisma",
    Mara: "Mara",
    Telos: "Telos",
    Synoid: "Synoid",
    Rakta: "Rakta",
    Sancti: "Sancti",
    Secura: "Secura",
    Vaykor: "Vaykor",
    Ak: "Ak",
    Twin: "Twin",
    Dual: "Dual",
    MK1: "MK1",
    MK2: "MK2",
    MK3: "MK3",
    Kuva: "Kuva",
    Tenet: "Tenet",
    Paracesis: "Paracesis",
    Necramech: "Necramech",
    Archwing: "Archwing",
    Railjack: "Railjack",
    Kubrow: "Kubrow",
    Kavat: "Kavat",
    Helminth: "Helminth",
    HelminthCharger: "Helminth Charger",
    HelminthChargerInfested: "Helminth Charger",
    HelminthChargerInfestedPet: "Helminth Charger",
  };

  // Handle common Warframe naming patterns
  const warframePatterns = [
    { pattern: /^([A-Z][a-z]+)([A-Z][a-z]+)$/, replacement: "$1 $2" },
    {
      pattern: /^([A-Z][a-z]+)([A-Z][a-z]+)([A-Z][a-z]+)$/,
      replacement: "$1 $2 $3",
    },
    {
      pattern: /^([A-Z][a-z]+)([A-Z][a-z]+)([A-Z][a-z]+)([A-Z][a-z]+)$/,
      replacement: "$1 $2 $3 $4",
    },
  ];

  // Apply Warframe patterns first
  for (const { pattern, replacement } of warframePatterns) {
    if (pattern.test(name)) {
      name = name.replace(pattern, replacement);
      break;
    }
  }

  // Check for special cases
  for (const [key, value] of Object.entries(specialCases)) {
    if (name.includes(key)) {
      name = name.replace(new RegExp(key, "g"), value);
    }
  }

  // Convert camelCase/PascalCase to readable format
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/\s+/g, " ")
    .trim();
}
