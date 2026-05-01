import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { themes, ThemeMode, ThemeColors } from './colors';

export type { ThemeMode };

const THEME_KEY = 'orionops_theme_preference';

interface ThemeContextValue {
  theme: ThemeMode;
  colors: ThemeColors;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
  isHighContrast: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  colors: themes.light,
  setTheme: () => {},
  isDark: false,
  isHighContrast: false,
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await SecureStore.getItemAsync(THEME_KEY);
        if (stored && stored in themes) {
          setThemeState(stored as ThemeMode);
        } else if (systemColorScheme === 'dark') {
          setThemeState('dark');
        }
      } catch {
        // SecureStore may not be available in all environments
        if (systemColorScheme === 'dark') {
          setThemeState('dark');
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();
  }, [systemColorScheme]);

  const setTheme = useCallback(async (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      await SecureStore.setItemAsync(THEME_KEY, newTheme);
    } catch {
      // Persist failure is non-critical
    }
  }, []);

  const isDark = theme === 'dark' || theme === 'high-contrast';
  const isHighContrast = theme === 'high-contrast';
  const colors = themes[theme];

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, colors, setTheme, isDark, isHighContrast }),
    [theme, colors, setTheme, isDark, isHighContrast]
  );

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
