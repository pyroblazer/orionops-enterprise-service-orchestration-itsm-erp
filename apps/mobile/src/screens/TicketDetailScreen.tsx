import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme/ThemeProvider';
import { apiClient } from '../services/api';
import { offlineStorage } from '../services/offline';
import { StatusBadge } from '../components/StatusBadge';
import SLATimer from '../components/SLATimer';
import CommentInput from '../components/CommentInput';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

interface Comment {
  id: string;
  author: { id: string; name: string; avatar?: string };
  content: string;
  isInternal: boolean;
  createdAt: string;
}

type TicketDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'TicketDetail'>;

export const TicketDetailScreen: React.FC<TicketDetailScreenProps> = ({
  route,
  navigation: _navigation,
}) => {
  const { ticketId } = route.params;
  const { colors, isHighContrast } = useTheme();
  const queryClient = useQueryClient();
  const scrollViewRef = useRef<ScrollView>(null);

  const [commentText, setCommentText] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const {
    data: ticket,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => apiClient.getTicket(ticketId),
  });

  const addCommentMutation = useMutation({
    mutationFn: (params: { content: string; isInternal: boolean }) =>
      apiClient.addComment(ticketId, params.content, params.isInternal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      setCommentText('');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (params: { status: string; comment?: string }) =>
      apiClient.updateTicketStatus(ticketId, params.status, params.comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['myWork'] });
      setShowStatusPicker(false);
    },
  });

  const escalateMutation = useMutation({
    mutationFn: (reason: string) => apiClient.escalateTicket(ticketId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
    },
  });

  const handleAddComment = useCallback(async () => {
    if (!commentText.trim()) return;

    try {
      await addCommentMutation.mutateAsync({
        content: commentText.trim(),
        isInternal: isInternalComment,
      });
    } catch {
      // Save as offline draft if the request fails
      await offlineStorage.saveDraft({
        ticketId,
        content: commentText.trim(),
        isInternal: isInternalComment,
      });
      Alert.alert(
        'Saved Offline',
        'Your comment has been saved as a draft and will be sent when you are back online.',
        [{ text: 'OK' }]
      );
    }
  }, [commentText, isInternalComment, ticketId, addCommentMutation]);

  const handleAttachPhoto = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant photo library access to attach images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const formData = new FormData();
        formData.append('file', {
          uri: asset.uri,
          type: 'image/jpeg',
          name: `attachment_${Date.now()}.jpg`,
        } as any);

        await apiClient.uploadAttachment(ticketId, formData);
        queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
        Alert.alert('Success', 'Photo attached successfully.');
      }
    } catch {
      Alert.alert('Error', 'Failed to attach photo. Please try again.');
    }
  }, [ticketId, queryClient]);

  const handleEscalate = useCallback(() => {
    Alert.prompt(
      'Escalate Ticket',
      'Please provide a reason for escalation:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Escalate',
          style: 'destructive',
          onPress: (reason) => {
            if (reason) {
              escalateMutation.mutate(reason);
            }
          },
        },
      ],
      'plain-text'
    );
  }, [escalateMutation]);

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          accessibilityLabel="Loading ticket details"
        />
      </View>
    );
  }

  if (isError || !ticket) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          Failed to load ticket details.
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { borderColor: colors.primary, borderWidth: 1 }]}
          onPress={() => refetch()}
          accessibilityLabel="Retry loading ticket"
          accessibilityRole="button"
        >
          <Text style={{ color: colors.primary }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusOptions = ['new', 'assigned', 'in_progress', 'pending', 'resolved', 'closed'];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        accessibilityLabel={`Ticket ${ticket.id}: ${ticket.title}`}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View
          style={[
            styles.headerCard,
            {
              backgroundColor: colors.card,
              borderColor: isHighContrast ? colors.borderStrong : colors.border,
              borderWidth: isHighContrast ? 2 : 1,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <Text
              style={[styles.ticketId, { color: colors.textTertiary }]}
              accessibilityLabel={`Ticket number ${ticket.id}`}
            >
              {ticket.id}
            </Text>
            <StatusBadge status={ticket.status} />
          </View>
          <Text
            style={[styles.ticketTitle, { color: colors.text }]}
          >
            {ticket.title}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.textTertiary }]}>Priority:</Text>
              <Text
                style={[
                  styles.metaValue,
                  {
                    color:
                      ticket.priority === 'critical'
                        ? colors.priorityCritical
                        : ticket.priority === 'high'
                        ? colors.priorityHigh
                        : ticket.priority === 'medium'
                        ? colors.priorityMedium
                        : colors.priorityLow,
                  },
                ]}
              >
                {ticket.priority.toUpperCase()}
              </Text>
            </View>
            {ticket.assignee && (
              <View style={styles.metaItem}>
                <Text style={[styles.metaLabel, { color: colors.textTertiary }]}>Assigned to:</Text>
                <Text style={[styles.metaValue, { color: colors.text }]}>{ticket.assignee.name}</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.textTertiary }]}>Type:</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>{ticket.ticketType}</Text>
            </View>
          </View>

          {ticket.slaDeadline && (
            <View style={styles.slaRow}>
              <Text style={[styles.metaLabel, { color: colors.textTertiary }]}>SLA:</Text>
              <SLATimer targetDate={ticket.slaDeadline} status="active" label="SLA" />
            </View>
          )}
        </View>

        {/* Description */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.card,
              borderColor: isHighContrast ? colors.borderStrong : colors.border,
              borderWidth: isHighContrast ? 2 : 1,
            },
          ]}
        >
          <Text
            style={[styles.sectionTitle, { color: colors.text }]}
          >
            Description
          </Text>
          <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
            {ticket.description}
          </Text>
          <Text style={[styles.reporterText, { color: colors.textTertiary }]}>
            Reported by {ticket.reporter.name} on {formatDateTime(ticket.createdAt)}
          </Text>
        </View>

        {/* Activity / Comments Timeline */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.card,
              borderColor: isHighContrast ? colors.borderStrong : colors.border,
              borderWidth: isHighContrast ? 2 : 1,
            },
          ]}
        >
          <Text
            style={[styles.sectionTitle, { color: colors.text }]}
          >
            Activity ({ticket.comments?.length || 0})
          </Text>

          {(ticket.comments || []).length === 0 ? (
            <Text style={[styles.emptyComments, { color: colors.textTertiary }]}>
              No activity yet.
            </Text>
          ) : (
            (ticket.comments || []).map((comment: Comment) => (
              <View
                key={comment.id}
                style={[
                  styles.commentItem,
                  {
                    borderLeftColor: comment.isInternal ? colors.warning : colors.primary,
                    backgroundColor: comment.isInternal
                      ? colors.warningLight + '40'
                      : colors.surface,
                  },
                ]}
              >
                <View style={styles.commentHeader}>
                  <Text style={[styles.commentAuthor, { color: colors.text }]}>
                    {comment.author.name}
                  </Text>
                  {comment.isInternal && (
                    <View style={[styles.internalBadge, { backgroundColor: colors.warningLight }]}>
                      <Text style={[styles.internalBadgeText, { color: colors.warning }]}>
                        Internal
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.commentContent, { color: colors.textSecondary }]}>
                  {comment.content}
                </Text>
                <Text style={[styles.commentDate, { color: colors.textTertiary }]}>
                  {formatDateTime(comment.createdAt)}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          {/* Status Update */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.primaryLight,
                borderColor: isHighContrast ? colors.primary : 'transparent',
                borderWidth: isHighContrast ? 2 : 0,
              },
            ]}
            onPress={() => setShowStatusPicker(!showStatusPicker)}
            accessibilityLabel="Update ticket status"
            accessibilityRole="button"
          >
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>
              Update Status
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.warningLight,
                borderColor: isHighContrast ? colors.warning : 'transparent',
                borderWidth: isHighContrast ? 2 : 0,
              },
            ]}
            onPress={handleEscalate}
            accessibilityLabel="Escalate this ticket"
            accessibilityRole="button"
          >
            <Text style={[styles.actionButtonText, { color: colors.warning }]}>
              Escalate
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.infoLight,
                borderColor: isHighContrast ? colors.info : 'transparent',
                borderWidth: isHighContrast ? 2 : 0,
              },
            ]}
            onPress={handleAttachPhoto}
            accessibilityLabel="Attach a photo to this ticket"
            accessibilityRole="button"
          >
            <Text style={[styles.actionButtonText, { color: colors.info }]}>
              Attach Photo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Status Picker */}
        {showStatusPicker && (
          <View
            style={[
              styles.statusPicker,
              {
                backgroundColor: colors.card,
                borderColor: isHighContrast ? colors.borderStrong : colors.border,
                borderWidth: isHighContrast ? 2 : 1,
              },
            ]}
          >
            <Text style={[styles.pickerTitle, { color: colors.text }]}>Set Status:</Text>
            {statusOptions.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.pickerOption,
                  {
                    borderBottomColor: colors.divider,
                  },
                ]}
                onPress={() => {
                  updateStatusMutation.mutate({ status });
                }}
                accessibilityLabel={`Set status to ${status.replace('_', ' ')}`}
                accessibilityRole="button"
              >
                <StatusBadge status={status} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Comment Input - pinned to bottom */}
      <CommentInput
        value={commentText}
        onChangeText={setCommentText}
        onSubmit={handleAddComment}
        isInternal={isInternalComment}
        onToggleInternal={() => setIsInternalComment(!isInternalComment)}
        isSubmitting={addCommentMutation.isPending}
        ticketId={ticketId}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketId: {
    fontSize: 13,
    fontWeight: '600',
  },
  ticketTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    lineHeight: 26,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaLabel: {
    fontSize: 13,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  slaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  sectionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  reporterText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  emptyComments: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  commentItem: {
    borderLeftWidth: 3,
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
  },
  internalBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  internalBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  commentDate: {
    fontSize: 12,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusPicker: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  pickerTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  pickerOption: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
});
