import { render, screen, waitFor } from '@testing-library/react';
import BudgetForecastPage from '../page';
import * as apiModule from '@/lib/api';

jest.mock('@/lib/api', () => ({
  api: {
    getBudgets: jest.fn(),
    getBudgetAlerts: jest.fn(),
  },
}));

const mockApi = apiModule.api as jest.Mocked<typeof apiModule.api>;

describe('Budget Forecast Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.getBudgets.mockResolvedValue({
      data: {
        data: [
          { id: '1', name: 'Q1 Budget', allocatedAmount: 100000, spentAmount: 45000 },
          { id: '2', name: 'Q2 Budget', allocatedAmount: 150000, spentAmount: 130000 },
        ],
      },
    } as any);
    mockApi.getBudgetAlerts.mockResolvedValue({
      data: {
        data: [
          { id: '1', budgetId: '2', severity: 'high', message: 'Budget utilization is 86%' },
        ],
      },
    } as any);
  });

  it('renders the page title', async () => {
    render(<BudgetForecastPage />);
    await waitFor(() => {
      expect(screen.getByText('Budget Forecast')).toBeInTheDocument();
    });
  });

  it('displays budget forecast cards', async () => {
    render(<BudgetForecastPage />);
    await waitFor(() => {
      expect(screen.getAllByText(/Q1 Budget|Q2 Budget/i)).toHaveLength(2);
    });
  });

  it('fetches budget data on mount', async () => {
    render(<BudgetForecastPage />);
    await waitFor(() => {
      expect(mockApi.getBudgets).toHaveBeenCalled();
      expect(mockApi.getBudgetAlerts).toHaveBeenCalled();
    });
  });

  it('displays budget alerts when utilization is high', async () => {
    render(<BudgetForecastPage />);
    await waitFor(() => {
      expect(screen.getByText(/Budget utilization/i)).toBeInTheDocument();
    });
  });

  it('shows loading skeleton initially', () => {
    // Temporarily mock getBudgets to reject so component stays in loading state
    mockApi.getBudgets.mockReturnValueOnce(new Promise(() => {}) as any);
    render(<BudgetForecastPage />);
    // Component shows skeleton before data loads
    expect(document.querySelector('[class*="animate-pulse"]')).toBeInTheDocument();
  });
});
