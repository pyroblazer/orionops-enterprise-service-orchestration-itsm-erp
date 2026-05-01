import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import IncidentsListPage from '@/app/(dashboard)/incidents/page';

// Mock the hooks
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

describe('Incidents List Page', () => {
  beforeEach(() => {
    mockedUseIncidents.mockReturnValue({
      data: {
        data: [
          {
            id: 'inc-001-abcde',
            title: 'VPN tunnel down',
            status: 'new',
            priority: 'critical',
            assignedToName: 'Jane Smith',
            serviceName: 'Network',
            createdAt: '2025-01-15T10:30:00Z',
          },
          {
            id: 'inc-002-fghij',
            title: 'Email delivery failure',
            status: 'in_progress',
            priority: 'high',
            assignedToName: null,
            serviceName: 'Email',
            createdAt: '2025-01-14T08:00:00Z',
          },
        ],
        total: 2,
        page: 1,
        pageSize: 20,
        totalPages: 3,
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

  it('renders the page header', () => {
    renderWithProviders(<IncidentsListPage />);
    expect(screen.getByText('Incidents')).toBeInTheDocument();
    expect(screen.getByText(/Manage and track all incidents/)).toBeInTheDocument();
  });

  it('renders the filter bar card', () => {
    renderWithProviders(<IncidentsListPage />);
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('renders the incidents table', () => {
    renderWithProviders(<IncidentsListPage />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('renders incident data in table rows', () => {
    renderWithProviders(<IncidentsListPage />);
    expect(screen.getByText('VPN tunnel down')).toBeInTheDocument();
    expect(screen.getByText('Email delivery failure')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    renderWithProviders(<IncidentsListPage />);
    expect(screen.getByRole('columnheader', { name: /ID/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Title/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Priority/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Status/ })).toBeInTheDocument();
  });

  it('renders pagination controls', () => {
    renderWithProviders(<IncidentsListPage />);
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
  });

  it('renders Refresh button', () => {
    renderWithProviders(<IncidentsListPage />);
    expect(screen.getByLabelText('Refresh incidents list')).toBeInTheDocument();
  });

  it('renders Create Incident button', () => {
    renderWithProviders(<IncidentsListPage />);
    expect(screen.getByLabelText('Create new incident')).toBeInTheDocument();
  });

  it('shows "Unassigned" when no assignee', () => {
    renderWithProviders(<IncidentsListPage />);
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('shows assignee name when assigned', () => {
    renderWithProviders(<IncidentsListPage />);
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });
});
