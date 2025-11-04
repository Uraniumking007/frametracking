import { QueryClient } from "@tanstack/react-query";
import { serverQueryConfig } from "@/lib/query/query-config";

/**
 * Creates a global, singleton QueryClient instance for server-side use.
 * This client is used for a shared, in-memory cache for non-user-specific data.
 *
 * Server-side caching strategy:
 * - staleTime: 60 seconds - Data is fresh for 1 minute to reduce API load
 * - gcTime: Infinity - Prevents garbage collection to maintain global cache
 * - retry: 1 attempt - Single retry to avoid long response times
 */
const createServerQueryClient = () => {
  return new QueryClient({
    defaultOptions: serverQueryConfig,
  });
};

// We use a global singleton pattern to ensure only one instance exists
// and persists across hot-reloads in development.
const globalForQueryClient = globalThis as unknown as {
  serverQueryClient: QueryClient | undefined;
};

export const serverQueryClient =
  globalForQueryClient.serverQueryClient ?? createServerQueryClient();

if (process.env.NODE_ENV !== "production") {
  globalForQueryClient.serverQueryClient = serverQueryClient;
}
