import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../theme/ThemeProvider';
import { apiClient } from '../services/api';

interface DashboardMetrics {
  openIncidents: number;
  slaAtRisk: number;
  slaBreached: number;
  pendingApprovals: number;
  assignedToMe: number;
  resolvedToday: number;
  avgResolutionTime: string;
  firstCallResolution: number;
}

interface MetricCard {
  title: string;
  value: string | number;
  subtitle: string;
  color: string;
  bgColor: string;
  target?: string;
  navigateTo?: string;
}

interface DashboardScreenProps {
  navigation: any;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { colors, isHighContrast } = useTheme();

  const {
    data: metrics,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: () => apiClient.getDashboardMetrics(),
    staleTime: 1000 * 60 * 2,
  });

  const dashboard: DashboardMetrics = metrics || {
    openIncidents: 0,
    slaAtRisk: 0,
    slaBreached: 0,
    pendingApprovals: 0,
    assignedToMe: 0,
    resolvedToday: 0,
    avgResolutionTime: '--',
    firstCallResolution: 0,
  };

  const metricCards: MetricCard[] = [
    {
      title: 'Open Incidents',
      value: dashboard.openIncidents,
      subtitle: 'Currently open and unassigned',
      color: colors.info,
      bgColor: colors.infoLight,
      navigateTo: 'MyWork',
    },
    {
      title: 'SLA At Risk',
      value: dashboard.slaAtRisk,
      subtitle: 'Approaching deadline',
      color: colors.warning,
      bgColor: colors.warningLight,
      navigateTo: 'MyWork',
    },
    {
      title: 'SLA Breached',
      value: dashboard.slaBreached,
      subtitle: 'Requires immediate attention',
      color: colors.error,
      bgColor: colors.errorLight,
      navigateTo: 'MyWork',
    },
    {
      title: 'Pending Approvals',
      value: dashboard.pendingApprovals,
      subtitle: 'Awaiting your review',
      color: colors.primary,
      bgColor: colors.primaryLight,
      navigateTo: 'Approvals',
    },
    {
      title: 'Assigned to Me',
      value: dashboard.assignedToMe,
      subtitle: 'Your active work items',
      color: colors.statusAssigned,
      bgColor: colors.infoLight,
      navigateTo: 'MyWork',
    },
    {
      title: 'Resolved Today',
      value: dashboard.resolvedToday,
      subtitle: 'Great progress!',
      color: colors.success,
      bgColor: colors.successLight,
    },
  ];

  const handleCardPress = useCallback(
    (card: MetricCard) => {
      if (card.navigateTo) {
        // Navigate to the relevant tab screen
        navigation.navigate(card.navigateTo);
      }
    },
    [navigation]
  );

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          accessibilityLabel="Loading dashboard"
        />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          Failed to load dashboard.
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { borderColor: colors.primary, borderWidth: 1 }]}
          onPress={() => refetch()}
          accessibilityLabel="Retry loading dashboard"
          accessibilityRole="button"
        >
          <Text style={{ color: colors.primary, fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      accessibilityLabel="Dashboard with key metrics"
    >
      {/* Summary Header */}
      <View style={styles.summarySection}>
        <Text
          style={[styles.greeting, { color: colors.text }]}
          accessibilityRole="header"
          accessibilityLevel={1}
        >
          Dashboard
        </Text>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          {dashboard.assignedToMe} items assigned to you,{' '}
          {dashboard.pendingApprovals} approvals pending
        </Text>
      </View>

      {/* Metric Cards Grid */}
      <View style={styles.metricsGrid}>
        {metricCards.map((card, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.metricCard,
              {
                backgroundColor: colors.card,
                borderColor: isHighContrast ? colors.borderStrong : colors.border,
                borderWidth: isHighContrast ? 2 : 1,
              },
            ]}
            onPress={() => handleCardPress(card)}
            activeOpacity={card.navigateTo ? 0.7 : 1}
            accessibilityLabel={`${card.title}: ${card.value}. ${card.subtitle}${card.navigateTo ? '. Tap to view.' : ''}`}
            accessibilityRole={card.navigateTo ? 'button' : 'text'}
          >
            <View style={[styles.metricBadge, { backgroundColor: card.bgColor }]}>
              <Text style={[styles.metricValue, { color: card.color }]}>
                {card.value}
              </Text>
            </View>
            <Text
              style={[styles.metricTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {card.title}
            </Text>
            <Text
              style={[styles.metricSubtitle, { color: colors.textTertiary }]}
              numberOfLines={2}
            >
              {card.subtitle}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Performance Summary */}
      <View
        style={[
          styles.perfCard,
          {
            backgroundColor: colors.card,
            borderColor: isHighContrast ? colors.borderStrong : colors.border,
            borderWidth: isHighContrast ? 2 : 1,
          },
        ]}
      >
        <Text
          style={[styles.perfTitle, { color: colors.text }]}
          accessibilityRole="header"
          accessibilityLevel={2}
        >
          Performance Summary
        </Text>
        <View style={styles.perfRow}>
          <View style={styles.perfItem}>
            <Text style={[styles.perfLabel, { color: colors.textTertiary }]}>
              Avg. Resolution Time
            </Text>
            <Text style={[styles.perfValue, { color: colors.text }]}>
              {dashboard.avgResolutionTime}
            </Text>
          </View>
          <View style={[styles.perfDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.perfItem}>
            <Text style={[styles.perfLabel, { color: colors.textTertiary }]}>
              First Call Resolution
            </Text>
            <Text style={[styles.perfValue, { color: colors.success }]}>
              {dashboard.firstCallResolution}%
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
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
  summarySection: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    width: '47%',
    borderRadius: 12,
    padding: 14,
  },
  metricBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  metricSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  perfCard: {
    borderRadius: 12,
    padding: 16,
  },
  perfTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  perfRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  perfItem: {
    flex: 1,
  },
  perfLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  perfValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  perfDivider: {
    width: 1,
    height: 36,
    marginHorizontal: 16,
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
