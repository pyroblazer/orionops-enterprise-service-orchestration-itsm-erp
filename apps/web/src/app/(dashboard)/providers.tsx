'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useColdStartStore } from '@/stores/cold-start-store';
import { ColdStartBanner } from '@/components/cold-start-banner';

interface ColdStartError {
  coldStart?: boolean;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error: unknown) => {
        const coldStartError = error as ColdStartError;
        // Allow more retries for Render cold-starts (502/503)
        if (coldStartError?.coldStart) {
          return failureCount < 6;
        }
        // Standard retry for other errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex, error: unknown) => {
        const coldStartError = error as ColdStartError;
        // Exponential backoff for cold-starts: 10s, 20s, 30s, 30s, ...
        if (coldStartError?.coldStart) {
          return Math.min(10000 * (attemptIndex + 1), 30000);
        }
        // Standard delay for other errors
        return 1000;
      },
      refetchOnWindowFocus: false,
    },
  },
});

// Clear cold-start flag on successful query
queryClient.getDefaultOptions().queries!.onSuccess = () => {
  useColdStartStore.getState().setWaking(false);
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ColdStartBanner />
      {children}
    </QueryClientProvider>
  );
}
