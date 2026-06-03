import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SettingsPage from '@/app/(dashboard)/settings/page';

jest.mock('@/lib/api', () => ({
  api: {},
}));

jest.mock('@/lib/hooks', () => ({
  useIncidents: jest.fn(() => ({ data: { data: [] }, isLoading: false })),
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

describe('Settings Page', () => {
  it('renders page heading', () => {
    renderWithProviders(<SettingsPage />);
    const heading = screen.queryByRole('heading', { name: /settings/i });
    expect(heading).toBeTruthy();
  });
});
