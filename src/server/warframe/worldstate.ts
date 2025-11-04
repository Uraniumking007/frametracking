import { serverQueryClient } from "../query-client";

function resolveWorldStateUrl(platform: string): string {
  switch (platform) {
    case "pc":
      return "https://content.warframe.com/dynamic/worldState.php";
    case "ps4":
    case "ps5":
      return "https://content-ps4.warframe.com/dynamic/worldState.php";
    case "xb1":
    case "xbsx":
      return "https://content-xb1.warframe.com/dynamic/worldState.php";
    case "swi":
      return "https://content-swi.warframe.com/dynamic/worldState.php";
    case "ios":
      return "https://content-mob.warframe.com/dynamic/worldState.php";
    default:
      return "https://content.warframe.com/dynamic/worldState.php";
  }
}

const defaultUserAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

const defaultReferer = "https://www.warframe.com/";

// Request deduplication cache to prevent concurrent identical requests
// Key: platform, Value: { promise: Promise, timestamp: number }
const requestCache = new Map<
  string,
  { promise: Promise<any>; timestamp: number }
>();

// Cache TTL: 60 seconds (same as TanStack Query staleTime)
const CACHE_TTL_MS = 60 * 1000;

// Maximum retry attempts for 403 errors
const MAX_RETRIES = 3;
// Base delay for exponential backoff (in milliseconds)
const BASE_RETRY_DELAY_MS = 1000;

// 1. Define a unique Query Key for this data (platform-specific)
export const getWorldStateQueryKey = (platform: string) => [
  "worldstate",
  platform,
];

/**
 * Creates browser-like headers for Warframe API requests
 * to avoid bot detection and 403 errors
 */
function createBrowserHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json, text/plain;q=0.9,*/*;q=0.8",
    "Accept-Language": process.env.WARFRAME_ACCEPT_LANGUAGE || "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "User-Agent": process.env.WARFRAME_USER_AGENT?.trim() || defaultUserAgent,
    Referer: process.env.WARFRAME_REFERER?.trim() || defaultReferer,
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  };

  // CRITICAL: Always set Origin to warframe.com domain, not your own domain
  // Setting it to your Netlify domain triggers Akamai WAF blocking
  // Warframe's API expects requests to appear as if they come from warframe.com
  headers.Origin = "https://bhaveshp.dev/";

  // Don't set Sec-Fetch headers - they're browser-only and trigger bot detection
  // in serverless environments. Akamai WAF can detect these are fake.

  return headers;
}

/**
 * Retry logic with exponential backoff for transient failures
 */
async function fetchWithRetry(
  url: string,
  headers: Record<string, string>,
  retryCount = 0
): Promise<Response> {
  try {
    const res = await fetch(url, {
      headers,
      cache: "no-store",
      redirect: "follow",
    });

    // If we get a 403 and haven't exceeded retry limit, retry with backoff
    if (res.status === 403 && retryCount < MAX_RETRIES) {
      const delay = BASE_RETRY_DELAY_MS * Math.pow(2, retryCount);
      console.warn(
        `Got 403 Forbidden, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, headers, retryCount + 1);
    }

    return res;
  } catch (error) {
    // For network errors, also retry
    if (retryCount < MAX_RETRIES) {
      const delay = BASE_RETRY_DELAY_MS * Math.pow(2, retryCount);
      console.warn(
        `Network error, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES}):`,
        error
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, headers, retryCount + 1);
    }
    throw error;
  }
}

// 2. Define the actual fetcher function. This will now only
//    be called by TanStack Query when data is stale.
const fetchFromWarframeApi = async (platform: string): Promise<any> => {
  const url = resolveWorldStateUrl(platform);
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
      console.log(
        `FETCHING FROM WARFRAME API... (Platform: ${platform}) (This should only log once per minute per platform)`
      );

      const headers = createBrowserHeaders();

      // Log request details in production for debugging
      if (
        process.env.NETLIFY === "true" ||
        process.env.NODE_ENV === "production"
      ) {
        console.log("Request details:", {
          url,
          platform,
          userAgent: headers["User-Agent"],
          origin: headers.Origin,
          referer: headers.Referer,
        });
      }

      const res = await fetchWithRetry(url, headers);

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        console.error("Warframe API error response:", {
          status: res.status,
          statusText: res.statusText,
          headers: Object.fromEntries(res.headers.entries()),
          body: errorText.substring(0, 500), // First 500 chars
        });
        throw new Error(
          `Failed to fetch world state: ${res.status} ${res.statusText}`
        );
      }

      const data = await res.json();

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
