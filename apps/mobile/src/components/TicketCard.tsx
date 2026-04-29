import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { StatusBadge } from './StatusBadge';
import { SLATimer } from './SLATimer';

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

interface TicketCardProps {
  ticket: Ticket;
  onPress: (ticketId: string) => void;
  onQuickAction?: () => void;
  quickActionLabel?: string;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  onPress,
  onQuickAction,
  quickActionLabel,
}) => {
  const { colors, isHighContrast } = useTheme();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return colors.priorityCritical;
      case 'high':
        return colors.priorityHigh;
      case 'medium':
        return colors.priorityMedium;
      case 'low':
        return colors.priorityLow;
      default:
        return colors.textTertiary;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'incident':
        return '🚨';
      case 'task':
        return '✓';
      case 'request':
        return '📋';
      default:
        return '📄';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatRelativeDate = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isHighContrast ? colors.borderStrong : colors.border,
          borderWidth: isHighContrast ? 2 : 1,
        },
      ]}
      onPress={() => onPress(ticket.id)}
      activeOpacity={0.7}
      accessibilityLabel={`Ticket ${ticket.id}: ${ticket.title}. Status: ${ticket.status.replace('_', ' ')}. Priority: ${ticket.priority}${ticket.assignee ? `. Assigned to ${ticket.assignee.name}` : '. Unassigned'}`}
      accessibilityRole="button"
    >
      {/* Top row: type icon, ID, status badge */}
      <View style={styles.topRow}>
        <View style={styles.idRow}>
          <Text style={styles.typeIcon}>{getTypeIcon(ticket.ticketType)}</Text>
          <Text style={[styles.ticketId, { color: colors.textTertiary }]}>
            {ticket.id}
          </Text>
        </View>
        <StatusBadge status={ticket.status} />
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
        {ticket.title}
      </Text>

      {/* Meta row: priority, assignee, time */}
      <View style={styles.metaRow}>
        <View
          style={[
            styles.priorityBadge,
            {
              backgroundColor: getPriorityColor(ticket.priority) + '20',
              borderColor: isHighContrast ? getPriorityColor(ticket.priority) : 'transparent',
              borderWidth: isHighContrast ? 2 : 0,
            },
          ]}
        >
          <Text style={[styles.priorityText, { color: getPriorityColor(ticket.priority) }]}>
            {ticket.priority.toUpperCase()}
          </Text>
        </View>

        {ticket.assignee && (
          <View style={styles.assigneeRow}>
            <View
              style={[
                styles.avatarCircle,
                { backgroundColor: colors.avatar },
              ]}
            >
              <Text style={styles.avatarInitials}>
                {getInitials(ticket.assignee.name)}
              </Text>
            </View>
            <Text style={[styles.assigneeName, { color: colors.textSecondary }]} numberOfLines={1}>
              {ticket.assignee.name}
            </Text>
          </View>
        )}

        <Text style={[styles.timeText, { color: colors.textTertiary }]}>
          {formatRelativeDate(ticket.updatedAt)}
        </Text>
      </View>

      {/* SLA Timer */}
      {ticket.slaDeadline && (
        <View style={styles.slaRow}>
          <SLATimer deadline={ticket.slaDeadline} />
        </View>
      )}

      {/* Quick Action Button */}
      {onQuickAction && quickActionLabel && (
        <TouchableOpacity
          style={[
            styles.quickAction,
            {
              backgroundColor: colors.primaryLight,
              borderColor: isHighContrast ? colors.primary : 'transparent',
              borderWidth: isHighContrast ? 2 : 0,
            },
          ]}
          onPress={(e) => {
            e.stopPropagation();
            onQuickAction();
          }}
          accessibilityLabel={quickActionLabel}
          accessibilityRole="button"
        >
          <Text style={[styles.quickActionText, { color: colors.primary }]}>
            {quickActionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeIcon: {
    fontSize: 14,
  },
  ticketId: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  priorityBadge: {
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    minWidth: 0,
  },
  avatarCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  assigneeName: {
    fontSize: 12,
    flex: 1,
  },
  timeText: {
    fontSize: 12,
  },
  slaRow: {
    marginTop: 8,
  },
  quickAction: {
    marginTop: 10,
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
