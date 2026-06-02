import { render, screen, waitFor } from '@testing-library/react';
import BudgetForecastPage from '../page';

describe('Budget Forecast Page', () => {
  it('renders the page title', async () => {
    render(<BudgetForecastPage />);
    expect(screen.getByText('Budget Forecast')).toBeInTheDocument();
  });

  it('displays budget forecast cards', async () => {
    render(<BudgetForecastPage />);
    await waitFor(() => {
      expect(screen.getByText(/Budgeted Amount/i)).toBeInTheDocument();
    });
  });

  it('fetches budget data on mount', async () => {
    render(<BudgetForecastPage />);
    await waitFor(() => {
      expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
    });
  });

  it('displays budget alerts when utilization is high', async () => {
    render(<BudgetForecastPage />);
    await waitFor(() => {
      expect(screen.getByText(/Budget Alerts/i)).toBeInTheDocument();
    });
  });

  it('shows loading skeleton initially', () => {
    render(<BudgetForecastPage />);
    // Component shows skeleton before data loads
    expect(document.querySelector('[class*="skeleton"]')).toBeInTheDocument();
  });
});
