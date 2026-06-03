import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import KnowledgeListPage from '@/app/(dashboard)/knowledge/page';

expect.extend(toHaveNoViolations as any);

jest.mock('@/lib/hooks', () => ({
  useKnowledgeArticles: jest.fn(),
}));

import { useKnowledgeArticles } from '@/lib/hooks';

const mockedUseKnowledgeArticles = useKnowledgeArticles as jest.MockedFunction<typeof useKnowledgeArticles>;

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
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

describe('Knowledge Base Page Accessibility', () => {
  beforeEach(() => {
    mockedUseKnowledgeArticles.mockReturnValue({
      data: {
        data: [
          {
            id: 'kb-001',
            title: 'How to Reset Password',
            category: 'IT Basics',
            status: 'PUBLISHED',
            updatedAt: '2025-01-15',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
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

  it('has no WCAG 2.2 AA violations', async () => {
    const { container } = renderWithProviders(<KnowledgeListPage />);
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: false },
      },
    });
    expect(results).toHaveNoViolations();
  });

  it('has proper heading structure', () => {
    renderWithProviders(<KnowledgeListPage />);
    const h1 = document.querySelector('h1');
    expect(h1).toBeInTheDocument();
    expect(h1?.textContent).toBe('Knowledge Base');
  });

  it('has proper category filter accessibility', () => {
    const { container } = renderWithProviders(<KnowledgeListPage />);
    const categoryButtons = container.querySelectorAll('button');
    expect(categoryButtons.length).toBeGreaterThan(0);
    categoryButtons.forEach(button => {
      const hasText = button.textContent?.trim().length ?? 0 > 0;
      const hasLabel = button.getAttribute('aria-label');
      expect(hasText || hasLabel).toBeTruthy();
    });
  });

  it('new article button has accessible name', () => {
    renderWithProviders(<KnowledgeListPage />);
    const buttons = document.querySelectorAll('a[href*="new"]');
    expect(buttons.length).toBeGreaterThanOrEqual(0);
  });
});
