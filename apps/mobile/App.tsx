import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { AppNavigator } from './src/navigation/AppNavigator';
import {
  initializeNotifications,
  setupNotificationListeners,
} from './src/services/notifications';
import { apiClient } from './src/services/api';

// Create React Query client with offline-aware defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (previously cacheTime)
      retry: 2,
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});

const AppContent: React.FC = () => {
  const { isDark, colors } = useTheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        // Initialize push notifications
        await initializeNotifications();

        // Set up notification listeners
        const cleanup = setupNotificationListeners(
          (notification) => {
            // Invalidate relevant queries when a notification is received
            if (notification.type === 'ticket_assigned' || notification.type === 'ticket_updated') {
              queryClient.invalidateQueries({ queryKey: ['myWork'] });
            }
            if (notification.type === 'approval_request') {
              queryClient.invalidateQueries({ queryKey: ['approvals'] });
            }
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          },
          (response) => {
            // Handle deep link from notification tap
            const data = response.notification.request.content.data as Record<string, unknown>;
            if (data?.ticketId) {
              // Navigation will be handled by the navigator
              queryClient.invalidateQueries({ queryKey: ['ticket', data.ticketId] });
            }
          }
        );

        // Attempt to sync any queued offline changes
        try {
          await apiClient.syncOfflineQueue();
        } catch {
          // Sync failure on startup is non-critical
        }

        return cleanup;
      } finally {
        setIsReady(true);
      }
    };

    const cleanupPromise = bootstrap();
    return () => {
      cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, []);

  if (!isReady) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Loading OrionOps" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
};

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.root}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
