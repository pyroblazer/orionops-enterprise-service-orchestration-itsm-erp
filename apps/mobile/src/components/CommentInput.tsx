import { useState, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { offlineStorage } from '../services/offline';
import type { DraftComment } from '../services/offline';

interface CommentInputProps {
  // Used by TicketDetailScreen (controlled mode)
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmit: (comment: string) => Promise<void>;
  isInternal?: boolean;
  onToggleInternal?: () => void;
  isSubmitting?: boolean;
  ticketId?: string;
  // Used by standalone mode (test file)
  entityId?: string;
  placeholder?: string;
}

export default function CommentInput({
  value: controlledValue,
  onChangeText: controlledOnChange,
  onSubmit,
  isInternal = false,
  onToggleInternal: _onToggleInternal,
  isSubmitting: externalIsSubmitting = false,
  ticketId,
  entityId,
  placeholder = 'Add a comment...',
}: CommentInputProps) {
  const { colors } = useTheme();
  const effectiveEntityId = ticketId || entityId || '';
  const isControlled = controlledValue !== undefined;

  const [internalText, setInternalText] = useState('');
  const [internalSubmitting, setInternalSubmitting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'draft' | 'syncing'>('idle');

  const text = isControlled ? controlledValue : internalText;
  const isSubmitting = isControlled ? externalIsSubmitting : internalSubmitting;

  useEffect(() => {
    if (!isControlled && effectiveEntityId) {
      offlineStorage.getDrafts(effectiveEntityId).then((drafts: DraftComment[]) => {
        const draft = drafts[0];
        if (draft) {
          setInternalText(draft.content);
          setSyncStatus('draft');
        }
      });
    }
  }, [effectiveEntityId, isControlled]);

  const handleChange = useCallback(
    async (val: string) => {
      if (controlledOnChange) {
        controlledOnChange(val);
      } else {
        setInternalText(val);
      }
      if (effectiveEntityId) {
        if (val.trim()) {
          await offlineStorage.saveDraft({
            ticketId: effectiveEntityId,
            content: val,
            isInternal,
          });
          setSyncStatus('draft');
        } else {
          await offlineStorage.deleteDraftsForTicket(effectiveEntityId);
          setSyncStatus('idle');
        }
      }
    },
    [effectiveEntityId, controlledOnChange, isInternal],
  );

  const handleSubmit = useCallback(async () => {
    if (!text.trim() || isSubmitting) return;
    if (!isControlled) {
      setInternalSubmitting(true);
    }
    setSyncStatus('syncing');
    try {
      await onSubmit(text.trim());
      if (!isControlled) {
        setInternalText('');
      }
      if (effectiveEntityId) {
        await offlineStorage.deleteDraftsForTicket(effectiveEntityId);
      }
      setSyncStatus('idle');
    } catch {
      setSyncStatus('draft');
    } finally {
      if (!isControlled) {
        setInternalSubmitting(false);
      }
    }
  }, [text, isSubmitting, isControlled, effectiveEntityId, onSubmit]);

  return (
    <View style={styles.container}>
      <View style={[styles.inputRow, { borderColor: colors.border }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={text}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={5000}
          accessibilityLabel="Comment input"
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: text.trim() ? colors.primary : colors.textSecondary },
          ]}
          onPress={handleSubmit}
          disabled={!text.trim() || isSubmitting}
          accessibilityLabel="Submit comment"
          accessibilityRole="button"
        >
          <Text style={styles.sendButtonText}>
            {isSubmitting ? '...' : 'Send'}
          </Text>
        </TouchableOpacity>
      </View>
      {syncStatus === 'draft' && (
        <Text style={[styles.syncStatus, { color: colors.warning }]}>
          Draft saved offline
        </Text>
      )}
      {syncStatus === 'syncing' && (
        <Text style={[styles.syncStatus, { color: colors.info }]}>
          Syncing...
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 2,
    borderRadius: 8,
    padding: 4,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    padding: 8,
    fontSize: 16,
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 4,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  syncStatus: {
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
  },
});
