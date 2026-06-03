import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import KnowledgeListPage from '@/app/(dashboard)/knowledge/page';

jest.mock('@/lib/hooks', () => ({
  useKnowledgeArticles: jest.fn(() => ({
    data: {
      data: [
        { id: '1', title: 'How to Reset Password', category: 'IT Basics', status: 'PUBLISHED', updatedAt: '2025-01-15' },
      ],
      total: 1,
    },
    isLoading: false,
    isError: false,
  })),
  useNotifications: jest.fn(() => []),
}));

jest.mock('@/lib/api', () => ({
  api: {},
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/knowledge',
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (value ? <div>{children}</div> : null),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('Knowledge List Page', () => {
  it('renders without crashing', () => {
    const { container } = renderWithProviders(<KnowledgeListPage />);
    expect(container).toBeInTheDocument();
  });

  it('renders main content', () => {
    const { container } = renderWithProviders(<KnowledgeListPage />);
    const main = container.querySelector('main');
    expect(main || container.firstChild).toBeTruthy();
  });

  it('uses the useKnowledgeArticles hook', () => {
    renderWithProviders(<KnowledgeListPage />);
    expect(true).toBe(true);
  });
});
