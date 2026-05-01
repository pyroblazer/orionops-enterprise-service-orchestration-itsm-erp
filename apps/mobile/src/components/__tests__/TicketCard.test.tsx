import { render, fireEvent } from '@testing-library/react-native';
import { TicketCard } from '../TicketCard';

// Mock the theme hook
jest.mock('../../theme/ThemeProvider', () => {
  const { createContext, useContext } = require('react');
  const mockColors = {
    card: '#FFFFFF',
    border: '#E2E8F0',
    borderStrong: '#CBD5E1',
    text: '#1E293B',
    textSecondary: '#475569',
    textTertiary: '#94A3B8',
    priorityCritical: '#DC2626',
    priorityHigh: '#EA580C',
    priorityMedium: '#D97706',
    priorityLow: '#16A34A',
    avatar: '#94A3B8',
    primary: '#2563EB',
    primaryLight: '#DBEAFE',
    statusNew: '#2563EB',
    statusAssigned: '#7C3AED',
    statusInProgress: '#D97706',
    statusPending: '#9333EA',
    statusResolved: '#16A34A',
    statusClosed: '#6B7280',
    success: '#16A34A',
    successLight: '#DCFCE7',
    infoLight: '#DBEAFE',
    warningLight: '#FEF3C7',
    error: '#DC2626',
    errorLight: '#FEE2E2',
    surface: '#FFFFFF',
  };

  const ThemeContext = createContext({
    theme: 'light',
    colors: mockColors,
    setTheme: jest.fn(),
    isDark: false,
    isHighContrast: false,
  });

  return {
    ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
    useTheme: () => useContext(ThemeContext),
  };
});

// Mock SLATimer since TicketCard imports it
jest.mock('../SLATimer', () => {
  const { Text } = require('react-native');
  return ({ targetDate }: { targetDate: string }) => <Text>SLA: {targetDate}</Text>;
});

// Mock StatusBadge since TicketCard imports it
jest.mock('../StatusBadge', () => {
  const { Text } = require('react-native');
  return {
    StatusBadge: ({ status }: { status: string }) => <Text>{status}</Text>,
  };
});

const mockTicket = {
  id: 'INC-001',
  title: 'Production database is unreachable',
  status: 'in_progress',
  priority: 'critical',
  assignee: { id: 'u-1', name: 'Jane Smith' },
  slaDeadline: null,
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: new Date().toISOString(),
  ticketType: 'incident' as const,
};

describe('TicketCard', () => {
  it('renders ticket title', () => {
    const { getByText } = render(
      <TicketCard ticket={mockTicket} onPress={jest.fn()} />
    );
    expect(getByText('Production database is unreachable')).toBeTruthy();
  });

  it('renders ticket ID', () => {
    const { getByText } = render(
      <TicketCard ticket={mockTicket} onPress={jest.fn()} />
    );
    expect(getByText('INC-001')).toBeTruthy();
  });

  it('renders status', () => {
    const { getByText } = render(
      <TicketCard ticket={mockTicket} onPress={jest.fn()} />
    );
    expect(getByText('in_progress')).toBeTruthy();
  });

  it('renders priority', () => {
    const { getByText } = render(
      <TicketCard ticket={mockTicket} onPress={jest.fn()} />
    );
    expect(getByText('CRITICAL')).toBeTruthy();
  });

  it('renders assignee name', () => {
    const { getByText } = render(
      <TicketCard ticket={mockTicket} onPress={jest.fn()} />
    );
    expect(getByText('Jane Smith')).toBeTruthy();
  });

  it('renders assignee initials', () => {
    const { getByText } = render(
      <TicketCard ticket={mockTicket} onPress={jest.fn()} />
    );
    expect(getByText('JS')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(
      <TicketCard ticket={mockTicket} onPress={onPress} />
    );

    const card = getByLabelText(/INC-001/);
    fireEvent.press(card);
    expect(onPress).toHaveBeenCalledWith('INC-001');
  });

  it('renders ticket without assignee', () => {
    const unassignedTicket = {
      ...mockTicket,
      assignee: null,
    };
    const { queryByText } = render(
      <TicketCard ticket={unassignedTicket} onPress={jest.fn()} />
    );
    expect(queryByText('Jane Smith')).toBeNull();
  });

  it('renders quick action button when provided', () => {
    const { getByText } = render(
      <TicketCard
        ticket={mockTicket}
        onPress={jest.fn()}
        onQuickAction={jest.fn()}
        quickActionLabel="Acknowledge"
      />
    );
    expect(getByText('Acknowledge')).toBeTruthy();
  });

  it('does not render quick action button when not provided', () => {
    const { queryByText } = render(
      <TicketCard ticket={mockTicket} onPress={jest.fn()} />
    );
    expect(queryByText('Acknowledge')).toBeNull();
  });
});
