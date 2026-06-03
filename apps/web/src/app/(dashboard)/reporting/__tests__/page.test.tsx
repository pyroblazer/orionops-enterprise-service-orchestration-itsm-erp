import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReportingPage from '@/app/(dashboard)/reporting/page';

jest.mock('@/lib/api', () => ({
  api: {
    getReportSummary: jest.fn().mockResolvedValue({
      data: {
        data: {
          incidentMetrics: { mttrHours: 4.5, mttaHours: 1.2, openCount: 3, totalCount: 15 },
          slaMetrics: { breachRatePercent: 5.2, breachedCount: 5, totalInstances: 96 },
          volumeByPriority: [
            { priority: 'HIGH', count: 5 },
            { priority: 'MEDIUM', count: 8 },
          ],
          volumeByStatus: [
            { status: 'OPEN', count: 3 },
            { status: 'RESOLVED', count: 12 },
          ],
        },
      },
    }),
    getBudgetVariance: jest.fn().mockResolvedValue({
      data: { data: [{ name: 'IT Operations', budget_amount: 500000, spent: 250000 }] },
    }),
    getInvoiceAging: jest.fn().mockResolvedValue({
      data: { data: [{ aging_bucket: '0-30', count: 10 }] },
    }),
    getPOAging: jest.fn().mockResolvedValue({
      data: { data: [{ status: 'PENDING', age_bucket: '0-30', count: 5 }] },
    }),
    getVendorSpend: jest.fn().mockResolvedValue({
      data: { data: [{ name: 'Vendor A', ytd_spend: 50000 }] },
    }),
    getInventoryValuation: jest.fn().mockResolvedValue({
      data: { data: [{ warehouse_id: 'w1', total_value: 250000 }] },
    }),
    getWorkforceCapacity: jest.fn().mockResolvedValue({
      data: {
        data: [{ team_name: 'Support', allocated_hours: 160, available_hours: 100 }],
      },
    }),
  },
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

describe('Reporting Page', () => {
  it('renders page heading', () => {
    renderWithProviders(<ReportingPage />);
    expect(screen.getByRole('heading', { name: /reports.*analytics/i })).toBeInTheDocument();
  });

  it('renders period selector', () => {
    renderWithProviders(<ReportingPage />);
    const selectElements = screen.getAllByDisplayValue(/Last \d+ days/i);
    expect(selectElements.length).toBeGreaterThan(0);
  });

  it('renders ITSM tab', () => {
    renderWithProviders(<ReportingPage />);
    expect(screen.getByRole('button', { name: /ITSM/i })).toBeInTheDocument();
  });

  it('renders Finance tab', () => {
    renderWithProviders(<ReportingPage />);
    expect(screen.getByRole('button', { name: /Finance/i })).toBeInTheDocument();
  });

  it('renders Procurement tab', () => {
    renderWithProviders(<ReportingPage />);
    expect(screen.getByRole('button', { name: /Procurement/i })).toBeInTheDocument();
  });

  it('renders Inventory tab', () => {
    renderWithProviders(<ReportingPage />);
    expect(screen.getByRole('button', { name: /Inventory/i })).toBeInTheDocument();
  });

  it('renders Workforce tab', () => {
    renderWithProviders(<ReportingPage />);
    expect(screen.getByRole('button', { name: /Workforce/i })).toBeInTheDocument();
  });
});
