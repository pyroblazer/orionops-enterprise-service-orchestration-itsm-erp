import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiClient } from './api';

// Configure notification handler for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data;

    // Always show incident escalations immediately
    if (data?.type === 'incident_escalation') {
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      };
    }

    // Show SLA breach alerts with high priority
    if (data?.type === 'sla_breach') {
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      };
    }

    // Default behavior for approval requests and other notifications
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

export type NotificationType =
  | 'incident_escalation'
  | 'approval_request'
  | 'sla_breach'
  | 'sla_warning'
  | 'ticket_assigned'
  | 'ticket_updated'
  | 'comment_added'
  | 'system';

export interface OrionNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  incidentEscalation: boolean;
  approvalRequests: boolean;
  slaBreaches: boolean;
  slaWarnings: boolean;
  ticketUpdates: boolean;
  commentReplies: boolean;
  systemAnnouncements: boolean;
}

let notificationListener: Notifications.Subscription | null = null;
let responseListener: Notifications.Subscription | null = null;

/**
 * Initialize push notifications. Request permissions and register for push token.
 */
export async function initializeNotifications(): Promise<string | null> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted');
      return null;
    }

    // Get the push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-project-id-here',
    });

    const pushToken = tokenData.data;

    // Register push token with backend
    if (pushToken) {
      try {
        await apiClient.getInstance().post('/devices/register', {
          token: pushToken,
          platform: Platform.OS,
        });
      } catch {
        // Non-critical if registration fails
        console.warn('Failed to register push token with backend');
      }
    }

    // Configure Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('incidents', {
        name: 'Incidents',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#DC2626',
        description: 'Incident escalation and SLA breach alerts',
      });

      await Notifications.setNotificationChannelAsync('approvals', {
        name: 'Approvals',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 100],
        lightColor: '#2563EB',
        description: 'Approval request notifications',
      });

      await Notifications.setNotificationChannelAsync('general', {
        name: 'General',
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: '#6B7280',
        description: 'General notifications',
      });
    }

    return pushToken;
  } catch (error) {
    console.error('Failed to initialize notifications:', error);
    return null;
  }
}

/**
 * Set up notification listeners. Returns cleanup function.
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: OrionNotification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
): () => void {
  // Listener for notifications received while app is foregrounded
  notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      const data = notification.request.content.data as Record<string, unknown>;
      const orionNotification: OrionNotification = {
        id: notification.request.identifier,
        type: (data?.type as NotificationType) || 'system',
        title: notification.request.content.title || '',
        body: notification.request.content.body || '',
        data: data || {},
        read: false,
        createdAt: new Date().toISOString(),
      };

      onNotificationReceived?.(orionNotification);
    }
  );

  // Listener for when user taps on a notification
  responseListener = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      onNotificationResponse?.(response);
    }
  );

  // Return cleanup function
  return () => {
    if (notificationListener) {
      Notifications.removeNotificationSubscription(notificationListener);
    }
    if (responseListener) {
      Notifications.removeNotificationSubscription(responseListener);
    }
  };
}

/**
 * Schedule a local notification for testing purposes.
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  secondsFromNow: number = 2
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
    },
    trigger: { seconds: secondsFromNow },
  });
}

/**
 * Get the badge count (iOS).
 */
export async function getBadgeCount(): Promise<number> {
  return Notifications.getBadgeCountAsync();
}

/**
 * Set the badge count (iOS).
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear all delivered notifications.
 */
export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
  await setBadgeCount(0);
}
