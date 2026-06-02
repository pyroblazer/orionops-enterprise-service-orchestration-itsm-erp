import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DemandPlanningPage from '@/app/(dashboard)/inventory/demand-planning/page';

jest.mock('@/lib/api', () => ({
  api: {
    getSuggestedReorderPoint: jest.fn().mockResolvedValue({ data: { data: [] } }),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/inventory/demand-planning',
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('Demand Planning Page', () => {
  it('renders without crashing', () => {
    const { container } = renderWithProviders(<DemandPlanningPage />);
    expect(container).toBeInTheDocument();
  });

  it('renders main content', () => {
    const { container } = renderWithProviders(<DemandPlanningPage />);
    const main = container.querySelector('main');
    expect(main || container.firstChild).toBeTruthy();
  });
});
