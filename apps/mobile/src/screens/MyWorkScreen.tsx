import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../theme/ThemeProvider';
import { apiClient } from '../services/api';
import { TicketCard } from '../components/TicketCard';
import { EmptyState } from '../components/EmptyState';

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  assignee: { id: string; name: string; avatar?: string } | null;
  slaDeadline: string | null;
  createdAt: string;
  updatedAt: string;
  ticketType: 'incident' | 'task' | 'request';
}

interface MyWorkScreenProps {
  navigation: any;
}

export const MyWorkScreen: React.FC<MyWorkScreenProps> = ({ navigation }) => {
  const { colors, isHighContrast } = useTheme();
  const queryClient = useQueryClient();

  const {
    data: workData,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['myWork'],
    queryFn: () => apiClient.getMyWork({ limit: 50 }),
    staleTime: 1000 * 60,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: ({ ticketId }: { ticketId: string }) =>
      apiClient.updateTicketStatus(ticketId, 'acknowledged'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myWork'] });
    },
  });

  const tickets: Ticket[] = workData?.items || [];

  const handleTicketPress = useCallback(
    (ticketId: string) => {
      navigation.navigate('TicketDetail', { ticketId });
    },
    [navigation]
  );

  const handleQuickAcknowledge = useCallback(
    (ticketId: string) => {
      acknowledgeMutation.mutate({ ticketId });
    },
    [acknowledgeMutation]
  );

  const renderTicket = useCallback(
    ({ item }: { item: Ticket }) => (
      <TicketCard
        ticket={item}
        onPress={() => handleTicketPress(item.id)}
        onQuickAction={
          item.status === 'new'
            ? () => handleQuickAcknowledge(item.id)
            : undefined
        }
        quickActionLabel={item.status === 'new' ? 'Acknowledge' : undefined}
      />
    ),
    [handleTicketPress, handleQuickAcknowledge]
  );

  const keyExtractor = useCallback((item: Ticket) => item.id, []);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          accessibilityLabel="Loading your work queue"
        />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <EmptyState
          title="Failed to load work queue"
          subtitle="Pull down to refresh or try again later"
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {tickets.length === 0 ? (
        <EmptyState
          title="No work assigned"
          subtitle="You're all caught up! New tickets will appear here when assigned to you."
          actionLabel="Refresh"
          onAction={() => refetch()}
        />
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={keyExtractor}
          renderItem={renderTicket}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
              accessibilityLabel="Pull to refresh your work queue"
            />
          }
          accessibilityLabel="Your assigned work items"
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
});
