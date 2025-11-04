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

// 1. Define a unique Query Key for this data (platform-specific)
export const getWorldStateQueryKey = (platform: string) => [
  "worldstate",
  platform,
];

// 2. Define the actual fetcher function. This will now only
//    be called by TanStack Query when data is stale.
const fetchFromWarframeApi = async (platform: string): Promise<any> => {
  const url = resolveWorldStateUrl(platform);

  console.log(
    `FETCHING FROM WARFRAME API... (Platform: ${platform}) (This should only log once per minute per platform)`
  );

  const headers: Record<string, string> = {
    Accept: "application/json, text/plain;q=0.9,*/*;q=0.8",
    "Accept-Language": process.env.WARFRAME_ACCEPT_LANGUAGE || "en-US,en;q=0.9",
    "User-Agent": process.env.WARFRAME_USER_AGENT?.trim() || defaultUserAgent,
    Referer: process.env.WARFRAME_REFERER?.trim() || defaultReferer,
  };

  if (process.env.PUBLIC_BASE_URL?.trim()) {
    headers.Origin = process.env.PUBLIC_BASE_URL.trim();
  }

  const res = await fetch(url, {
    headers,
    cache: "no-store",
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch world state: ${res.status} ${res.statusText}`
    );
  }

  return res.json();
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
