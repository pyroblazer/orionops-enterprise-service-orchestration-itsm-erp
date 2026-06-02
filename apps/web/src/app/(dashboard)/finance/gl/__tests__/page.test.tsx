import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GeneralLedgerPage from '../page';
import * as apiModule from '@/lib/api';

jest.mock('@/lib/api', () => ({
  api: {
    getChartOfAccounts: jest.fn(),
    getTrialBalance: jest.fn(),
    getIncomeStatement: jest.fn(),
  },
}));

const mockApi = apiModule.api as jest.Mocked<typeof apiModule.api>;

describe('General Ledger Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.getChartOfAccounts.mockResolvedValue({
      data: {
        data: [
          { code: '1000', name: 'Assets', balance: 100000 },
          { code: '2000', name: 'Liabilities', balance: 50000 },
        ],
      },
    } as any);
    mockApi.getTrialBalance.mockResolvedValue({
      data: {
        data: {
          totalDebits: 100000,
          totalCredits: 100000,
        },
      },
    } as any);
    mockApi.getIncomeStatement.mockResolvedValue({
      data: {
        data: {
          revenue: 500000,
          expenses: 300000,
        },
      },
    } as any);
  });

  it('renders the page title', async () => {
    render(<GeneralLedgerPage />);
    await waitFor(() => {
      expect(screen.getByText('General Ledger')).toBeInTheDocument();
    });
  });

  it('displays tab navigation', async () => {
    render(<GeneralLedgerPage />);
    await waitFor(() => {
      const chartTabs = screen.getAllByText('Chart of Accounts');
      const trialTabs = screen.getAllByText('Trial Balance');
      const incomeTabs = screen.getAllByText('Income Statement');
      expect(chartTabs.length).toBeGreaterThan(0);
      expect(trialTabs.length).toBeGreaterThan(0);
      expect(incomeTabs.length).toBeGreaterThan(0);
    });
  });

  it('loads chart of accounts on mount', async () => {
    render(<GeneralLedgerPage />);
    await waitFor(() => {
      const matches = screen.getAllByText(/Assets|1000/i);
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  it('switches tabs when clicked', async () => {
    const user = userEvent.setup();
    render(<GeneralLedgerPage />);

    await waitFor(() => {
      expect(screen.getByText('Trial Balance')).toBeInTheDocument();
    });

    const trialBalanceTab = screen.getByText('Trial Balance');
    await user.click(trialBalanceTab);

    await waitFor(() => {
      expect(mockApi.getTrialBalance).toHaveBeenCalled();
    });
  });
});
