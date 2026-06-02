import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import IncidentsPage from '@/app/(dashboard)/incidents/page';

jest.mock('@/lib/hooks', () => ({
  useIncidents: jest.fn(() => ({
    data: {
      data: [
        {
          id: 'INC-001',
          title: 'Server unreachable',
          priority: 'high',
          status: 'new',
          category: 'infrastructure',
          assignedToName: 'John',
          serviceName: 'API',
          createdAt: new Date().toISOString(),
        },
      ],
      totalPages: 1,
    },
    isLoading: false,
    isError: false,
  })),
  useNotifications: jest.fn(() => ({ showNotification: jest.fn() })),
}));

jest.mock('@/lib/api', () => ({
  api: { deleteIncident: jest.fn(), bulkDeleteIncidents: jest.fn() },
  exportToCSV: jest.fn(),
}));

function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('Incidents Page', () => {
  it('renders page heading', () => {
    renderWithProviders(<IncidentsPage />);
    expect(screen.getByRole('heading', { name: 'Incidents' })).toBeInTheDocument();
  });

  it('renders refresh button', () => {
    renderWithProviders(<IncidentsPage />);
    expect(screen.getAllByRole('button').some((btn) => btn.textContent?.includes('Refresh') || btn.getAttribute('aria-label')?.includes('Refresh'))).toBe(true);
  });

  it('renders create incident link', () => {
    renderWithProviders(<IncidentsPage />);
    const createLink = screen.getAllByText(/create|new/i).find((el) => el.closest('a') || el.closest('button'));
    expect(createLink).toBeTruthy();
  });

  it('has priority column header', () => {
    renderWithProviders(<IncidentsPage />);
    const headers = screen.getAllByRole('columnheader');
    expect(headers.some((h) => h.textContent?.includes('Priority'))).toBe(true);
  });

  it('has status column header', () => {
    renderWithProviders(<IncidentsPage />);
    const headers = screen.getAllByRole('columnheader');
    expect(headers.some((h) => h.textContent?.includes('Status'))).toBe(true);
  });
});
