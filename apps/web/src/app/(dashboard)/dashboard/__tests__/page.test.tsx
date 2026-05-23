import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardPage from '@/app/(dashboard)/dashboard/page';

jest.mock('@/lib/api', () => ({
  api: {
    getIncidents: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: 'inc-001-abc', title: 'Server unreachable', status: 'in_progress', priority: 'high', updatedAt: new Date().toISOString() },
          { id: 'inc-002-def', title: 'Database timeout', status: 'new', priority: 'critical', updatedAt: new Date().toISOString() },
        ],
        total: 2,
        page: 1,
        pageSize: 5,
        totalPages: 1,
      },
    }),
    getChanges: jest.fn().mockResolvedValue({
      data: { data: [], total: 3, page: 1, pageSize: 1, totalPages: 1 },
    }),
    getSLAInstances: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: 'sla-1', status: 'met' },
          { id: 'sla-2', status: 'met' },
          { id: 'sla-3', status: 'breached' },
        ],
        total: 3,
      },
    }),
  },
}));

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
  it('renders summary cards', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('Open Incidents')).toBeInTheDocument();
    expect(screen.getByText('SLA Breached')).toBeInTheDocument();
    expect(screen.getByText('Pending Approvals')).toBeInTheDocument();
    expect(screen.getByText('Active Changes')).toBeInTheDocument();
  });

  it('shows recent incidents section', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('Recent Incidents')).toBeInTheDocument();
    expect(screen.getByText('Latest incident activity')).toBeInTheDocument();
  });

  it('renders recent incident rows', async () => {
    renderWithProviders(<DashboardPage />);
    expect(await screen.findByText('Server unreachable')).toBeInTheDocument();
    expect(await screen.findByText('Database timeout')).toBeInTheDocument();
  });

  it('has quick action buttons', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getAllByText('Create Incident').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Request Change')).toBeInTheDocument();
    expect(screen.getByText('Search Knowledge Base')).toBeInTheDocument();
    expect(screen.getByText('View SLA Dashboard')).toBeInTheDocument();
  });

  it('has SLA compliance section', async () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getAllByText('SLA Compliance').length).toBeGreaterThanOrEqual(1);
  });

  it('has View All incidents link', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByLabelText('View all incidents')).toBeInTheDocument();
  });
});
