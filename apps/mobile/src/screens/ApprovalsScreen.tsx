import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../theme/ThemeProvider';
import { apiClient } from '../services/api';
import { EmptyState } from '../components/EmptyState';

interface ApprovalItem {
  id: string;
  type: 'change' | 'request' | 'expense';
  title: string;
  description: string;
  requestedBy: { id: string; name: string };
  createdAt: string;
  priority: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface ApprovalsScreenProps {
  navigation: any;
}

export const ApprovalsScreen: React.FC<ApprovalsScreenProps> = ({ navigation }) => {
  const { colors, isHighContrast } = useTheme();
  const queryClient = useQueryClient();
  const listRef = useRef<FlatList>(null);

  const {
    data: approvalsData,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['approvals'],
    queryFn: () => apiClient.getPendingApprovals({ limit: 50 }),
    staleTime: 1000 * 30,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      apiClient.approveRequest(id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.rejectRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });

  const handleApprove = useCallback(
    (item: ApprovalItem) => {
      Alert.alert(
        'Approve Request',
        `Are you sure you want to approve "${item.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Approve',
            style: 'default',
            onPress: () => approveMutation.mutate({ id: item.id }),
          },
        ]
      );
    },
    [approveMutation]
  );

  const handleReject = useCallback(
    (item: ApprovalItem) => {
      Alert.prompt(
        'Reject Request',
        `Please provide a reason for rejecting "${item.title}":`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reject',
            style: 'destructive',
            onPress: (reason) => {
              if (reason) {
                rejectMutation.mutate({ id: item.id, reason });
              }
            },
          },
        ],
        'plain-text'
      );
    },
    [rejectMutation]
  );

  const getTypeIcon = (type: ApprovalItem['type']) => {
    switch (type) {
      case 'change':
        return '🔄';
      case 'request':
        return '📋';
      case 'expense':
        return '💰';
      default:
        return '📄';
    }
  };

  const getTypeLabel = (type: ApprovalItem['type']) => {
    switch (type) {
      case 'change':
        return 'Change Request';
      case 'request':
        return 'Service Request';
      case 'expense':
        return 'Expense Approval';
      default:
        return 'Request';
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: ApprovalItem }) => (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: isHighContrast ? colors.borderStrong : colors.border,
            borderWidth: isHighContrast ? 2 : 1,
          },
        ]}
        accessibilityLabel={`${getTypeLabel(item.type)}: ${item.title}, requested by ${item.requestedBy.name}`}
        accessibilityRole="button"
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeIcon}>{getTypeIcon(item.type)}</Text>
            <Text style={[styles.typeLabel, { color: colors.textSecondary }]}>
              {getTypeLabel(item.type)}
            </Text>
          </View>
          <Text style={[styles.dateText, { color: colors.textTertiary }]}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Card Body */}
        <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
        <Text
          style={[styles.cardDescription, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {item.description}
        </Text>
        <Text style={[styles.requesterText, { color: colors.textTertiary }]}>
          Requested by {item.requestedBy.name}
        </Text>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.approveButton,
              { backgroundColor: colors.successLight, borderColor: isHighContrast ? colors.success : 'transparent', borderWidth: isHighContrast ? 2 : 0 },
            ]}
            onPress={() => handleApprove(item)}
            disabled={approveMutation.isPending}
            accessibilityLabel={`Approve ${item.title}`}
            accessibilityRole="button"
          >
            <Text style={[styles.approveText, { color: colors.success }]}>
              Approve
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.rejectButton,
              { backgroundColor: colors.errorLight, borderColor: isHighContrast ? colors.error : 'transparent', borderWidth: isHighContrast ? 2 : 0 },
            ]}
            onPress={() => handleReject(item)}
            disabled={rejectMutation.isPending}
            accessibilityLabel={`Reject ${item.title}`}
            accessibilityRole="button"
          >
            <Text style={[styles.rejectText, { color: colors.error }]}>
              Reject
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [colors, isHighContrast, handleApprove, handleReject, approveMutation.isPending, rejectMutation.isPending]
  );

  const keyExtractor = useCallback((item: ApprovalItem) => item.id, []);

  const approvals: ApprovalItem[] = approvalsData?.items || [];

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          accessibilityLabel="Loading pending approvals"
        />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <EmptyState
          title="Failed to load approvals"
          subtitle="Pull down to refresh or try again later"
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {approvals.length === 0 ? (
        <EmptyState
          title="No pending approvals"
          subtitle="All caught up! New approval requests will appear here."
          actionLabel="Refresh"
          onAction={() => refetch()}
        />
      ) : (
        <FlatList
          ref={listRef}
          data={approvals}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
              accessibilityLabel="Pull to refresh approvals"
            />
          }
          accessibilityLabel="Pending approval requests"
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
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
  listContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeIcon: {
    fontSize: 16,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  requesterText: {
    fontSize: 13,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  approveButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  approveText: {
    fontSize: 14,
    fontWeight: '700',
  },
  rejectButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  rejectText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
