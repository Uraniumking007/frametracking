/**
 * React Query hooks for optimized node label resolution
 * Batches multiple node label requests to reduce API calls
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../query/query-keys";
import { resolveNodeLabel } from "./helpers";

/**
 * Resolves multiple node labels in batch
 * @param nodeCodes - Array of node codes to resolve
 * @returns Promise resolving to a map of nodeCode -> resolved label
 */
async function resolveNodeLabelsBatch(
  nodeCodes: string[]
): Promise<Record<string, string>> {
  // Filter out empty/null node codes
  const validCodes = nodeCodes.filter((code) => code && code.trim());

  if (validCodes.length === 0) {
    return {};
  }

  // Resolve all node labels in parallel
  const resolutions = await Promise.all(
    validCodes.map(async (code) => {
      try {
        const label = await resolveNodeLabel(code);
        return { code, label };
      } catch (error) {
        console.warn(`Failed to resolve node label for ${code}:`, error);
        return { code, label: code };
      }
    })
  );

  // Convert to map
  const result: Record<string, string> = {};
  for (const { code, label } of resolutions) {
    result[code] = label;
  }

  return result;
}

/**
 * Hook to resolve multiple node labels in batch
 * Uses React Query for caching and request deduplication
 * @param nodeCodes - Array of node codes to resolve
 * @returns Query result with resolved labels map
 */
export function useNodeLabels(nodeCodes: string[]) {
  // Sort and filter node codes for consistent cache key
  const sortedCodes = [...new Set(nodeCodes.filter(Boolean))].sort();
  const cacheKey = sortedCodes.join(",");

  return useQuery({
    queryKey: queryKeys.nodeLabels(sortedCodes),
    queryFn: () => resolveNodeLabelsBatch(sortedCodes),
    enabled: sortedCodes.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes - node labels don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
  });
}

/**
 * Hook to resolve a single node label
 * Uses React Query for caching
 * @param nodeCode - The node code to resolve
 * @returns Query result with resolved label
 */
export function useNodeLabel(nodeCode: string | undefined | null) {
  const code = nodeCode?.trim() || "";

  return useQuery({
    queryKey: queryKeys.nodeLabel(code),
    queryFn: () => resolveNodeLabel(code),
    enabled: code.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}
