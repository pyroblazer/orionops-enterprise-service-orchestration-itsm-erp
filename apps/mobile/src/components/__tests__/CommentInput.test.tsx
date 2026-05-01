import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CommentInput from '../CommentInput';

// Mock the theme hook
jest.mock('../../theme/ThemeProvider', () => {
  const { createContext, useContext } = require('react');
  const mockColors = {
    primary: '#2563EB',
    textSecondary: '#475569',
    text: '#1E293B',
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
  offlineStorage: {
    getDrafts: jest.fn(() => Promise.resolve([])),
    saveDraft: jest.fn(() => Promise.resolve({ id: 'draft_1', ticketId: 'ticket-1', content: '', isInternal: false, createdAt: '', updatedAt: '' })),
    deleteDraftsForTicket: jest.fn(() => Promise.resolve()),
  },
}));

import { offlineStorage } from '../../services/offline';

const mockedGetDrafts = offlineStorage.getDrafts as jest.MockedFunction<typeof offlineStorage.getDrafts>;
const mockedSaveDraft = offlineStorage.saveDraft as jest.MockedFunction<typeof offlineStorage.saveDraft>;
const mockedDeleteDraftsForTicket = offlineStorage.deleteDraftsForTicket as jest.MockedFunction<typeof offlineStorage.deleteDraftsForTicket>;

describe('CommentInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetDrafts.mockResolvedValue([]);
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
      expect(mockedSaveDraft).toHaveBeenCalled();
    });
  });

  it('loads saved draft on mount', async () => {
    mockedGetDrafts.mockResolvedValue([{ id: 'draft_1', ticketId: 'ticket-1', content: 'Saved draft content', isInternal: false, createdAt: '', updatedAt: '' }]);

    const { } = render(
      <CommentInput entityId="ticket-1" onSubmit={jest.fn()} />
    );

    await waitFor(() => {
      expect(mockedGetDrafts).toHaveBeenCalledWith('ticket-1');
    });
  });

  it('shows offline draft indicator when draft is loaded', async () => {
    mockedGetDrafts.mockResolvedValue([{ id: 'draft_1', ticketId: 'ticket-1', content: 'Saved draft', isInternal: false, createdAt: '', updatedAt: '' }]);

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
      expect(mockedDeleteDraftsForTicket).toHaveBeenCalledWith('ticket-1');
    });
  });
});
