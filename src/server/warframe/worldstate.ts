import { serverQueryClient } from "../query-client";

// Request deduplication cache to prevent concurrent identical requests
// Key: platform, Value: { promise: Promise, timestamp: number }
const requestCache = new Map<
  string,
  { promise: Promise<any>; timestamp: number }
>();

// Cache TTL: 60 seconds (same as TanStack Query staleTime)
const CACHE_TTL_MS = 60 * 1000;

// Maximum retry attempts for network errors
const MAX_RETRIES = 3;
// Base delay for exponential backoff (in milliseconds)
const BASE_RETRY_DELAY_MS = 1000;

// 1. Define a unique Query Key for this data (platform-specific)
export const getWorldStateQueryKey = (platform: string) => [
  "worldstate",
  platform,
];

/**
 * Fetches world state from Oracle API (browse.wf)
 * This is the primary source since Warframe's official API blocks serverless IPs
 * Note: Oracle API typically provides PC platform data
 */
async function fetchFromOracleApi(platform: string): Promise<any> {
  const defaultUserAgent =
    process.env.WARFRAME_USER_AGENT?.trim() ||
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

  console.log(
    `FETCHING FROM ORACLE API (browse.wf)... (Platform: ${platform}) (This should only log once per minute per platform)`
  );

  // Log request details in production for debugging
  if (process.env.NETLIFY === "true" || process.env.NODE_ENV === "production") {
    console.log("Oracle API request details:", {
      url: "https://oracle.browse.wf/worldState.json",
      platform,
      note: "Using Oracle API instead of official Warframe API to avoid 403 blocking",
    });
  }

  // Retry logic for network errors
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch("https://oracle.browse.wf/worldState.json", {
        headers: {
          Accept: "application/json",
          "User-Agent": defaultUserAgent,
        },
        cache: "no-store",
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(
          `Oracle API failed: ${res.status} ${res.statusText} - ${errorText.substring(0, 200)}`
        );
      }

      const data = await res.json();
      console.log("Successfully fetched from Oracle API");
      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRIES) {
        const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(
          `Oracle API error, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES}):`,
          lastError.message
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Failed to fetch from Oracle API");
}

// 2. Define the actual fetcher function. This will now only
//    be called by TanStack Query when data is stale.
const fetchFromWarframeApi = async (platform: string): Promise<any> => {
  const cacheKey = platform;

  // Check if there's an in-flight request for this platform
  const cached = requestCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    // Return the existing promise to avoid duplicate requests
    console.log(
      `Reusing in-flight request for platform: ${platform} (deduplication)`
    );
    return cached.promise;
  }

  // Create new request promise
  const requestPromise = (async () => {
    try {
      const data = await fetchFromOracleApi(platform);

      // Clean up cache entry after successful request
      requestCache.delete(cacheKey);

      return data;
    } catch (error) {
      // Clean up cache entry on error so retry can happen
      requestCache.delete(cacheKey);
      throw error;
    }
  })();

  // Store the promise in cache
  requestCache.set(cacheKey, {
    promise: requestPromise,
    timestamp: now,
  });

  // Clean up old cache entries periodically (older than 2x TTL)
  if (requestCache.size > 10) {
    for (const [key, value] of requestCache.entries()) {
      if (now - value.timestamp > CACHE_TTL_MS * 2) {
        requestCache.delete(key);
      }
    }
  }

  return requestPromise;
};

/**
 * Fetches the Warframe world state for the specified platform.
 * Uses server-side caching via TanStack Query to de-duplicate requests.
 * Data is cached for 1 minute (staleTime) per platform.
 *
 * @param platform - The platform to fetch world state for (default: "pc")
 * @returns The world state data
 *
 * @see Section 3.3 of the architecture report.
 */
export async function fetchWorldState(platform = "pc"): Promise<any> {
  try {
    /**
     * Use the server QueryClient to fetch.
     * - It uses the queryKey to find data in the cache.
     * - It runs queryFn ONLY if data is missing or stale (older than 1 min).
     * - All other calls get the cached data instantly.
     * @see Section 3.2 of the architecture report.
     */
    const data = await serverQueryClient.fetchQuery({
      queryKey: getWorldStateQueryKey(platform),
      queryFn: () => fetchFromWarframeApi(platform),
      // Note: The staleTime is already set in the client's defaults (60s),
      // but it can be overridden here per-query if needed.
    });

    return data;
  } catch (error) {
    console.error("Failed to fetch world state", {
      platform,
      error,
    });
    throw error instanceof Error
      ? error
      : new Error("Failed to fetch world state");
  }
}

/**
 * Invalidates the cached world state for a specific platform.
 * The next call to fetchWorldState will force a refetch from the external API.
 *
 * @param platform - The platform to invalidate (default: "pc")
 * @see Section 5.2 of the architecture report.
 */
export async function invalidateWorldStateCache(
  platform = "pc"
): Promise<void> {
  await serverQueryClient.invalidateQueries({
    queryKey: getWorldStateQueryKey(platform),
  });
}
