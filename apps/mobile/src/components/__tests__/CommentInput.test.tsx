import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CommentInput from '../CommentInput';

// Mock the theme hook
jest.mock('../../theme/ThemeProvider', () => {
  const { createContext, useContext } = require('react');
  const mockColors = {
    primary: '#2563EB',
    muted: '#6B7280',
    text: '#1E293B',
    textSecondary: '#475569',
    border: '#E2E8F0',
    warning: '#D97706',
    info: '#2563EB',
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

// Mock the offline services
jest.mock('../../services/offline', () => ({
  getDraft: jest.fn(() => Promise.resolve(null)),
  saveDraft: jest.fn(() => Promise.resolve()),
  removeDraft: jest.fn(() => Promise.resolve()),
}));

import { getDraft, saveDraft, removeDraft } from '../../services/offline';

const mockedGetDraft = getDraft as jest.MockedFunction<typeof getDraft>;
const mockedSaveDraft = saveDraft as jest.MockedFunction<typeof saveDraft>;
const mockedRemoveDraft = removeDraft as jest.MockedFunction<typeof removeDraft>;

describe('CommentInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetDraft.mockResolvedValue(null);
  });

  it('renders text input', () => {
    const { getByLabelText } = render(
      <CommentInput entityId="ticket-1" onSubmit={jest.fn()} />
    );
    expect(getByLabelText('Comment input')).toBeTruthy();
  });

  it('renders send button', () => {
    const { getByLabelText } = render(
      <CommentInput entityId="ticket-1" onSubmit={jest.fn()} />
    );
    expect(getByLabelText('Submit comment')).toBeTruthy();
  });

  it('calls onSubmit when submitting a comment', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { getByLabelText } = render(
      <CommentInput entityId="ticket-1" onSubmit={onSubmit} />
    );

    const input = getByLabelText('Comment input');
    fireEvent.changeText(input, 'This is a test comment');

    const sendButton = getByLabelText('Submit comment');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('This is a test comment');
    });
  });

  it('does not submit empty comment', async () => {
    const onSubmit = jest.fn();
    const { getByLabelText } = render(
      <CommentInput entityId="ticket-1" onSubmit={onSubmit} />
    );

    const sendButton = getByLabelText('Submit comment');
    fireEvent.press(sendButton);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('saves draft when typing', async () => {
    const { getByLabelText } = render(
      <CommentInput entityId="ticket-1" onSubmit={jest.fn()} />
    );

    const input = getByLabelText('Comment input');
    fireEvent.changeText(input, 'Draft text');

    await waitFor(() => {
      expect(mockedSaveDraft).toHaveBeenCalledWith('comment-ticket-1', 'Draft text');
    });
  });

  it('loads saved draft on mount', async () => {
    mockedGetDraft.mockResolvedValue('Saved draft content');

    const { getByLabelText } = render(
      <CommentInput entityId="ticket-1" onSubmit={jest.fn()} />
    );

    await waitFor(() => {
      expect(mockedGetDraft).toHaveBeenCalledWith('comment-ticket-1');
    });
  });

  it('shows offline draft indicator when draft is loaded', async () => {
    mockedGetDraft.mockResolvedValue('Saved draft');

    const { getByText } = render(
      <CommentInput entityId="ticket-1" onSubmit={jest.fn()} />
    );

    await waitFor(() => {
      expect(getByText('Draft saved offline')).toBeTruthy();
    });
  });

  it('removes draft after successful submit', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { getByLabelText } = render(
      <CommentInput entityId="ticket-1" onSubmit={onSubmit} />
    );

    const input = getByLabelText('Comment input');
    fireEvent.changeText(input, 'Test comment');

    const sendButton = getByLabelText('Submit comment');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(mockedRemoveDraft).toHaveBeenCalledWith('comment-ticket-1');
    });
  });
});
