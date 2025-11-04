import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createQueryClient } from '@/lib/query/query-config'

// Global singleton pattern to ensure only one QueryClient instance exists
// and persists across hot-reloads in development
const globalForQueryClient = globalThis as unknown as {
  queryClient: QueryClient | undefined
}

export function getContext() {
  // Reuse existing client if available (prevents creating multiple instances)
  if (globalForQueryClient.queryClient) {
    return {
      queryClient: globalForQueryClient.queryClient,
    }
  }

  const queryClient = createQueryClient()

  // Store in global for development hot-reload persistence
  if (process.env.NODE_ENV !== 'production') {
    globalForQueryClient.queryClient = queryClient
  }

  return {
    queryClient,
  }
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode
  queryClient: QueryClient
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
