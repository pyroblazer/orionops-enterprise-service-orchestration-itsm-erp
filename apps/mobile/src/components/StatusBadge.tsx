import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface StatusBadgeProps {
  status: string;
  size?: 'small' | 'medium' | 'large';
}

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  open: 'Open',
  assigned: 'Assigned',
  acknowledged: 'Acknowledged',
  in_progress: 'In Progress',
  pending: 'Pending',
  resolved: 'Resolved',
  closed: 'Closed',
  cancelled: 'Cancelled',
  draft: 'Draft',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'medium' }) => {
  const { colors, isHighContrast } = useTheme();

  const getStatusColor = (s: string): { text: string; bg: string } => {
    switch (s) {
      case 'new':
      case 'open':
        return { text: colors.statusNew, bg: colors.infoLight };
      case 'assigned':
      case 'acknowledged':
        return { text: colors.statusAssigned, bg: colors.infoLight };
      case 'in_progress':
        return { text: colors.statusInProgress, bg: colors.warningLight };
      case 'pending':
        return { text: colors.statusPending, bg: colors.infoLight };
      case 'resolved':
        return { text: colors.statusResolved, bg: colors.successLight };
      case 'closed':
      case 'cancelled':
        return { text: colors.statusClosed, bg: colors.surface };
      case 'draft':
        return { text: colors.textTertiary, bg: colors.surface };
      case 'approved':
        return { text: colors.success, bg: colors.successLight };
      case 'rejected':
        return { text: colors.error, bg: colors.errorLight };
      default:
        return { text: colors.textSecondary, bg: colors.surface };
    }
  };

  const statusColor = getStatusColor(status);
  const label = STATUS_LABELS[status] || status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const sizeStyles = {
    small: { paddingHorizontal: 6, paddingVertical: 2, fontSize: 10 },
    medium: { paddingHorizontal: 8, paddingVertical: 3, fontSize: 11 },
    large: { paddingHorizontal: 10, paddingVertical: 4, fontSize: 13 },
  };

  const currentSize = sizeStyles[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: statusColor.bg,
          borderColor: isHighContrast ? statusColor.text : 'transparent',
          borderWidth: isHighContrast ? 2 : 0,
          paddingHorizontal: currentSize.paddingHorizontal,
          paddingVertical: currentSize.paddingVertical,
        },
      ]}
      accessibilityLabel={`Status: ${label}`}
      accessibilityRole="text"
    >
      <Text
        style={[
          styles.text,
          {
            color: statusColor.text,
            fontSize: currentSize.fontSize,
            fontWeight: isHighContrast ? '800' : '700',
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
