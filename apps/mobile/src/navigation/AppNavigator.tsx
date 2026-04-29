import React from 'react';
import { NavigationContainer, DarkTheme as NavDarkTheme, DefaultTheme as NavDefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeProvider';
import { LoginScreen } from '../screens/LoginScreen';
import { MainTabs } from './MainTabs';
import { TicketDetailScreen } from '../screens/TicketDetailScreen';
import type { ThemeColors } from '../theme/colors';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  TicketDetail: { ticketId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const buildNavTheme = (colors: ThemeColors, isDark: boolean) => ({
  ...(isDark ? NavDarkTheme : NavDefaultTheme),
  colors: {
    ...(isDark ? NavDarkTheme.colors : NavDefaultTheme.colors),
    primary: colors.primary,
    background: colors.background,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    notification: colors.error,
  },
});

export const AppNavigator: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navTheme = buildNavTheme(colors, isDark);

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerBackTitleVisible: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TicketDetail"
          component={TicketDetailScreen}
          options={({ route }) => ({
            title: `Ticket ${route.params.ticketId}`,
            headerShown: true,
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
