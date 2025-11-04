import { QueryClient } from "@tanstack/react-query";

/**
 * Default query configuration for client-side queries.
 * These settings ensure optimal caching and request deduplication.
 */
export const defaultQueryConfig = {
  queries: {
    /**
     * staleTime: 45 seconds
     * Data is considered fresh for 45 seconds. During this time, queries won't refetch
     * even if components remount or refocus. This reduces unnecessary API calls for
     * frequently changing data like alerts and fissures.
     */
    staleTime: 45 * 1000, // 45 seconds

    /**
     * gcTime: 5 minutes (formerly cacheTime)
     * Inactive queries are kept in cache for 5 minutes before garbage collection.
     * This allows instant data display when navigating back to a page.
     */
    gcTime: 5 * 60 * 1000, // 5 minutes

    /**
     * retry: 2 attempts
     * Retry failed requests 2 times before showing an error.
     */
    retry: 2,

    /**
     * retryDelay: exponential backoff
     * Wait progressively longer between retries (1s, 2s, 4s...)
     */
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),

    /**
     * refetchOnWindowFocus: false
     * Don't refetch when window regains focus. Warframe data doesn't change that frequently.
     */
    refetchOnWindowFocus: false,

    /**
     * refetchOnReconnect: true
     * Refetch when network reconnects to ensure data is up-to-date.
     */
    refetchOnReconnect: true,
  },
};

/**
 * Creates a configured QueryClient instance for client-side use.
 * This ensures consistent configuration across the application.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: defaultQueryConfig,
  });
}

/**
 * Server-side query configuration.
 * Optimized for SSR with longer cache times and no garbage collection.
 */
export const serverQueryConfig = {
  queries: {
    /**
     * staleTime: 60 seconds
     * Server-side data is cached for 1 minute to reduce API load.
     */
    staleTime: 60 * 1000, // 1 minute

    /**
     * gcTime: Infinity
     * On the server, queries are always 'inactive', so we prevent
     * garbage collection to maintain the global cache.
     */
    gcTime: Infinity,

    /**
     * retry: 1 attempt
     * Single retry for server-side requests to avoid long response times.
     */
    retry: 1,

    retryDelay: 1000,
  },
};
