import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { saveDraft, getDraft, removeDraft } from '../services/offline';

interface CommentInputProps {
  entityId: string;
  onSubmit: (comment: string) => Promise<void>;
  placeholder?: string;
}

export default function CommentInput({
  entityId,
  onSubmit,
  placeholder = 'Add a comment...',
}: CommentInputProps) {
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'draft' | 'syncing'>('idle');

  React.useEffect(() => {
    getDraft(`comment-${entityId}`).then((draft) => {
      if (draft) {
        setText(draft);
        setSyncStatus('draft');
      }
    });
  }, [entityId]);

  const handleChange = useCallback(
    async (value: string) => {
      setText(value);
      if (value.trim()) {
        await saveDraft(`comment-${entityId}`, value);
        setSyncStatus('draft');
      } else {
        await removeDraft(`comment-${entityId}`);
        setSyncStatus('idle');
      }
    },
    [entityId],
  );

  const handleSubmit = useCallback(async () => {
    if (!text.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setSyncStatus('syncing');
    try {
      await onSubmit(text.trim());
      setText('');
      await removeDraft(`comment-${entityId}`);
      setSyncStatus('idle');
    } catch {
      setSyncStatus('draft');
    } finally {
      setIsSubmitting(false);
    }
  }, [text, isSubmitting, entityId, onSubmit]);

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
            { backgroundColor: text.trim() ? colors.primary : colors.muted },
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
