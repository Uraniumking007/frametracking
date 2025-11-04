import { QueryClient } from "@tanstack/react-query";

/**
 * Creates a global, singleton QueryClient instance for server-side use.
 * This client is used for a shared, in-memory cache for non-user-specific data.
 *
 * @see Section 2.2 of the architecture report.
 */
const createServerQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        /**
         * @see Section 2.3 of the architecture report.
         * staleTime: Your 1-minute cache requirement. Data is fresh for 1 min.
         */
        staleTime: 60 * 1000, // 1 minute

        /**
         * @see Section 2.3 of the architecture report.
         * gcTime: Infinity. On the server, queries are always 'inactive'.
         * We set gcTime to Infinity to prevent TanStack Query from
         * garbage collecting our global, cached data.
         */
        gcTime: Infinity,
      },
    },
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
