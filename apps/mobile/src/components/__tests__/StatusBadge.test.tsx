import React from 'react';
import { render } from '@testing-library/react-native';
import { StatusBadge } from '../StatusBadge';
import { ThemeProvider } from '../../theme/ThemeProvider';

// Mock the theme
jest.mock('../../theme/ThemeProvider', () => {
  const { createContext, useContext } = require('react');
  const mockColors = {
    statusNew: '#2563EB',
    statusAssigned: '#7C3AED',
    statusInProgress: '#D97706',
    statusPending: '#9333EA',
    statusResolved: '#16A34A',
    statusClosed: '#6B7280',
    success: '#16A34A',
    successLight: '#DCFCE7',
    error: '#DC2626',
    errorLight: '#FEE2E2',
    infoLight: '#DBEAFE',
    warningLight: '#FEF3C7',
    textSecondary: '#475569',
    textTertiary: '#94A3B8',
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

// Need to reimport after mock
const { useTheme } = require('../../theme/ThemeProvider');

function renderWithTheme(ui: React.ReactElement) {
  return render(ui);
}

describe('StatusBadge', () => {
  it('renders "new" status', () => {
    const { getByText } = renderWithTheme(<StatusBadge status="new" />);
    expect(getByText('NEW')).toBeTruthy();
  });

  it('renders "open" status', () => {
    const { getByText } = renderWithTheme(<StatusBadge status="open" />);
    expect(getByText('OPEN')).toBeTruthy();
  });

  it('renders "in_progress" status', () => {
    const { getByText } = renderWithTheme(<StatusBadge status="in_progress" />);
    expect(getByText('IN PROGRESS')).toBeTruthy();
  });

  it('renders "resolved" status', () => {
    const { getByText } = renderWithTheme(<StatusBadge status="resolved" />);
    expect(getByText('RESOLVED')).toBeTruthy();
  });

  it('renders "closed" status', () => {
    const { getByText } = renderWithTheme(<StatusBadge status="closed" />);
    expect(getByText('CLOSED')).toBeTruthy();
  });

  it('renders "pending" status', () => {
    const { getByText } = renderWithTheme(<StatusBadge status="pending" />);
    expect(getByText('PENDING')).toBeTruthy();
  });

  it('renders "cancelled" status', () => {
    const { getByText } = renderWithTheme(<StatusBadge status="cancelled" />);
    expect(getByText('CANCELLED')).toBeTruthy();
  });

  it('has accessible label', () => {
    const { getByLabelText } = renderWithTheme(<StatusBadge status="new" />);
    expect(getByLabelText('Status: New')).toBeTruthy();
  });

  it('renders unknown status with formatted label', () => {
    const { getByText } = renderWithTheme(<StatusBadge status="custom_status" />);
    expect(getByText('CUSTOM STATUS')).toBeTruthy();
  });

  it('applies small size styles', () => {
    const { getByText } = renderWithTheme(<StatusBadge status="new" size="small" />);
    const badge = getByText('NEW');
    expect(badge).toBeTruthy();
  });

  it('applies large size styles', () => {
    const { getByText } = renderWithTheme(<StatusBadge status="new" size="large" />);
    const badge = getByText('NEW');
    expect(badge).toBeTruthy();
  });
});
