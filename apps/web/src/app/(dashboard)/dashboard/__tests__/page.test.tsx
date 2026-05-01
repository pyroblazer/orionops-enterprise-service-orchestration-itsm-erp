import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardPage from '@/app/(dashboard)/dashboard/page';

// Mock the useIncidents hook
jest.mock('@/lib/hooks', () => ({
  useIncidents: jest.fn(),
}));

import { useIncidents } from '@/lib/hooks';

const mockedUseIncidents = useIncidents as jest.MockedFunction<typeof useIncidents>;

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('Dashboard Page', () => {
  beforeEach(() => {
    mockedUseIncidents.mockReturnValue({
      data: {
        data: [
          {
            id: 'inc-001-abc',
            title: 'Server unreachable',
            status: 'in_progress',
            priority: 'high',
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'inc-002-def',
            title: 'Database timeout',
            status: 'new',
            priority: 'critical',
            updatedAt: new Date().toISOString(),
          },
        ],
        total: 2,
        page: 1,
        pageSize: 5,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
      isFetching: false,
      isSuccess: true,
      isPending: false,
      status: 'success',
      fetchStatus: 'idle',
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isPlaceholderData: false,
      isStale: false,
      promise: Promise.resolve({} as any),
    } as any);
  });

  it('renders summary cards', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('Open Incidents')).toBeInTheDocument();
    expect(screen.getByText('SLA at Risk')).toBeInTheDocument();
    expect(screen.getByText('Pending Approvals')).toBeInTheDocument();
    expect(screen.getByText('Active Changes')).toBeInTheDocument();
  });

  it('shows summary card values', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('24')).toBeInTheDocument(); // Open Incidents
    expect(screen.getByText('5')).toBeInTheDocument(); // SLA at Risk
    expect(screen.getByText('8')).toBeInTheDocument(); // Pending Approvals
    expect(screen.getByText('12')).toBeInTheDocument(); // Active Changes
  });

  it('shows recent incidents section', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('Recent Incidents')).toBeInTheDocument();
    expect(screen.getByText('Latest incident activity')).toBeInTheDocument();
  });

  it('renders recent incident rows', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('Server unreachable')).toBeInTheDocument();
    expect(screen.getByText('Database timeout')).toBeInTheDocument();
  });

  it('has quick action buttons', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getAllByText('Create Incident').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Request Change')).toBeInTheDocument();
    expect(screen.getByText('Search Knowledge Base')).toBeInTheDocument();
    expect(screen.getByText('View SLA Dashboard')).toBeInTheDocument();
  });

  it('has SLA compliance section', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getAllByText('SLA Compliance').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('94%')).toBeInTheDocument();
  });

  it('has View All incidents link', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByLabelText('View all incidents')).toBeInTheDocument();
  });
});
