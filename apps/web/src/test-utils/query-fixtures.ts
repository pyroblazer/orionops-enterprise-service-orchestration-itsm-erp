import type { UseQueryResult } from '@tanstack/react-query';

export function createMockQueryResult<T>(data: T, isLoading = false): UseQueryResult<T> {
  return {
    data,
    isLoading,
    isError: false,
    error: null,
    refetch: jest.fn(),
    isRefetching: false,
    isFetching: false,
    isSuccess: !isLoading && !false,
    isPending: isLoading,
    status: isLoading ? 'pending' : 'success',
    fetchStatus: 'idle',
    dataUpdatedAt: Date.now(),
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    isFetched: !isLoading,
    isFetchedAfterMount: !isLoading,
    isPlaceholderData: false,
    isStale: false,
    promise: Promise.resolve(data),
    isLoadingError: false,
    isRefetchError: false,
    isInitialLoading: isLoading,
    isPaused: false,
    isEnabled: true,
  } as UseQueryResult<T>;
}
