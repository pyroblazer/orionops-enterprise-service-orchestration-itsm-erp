import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GeneralLedgerPage from '../page';

describe('General Ledger Page', () => {
  it('renders the page title', () => {
    render(<GeneralLedgerPage />);
    expect(screen.getByText('General Ledger')).toBeInTheDocument();
  });

  it('displays tab navigation', () => {
    render(<GeneralLedgerPage />);
    expect(screen.getByText('Chart of Accounts')).toBeInTheDocument();
    expect(screen.getByText('Trial Balance')).toBeInTheDocument();
    expect(screen.getByText('Income Statement')).toBeInTheDocument();
  });

  it('loads chart of accounts on mount', async () => {
    render(<GeneralLedgerPage />);
    await waitFor(() => {
      expect(screen.getByText(/Code/i)).toBeInTheDocument();
    });
  });

  it('switches tabs when clicked', async () => {
    const user = userEvent.setup();
    render(<GeneralLedgerPage />);

    const trialBalanceTab = screen.getByText('Trial Balance');
    await user.click(trialBalanceTab);

    await waitFor(() => {
      expect(screen.getByText(/Debits|Credits/i)).toBeInTheDocument();
    });
  });
});
