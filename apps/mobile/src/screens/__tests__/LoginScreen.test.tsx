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
    surface: '#FFFFFF',
    error: '#DC2626',
    errorLight: '#FEE2E2',
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

// Mock the api service
jest.mock('../services/api', () => ({
  apiClient: {
    loginWithKeycloak: jest.fn(() => Promise.resolve({ id: 'user-1', name: 'Test User' })),
  },
}));

import { LoginScreen } from '../LoginScreen';
import { apiClient } from '../services/api';

const mockedLogin = apiClient.loginWithKeycloak as jest.MockedFunction<typeof apiClient.loginWithKeycloak>;

describe('LoginScreen', () => {
  const mockNavigation = {
    replace: jest.fn(),
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login UI elements', () => {
    const { getByText, getByLabelText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    expect(getByText('OrionOps')).toBeTruthy();
    expect(getByText('Enterprise Service Management')).toBeTruthy();
    expect(getByText('Sign in to your account')).toBeTruthy();
    expect(getByLabelText('Username')).toBeTruthy();
    expect(getByLabelText('Password')).toBeTruthy();
    expect(getByLabelText('Sign in')).toBeTruthy();
  });

  it('renders SSO button', () => {
    const { getByLabelText } = render(
      <LoginScreen navigation={mockNavigation} />
    );
    expect(getByLabelText('Sign in with company SSO')).toBeTruthy();
  });

  it('shows error when submitting empty fields', () => {
    const { getByLabelText, getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    const signInButton = getByLabelText('Sign in');
    fireEvent.press(signInButton);

    expect(getByText('Please enter both username and password.')).toBeTruthy();
  });

  it('shows loading state during login', async () => {
    // Make login hang to see loading state
    mockedLogin.mockImplementation(() => new Promise(() => {}));

    const { getByLabelText, getByDisplayValue } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    const usernameInput = getByLabelText('Username');
    const passwordInput = getByLabelText('Password');

    fireEvent.changeText(usernameInput, 'testuser');
    fireEvent.changeText(passwordInput, 'password123');

    const signInButton = getByLabelText('Sign in');
    fireEvent.press(signInButton);

    // Check that inputs are disabled during loading
    await waitFor(() => {
      expect(usernameInput.props.editable).toBe(false);
      expect(passwordInput.props.editable).toBe(false);
    });
  });

  it('navigates to Main on successful login', async () => {
    mockedLogin.mockResolvedValue({ id: 'user-1', name: 'Test User' });

    const { getByLabelText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    const usernameInput = getByLabelText('Username');
    const passwordInput = getByLabelText('Password');

    fireEvent.changeText(usernameInput, 'testuser');
    fireEvent.changeText(passwordInput, 'password123');

    const signInButton = getByLabelText('Sign in');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(mockNavigation.replace).toHaveBeenCalledWith('Main');
    });
  });

  it('shows error on failed login', async () => {
    mockedLogin.mockRejectedValue(new Error('Invalid credentials'));

    const { getByLabelText, getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    const usernameInput = getByLabelText('Username');
    const passwordInput = getByLabelText('Password');

    fireEvent.changeText(usernameInput, 'baduser');
    fireEvent.changeText(passwordInput, 'badpass');

    const signInButton = getByLabelText('Sign in');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(getByText(/Login failed|Invalid credentials/)).toBeTruthy();
    });
  });

  it('has accessible screen label', () => {
    const { getByLabelText } = render(
      <LoginScreen navigation={mockNavigation} />
    );
    expect(getByLabelText('Login screen')).toBeTruthy();
  });
});
