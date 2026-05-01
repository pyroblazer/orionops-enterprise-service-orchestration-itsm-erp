import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme, ThemeMode } from '../theme/ThemeProvider';
import { apiClient } from '../services/api';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar?: string;
}

interface NotificationPreferences {
  incidentEscalation: boolean;
  approvalRequests: boolean;
  slaBreaches: boolean;
  slaWarnings: boolean;
  ticketUpdates: boolean;
  commentReplies: boolean;
  systemAnnouncements: boolean;
}

interface ProfileScreenProps {
  navigation: any;
}

const THEME_OPTIONS: { label: string; value: ThemeMode; description: string }[] = [
  { label: 'Light', value: 'light', description: 'Default light theme' },
  { label: 'Dark', value: 'dark', description: 'Reduced eye strain in low light' },
  { label: 'High Contrast', value: 'high-contrast', description: 'Maximum visibility, WCAG AAA' },
];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { colors, isHighContrast, theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiClient.getProfile(),
    staleTime: 1000 * 60 * 5,
  });

  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    incidentEscalation: true,
    approvalRequests: true,
    slaBreaches: true,
    slaWarnings: true,
    ticketUpdates: true,
    commentReplies: true,
    systemAnnouncements: false,
  });

  const updatePrefsMutation = useMutation({
    mutationFn: (prefs: Record<string, boolean>) =>
      apiClient.updateNotificationPreferences(prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const user: UserProfile = profile || {
    id: '',
    name: 'Loading...',
    email: '',
    role: '',
    department: '',
  };

  const handleThemeChange = useCallback(
    (newTheme: ThemeMode) => {
      setTheme(newTheme);
    },
    [setTheme]
  );

  const handleToggleNotif = useCallback(
    (key: keyof NotificationPreferences) => {
      const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
      setNotifPrefs(updated);
      updatePrefsMutation.mutate(updated);
    },
    [notifPrefs, updatePrefsMutation]
  );

  const handleLogout = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.logout();
          } finally {
            navigation.replace('Login');
          }
        },
      },
    ]);
  }, [navigation]);

  const notifPrefItems: { key: keyof NotificationPreferences; label: string; description: string }[] = [
    { key: 'incidentEscalation', label: 'Incident Escalations', description: 'When incidents are escalated to you' },
    { key: 'approvalRequests', label: 'Approval Requests', description: 'Pending approvals needing your action' },
    { key: 'slaBreaches', label: 'SLA Breaches', description: 'When SLAs are breached' },
    { key: 'slaWarnings', label: 'SLA Warnings', description: 'When SLAs are at risk of breach' },
    { key: 'ticketUpdates', label: 'Ticket Updates', description: 'Changes to your assigned tickets' },
    { key: 'commentReplies', label: 'Comment Replies', description: 'Replies to your comments' },
    { key: 'systemAnnouncements', label: 'System Announcements', description: 'Platform-wide announcements' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      accessibilityLabel="Profile and settings"
    >
      {/* Profile Card */}
      <View
        style={[
          styles.profileCard,
          {
            backgroundColor: colors.card,
            borderColor: isHighContrast ? colors.borderStrong : colors.border,
            borderWidth: isHighContrast ? 2 : 1,
          },
        ]}
      >
        <View
          style={[
            styles.avatarCircle,
            { backgroundColor: colors.primary, borderColor: isHighContrast ? colors.borderStrong : 'transparent', borderWidth: isHighContrast ? 3 : 0 },
          ]}
          accessibilityLabel={`Avatar for ${user.name}`}
        >
          <Text style={styles.avatarText}>
            {user.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)}
          </Text>
        </View>
        <Text
          style={[styles.userName, { color: colors.text }]}
        >
          {user.name}
        </Text>
        <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
          {user.email}
        </Text>
        <View style={styles.roleRow}>
          {user.role && (
            <View style={[styles.roleBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.roleText, { color: colors.primary }]}>
                {user.role}
              </Text>
            </View>
          )}
          {user.department && (
            <Text style={[styles.departmentText, { color: colors.textTertiary }]}>
              {user.department}
            </Text>
          )}
        </View>
      </View>

      {/* Theme Switcher */}
      <View style={styles.section}>
        <Text
          style={[styles.sectionTitle, { color: colors.text }]}
        >
          Appearance
        </Text>
        <View
          style={[
            styles.themeCard,
            {
              backgroundColor: colors.card,
              borderColor: isHighContrast ? colors.borderStrong : colors.border,
              borderWidth: isHighContrast ? 2 : 1,
            },
          ]}
        >
          {THEME_OPTIONS.map((option) => {
            const isSelected = theme === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: isSelected ? colors.primaryLight : 'transparent',
                    borderColor: isSelected
                      ? colors.primary
                      : isHighContrast
                      ? colors.borderStrong
                      : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => handleThemeChange(option.value)}
                accessibilityLabel={`${option.label} theme. ${option.description}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <View style={styles.themeOptionContent}>
                  <Text
                    style={[
                      styles.themeOptionLabel,
                      {
                        color: isSelected ? colors.primary : colors.text,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.themeOptionDesc,
                      { color: colors.textTertiary },
                    ]}
                  >
                    {option.description}
                  </Text>
                </View>
                {isSelected && (
                  <Text style={[styles.checkmark, { color: colors.primary }]}>
                    ✓
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Notification Preferences */}
      <View style={styles.section}>
        <Text
          style={[styles.sectionTitle, { color: colors.text }]}
        >
          Notification Preferences
        </Text>
        <View
          style={[
            styles.prefsCard,
            {
              backgroundColor: colors.card,
              borderColor: isHighContrast ? colors.borderStrong : colors.border,
              borderWidth: isHighContrast ? 2 : 1,
            },
          ]}
        >
          {notifPrefItems.map((item, index) => (
            <View
              key={item.key}
              style={[
                styles.prefRow,
                index < notifPrefItems.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: isHighContrast ? colors.borderStrong : colors.divider,
                },
              ]}
            >
              <View style={styles.prefTextContainer}>
                <Text style={[styles.prefLabel, { color: colors.text }]}>
                  {item.label}
                </Text>
                <Text style={[styles.prefDescription, { color: colors.textTertiary }]}>
                  {item.description}
                </Text>
              </View>
              <Switch
                value={notifPrefs[item.key]}
                onValueChange={() => handleToggleNotif(item.key)}
                trackColor={{
                  false: colors.border,
                  true: colors.primary,
                }}
                thumbColor="#FFFFFF"
                accessibilityLabel={`${item.label}: ${notifPrefs[item.key] ? 'enabled' : 'disabled'}`}
                accessibilityRole="switch"
              />
            </View>
          ))}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[
            styles.logoutButton,
            {
              backgroundColor: colors.errorLight,
              borderColor: isHighContrast ? colors.error : 'transparent',
              borderWidth: isHighContrast ? 2 : 0,
            },
          ]}
          onPress={handleLogout}
          accessibilityLabel="Sign out of OrionOps"
          accessibilityRole="button"
        >
          <Text style={[styles.logoutText, { color: colors.error }]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>

      {/* App Version */}
      <Text style={[styles.versionText, { color: colors.textTertiary }]}>
        OrionOps Mobile v0.1.0
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 12,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  departmentText: {
    fontSize: 13,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  themeCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  themeOptionContent: {
    flex: 1,
  },
  themeOptionLabel: {
    fontSize: 15,
    marginBottom: 2,
  },
  themeOptionDesc: {
    fontSize: 12,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: '700',
  },
  prefsCard: {
    borderRadius: 12,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 12,
  },
  prefTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  prefLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  prefDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  logoutButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 8,
  },
});
