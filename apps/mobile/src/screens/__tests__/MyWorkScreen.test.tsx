import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Mock the theme hook
jest.mock('../theme/ThemeProvider', () => {
  const { createContext, useContext } = require('react');
  const mockColors = {
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#475569',
    textTertiary: '#94A3B8',
    primary: '#2563EB',
    border: '#E2E8F0',
    borderStrong: '#CBD5E1',
    priorityCritical: '#DC2626',
    priorityHigh: '#EA580C',
    priorityMedium: '#D97706',
    priorityLow: '#16A34A',
    avatar: '#94A3B8',
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

// Mock StatusBadge component
jest.mock('../components/StatusBadge', () => {
  const { Text } = require('react-native');
  return ({ status }: { status: string }) => <Text>{status}</Text>;
});

// Mock SLATimer component
jest.mock('../components/SLATimer', () => {
  const { Text } = require('react-native');
  return () => <Text>SLA Timer</Text>;
});

// Mock EmptyState component
jest.mock('../components/EmptyState', () => {
  const { Text, TouchableOpacity } = require('react-native');
  return ({ title, subtitle, message, actionLabel, onAction }: any) => (
    <>
      <Text>{title}</Text>
      <Text>{subtitle || message}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </>
  );
});

// Mock API client
jest.mock('../services/api', () => ({
  apiClient: {
    getMyWork: jest.fn(),
    updateTicketStatus: jest.fn(),
  },
}));

// Mock React Query
jest.mock('@tanstack/react-query', () => {
  const { useState, useCallback } = require('react');
  return {
    useQuery: jest.fn(),
    useMutation: jest.fn(() => ({
      mutate: jest.fn(),
    })),
    useQueryClient: jest.fn(() => ({
      invalidateQueries: jest.fn(),
    })),
  };
});

import { MyWorkScreen } from '../MyWorkScreen';
import { apiClient } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const mockedUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockedUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
const mockedUseQueryClient = useQueryClient as jest.MockedFunction<typeof useQueryClient>;
const mockedGetMyWork = apiClient.getMyWork as jest.MockedFunction<typeof apiClient.getMyWork>;

const mockTickets = [
  {
    id: 'INC-001',
    title: 'VPN tunnel down',
    status: 'new',
    priority: 'critical',
    assignee: { id: 'u-1', name: 'Jane Smith' },
    slaDeadline: null,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: new Date().toISOString(),
    ticketType: 'incident' as const,
  },
  {
    id: 'INC-002',
    title: 'Email not working',
    status: 'in_progress',
    priority: 'high',
    assignee: { id: 'u-1', name: 'Jane Smith' },
    slaDeadline: null,
    createdAt: '2025-01-14T10:00:00Z',
    updatedAt: new Date().toISOString(),
    ticketType: 'incident' as const,
  },
];

describe('MyWorkScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    replace: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockedUseQueryClient.mockReturnValue({
      invalidateQueries: jest.fn(),
    } as any);

    mockedUseMutation.mockReturnValue({
      mutate: jest.fn(),
      mutateAsync: jest.fn(),
      data: undefined,
      error: null,
      variables: undefined,
      isError: false,
      isIdle: true,
      isPending: false,
      isSuccess: false,
      status: 'idle',
      reset: jest.fn(),
      context: undefined,
      failureCount: 0,
      failureReason: null,
      submittedAt: 0,
    } as any);
  });

  it('renders work queue with tickets', () => {
    mockedUseQuery.mockReturnValue({
      data: { items: mockTickets },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
      isFetching: false,
      isSuccess: true,
      isPending: false,
      error: null,
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

    const { getByText } = render(
      <MyWorkScreen navigation={mockNavigation} />
    );

    expect(getByText('VPN tunnel down')).toBeTruthy();
    expect(getByText('Email not working')).toBeTruthy();
  });

  it('shows loading indicator', () => {
    mockedUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
      isFetching: true,
      isSuccess: false,
      isPending: true,
      error: null,
      status: 'pending',
      fetchStatus: 'fetching',
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: false,
      isFetchedAfterMount: false,
      isPlaceholderData: false,
      isStale: false,
      promise: Promise.resolve({} as any),
    } as any);

    const { getByLabelText } = render(
      <MyWorkScreen navigation={mockNavigation} />
    );

    expect(getByLabelText('Loading your work queue')).toBeTruthy();
  });

  it('shows error state', () => {
    mockedUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: jest.fn(),
      isRefetching: false,
      isFetching: false,
      isSuccess: false,
      isPending: false,
      error: new Error('Failed'),
      status: 'error',
      fetchStatus: 'idle',
      dataUpdatedAt: 0,
      errorUpdatedAt: Date.now(),
      failureCount: 1,
      failureReason: new Error('Failed'),
      errorUpdateCount: 1,
      isFetched: true,
      isFetchedAfterMount: true,
      isPlaceholderData: false,
      isStale: false,
      promise: Promise.resolve({} as any),
    } as any);

    const { getByText } = render(
      <MyWorkScreen navigation={mockNavigation} />
    );

    expect(getByText('Failed to load work queue')).toBeTruthy();
  });

  it('shows empty state when no tickets', () => {
    mockedUseQuery.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
      isFetching: false,
      isSuccess: true,
      isPending: false,
      error: null,
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

    const { getByText } = render(
      <MyWorkScreen navigation={mockNavigation} />
    );

    expect(getByText('No work assigned')).toBeTruthy();
  });

  it('has pull to refresh control', () => {
    const refetch = jest.fn();
    mockedUseQuery.mockReturnValue({
      data: { items: mockTickets },
      isLoading: false,
      isError: false,
      refetch,
      isRefetching: false,
      isFetching: false,
      isSuccess: true,
      isPending: false,
      error: null,
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

    const { getByLabelText } = render(
      <MyWorkScreen navigation={mockNavigation} />
    );

    expect(getByLabelText('Pull to refresh your work queue')).toBeTruthy();
  });

  it('has accessible list label', () => {
    mockedUseQuery.mockReturnValue({
      data: { items: mockTickets },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
      isFetching: false,
      isSuccess: true,
      isPending: false,
      error: null,
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

    const { getByLabelText } = render(
      <MyWorkScreen navigation={mockNavigation} />
    );

    expect(getByLabelText('Your assigned work items')).toBeTruthy();
  });
});
