import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { MyWorkScreen } from '../screens/MyWorkScreen';
import { ApprovalsScreen } from '../screens/ApprovalsScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

export type MainTabParamList = {
  MyWork: undefined;
  Approvals: undefined;
  Notifications: undefined;
  Search: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

// Simple icon component using Unicode characters for zero-dependency icons
const TabIcon: React.FC<{ name: string; color: string; focused: boolean }> = ({
  name,
  color,
  focused,
}) => {
  const icons: Record<string, string> = {
    MyWork: '⚙',        // gear
    Approvals: '✔',     // checkmark
    Notifications: '🔔', // bell
    Search: '🔍',  // magnifying glass
    Profile: '👤', // bust
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 28, height: 28 }}>
      <Text
        style={{
          fontSize: focused ? 20 : 18,
          color,
          textAlign: 'center',
        }}
        accessibilityElementsHidden={true}
        importantForAccessibility="no"
      >
        {icons[name] || '?'}
      </Text>
    </View>
  );
};

export const MainTabs: React.FC = () => {
  const { colors, isHighContrast } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, focused }) => (
          <TabIcon name={route.name} color={color} focused={focused} />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: isHighContrast ? colors.borderStrong : colors.border,
          borderTopWidth: isHighContrast ? 2 : 1,
          paddingBottom: 4,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: isHighContrast ? '700' : '500',
        },
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
      })}
    >
      <Tab.Screen
        name="MyWork"
        component={MyWorkScreen}
        options={{
          title: 'My Work',
          tabBarAccessibilityLabel: 'My Work queue',
        }}
      />
      <Tab.Screen
        name="Approvals"
        component={ApprovalsScreen}
        options={{
          title: 'Approvals',
          tabBarAccessibilityLabel: 'Pending approvals',
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'Alerts',
          tabBarAccessibilityLabel: 'Notifications',
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: 'Search',
          tabBarAccessibilityLabel: 'Search tickets and articles',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarAccessibilityLabel: 'User profile and settings',
        }}
      />
    </Tab.Navigator>
  );
};
