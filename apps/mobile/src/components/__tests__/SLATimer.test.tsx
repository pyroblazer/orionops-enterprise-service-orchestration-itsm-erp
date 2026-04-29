import React from 'react';
import { render } from '@testing-library/react-native';
import SLATimer from '../SLATimer';

// Mock the theme hook
jest.mock('../../theme/ThemeProvider', () => {
  const { createContext, useContext } = require('react');
  const mockColors = {
    danger: '#DC2626',
    warning: '#D97706',
    muted: '#6B7280',
    success: '#16A34A',
    textSecondary: '#475569',
    text: '#1E293B',
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

describe('SLATimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('displays countdown when target is in the future', () => {
    const futureDate = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();
    const { getByText } = render(
      <SLATimer targetDate={futureDate} status="active" label="Resolution" />
    );

    jest.advanceTimersByTime(1000);

    // Should show hours and minutes
    expect(getByText(/h.*m.*s/)).toBeTruthy();
  });

  it('displays "Breached" when target date has passed', () => {
    const pastDate = new Date(Date.now() - 60000).toISOString();
    const { getByText } = render(
      <SLATimer targetDate={pastDate} status="breached" label="Response" />
    );

    jest.advanceTimersByTime(1000);

    expect(getByText('Breached')).toBeTruthy();
  });

  it('has accessible label', () => {
    const futureDate = new Date(Date.now() + 3600000).toISOString();
    const { getByLabelText } = render(
      <SLATimer targetDate={futureDate} status="active" label="Resolution" />
    );

    const timer = getByLabelText(/Resolution/);
    expect(timer).toBeTruthy();
    expect(timer.props.accessibilityRole).toBe('timer');
  });

  it('displays the label text', () => {
    const futureDate = new Date(Date.now() + 3600000).toISOString();
    const { getByText } = render(
      <SLATimer targetDate={futureDate} status="active" label="Response Time" />
    );

    expect(getByText('Response Time')).toBeTruthy();
  });

  it('displays days when countdown exceeds 24 hours', () => {
    const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const { getByText } = render(
      <SLATimer targetDate={futureDate} status="active" label="Deadline" />
    );

    jest.advanceTimersByTime(1000);

    expect(getByText(/\d+d.*\d+h/)).toBeTruthy();
  });
});
