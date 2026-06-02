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
      expect(screen.getByText('Chart of Accounts')).toBeInTheDocument();
      expect(screen.getByText('Trial Balance')).toBeInTheDocument();
      expect(screen.getByText('Income Statement')).toBeInTheDocument();
    });
  });

  it('loads chart of accounts on mount', async () => {
    render(<GeneralLedgerPage />);
    await waitFor(() => {
      expect(screen.getByText(/Assets|1000/i)).toBeInTheDocument();
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
