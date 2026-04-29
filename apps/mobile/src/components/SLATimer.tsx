import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface SLATimerProps {
  targetDate: string;
  status: 'active' | 'at_risk' | 'breached' | 'paused';
  label: string;
}

export default function SLATimer({ targetDate, status, label }: SLATimerProps) {
  const { colors } = useTheme();
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const update = () => {
      const target = new Date(targetDate).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setRemaining('Breached');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setRemaining(`${days}d ${hours % 24}h`);
      } else {
        setRemaining(`${hours}h ${minutes}m ${seconds}s`);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const statusColor =
    status === 'breached'
      ? colors.danger
      : status === 'at_risk'
        ? colors.warning
        : status === 'paused'
          ? colors.muted
          : colors.success;

  return (
    <View
      style={[styles.container, { borderColor: statusColor }]}
      accessibilityLabel={`${label}: ${remaining}, status ${status}`}
      accessibilityRole="timer"
    >
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.time, { color: statusColor }]}>{remaining}</Text>
      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 2,
    borderRadius: 8,
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  time: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
