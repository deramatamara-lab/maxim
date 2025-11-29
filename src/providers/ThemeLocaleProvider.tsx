import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';
import { ds, type ThemeMode, type Locale } from '@/constants/theme';
import { log } from '@/utils/logger';

// Theme context types
interface ThemeContextType {
  // Theme
  colors: typeof ds.colors;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
  
  // Locale
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  toggleLocale: () => Promise<void>;
  
  // Loading state
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// Storage keys
const THEME_STORAGE_KEY = 'aura_theme_mode';
const LOCALE_STORAGE_KEY = 'aura_locale';

// Theme Provider Component
export const ThemeLocaleProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { trigger } = useHaptics();
  const { play } = useSound();
  
  // State
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [locale, setLocaleState] = useState<Locale>('en');
  const [isLoading, setIsLoading] = useState(true);

  // Get current colors based on mode
  const colors = {
    ...ds.getColors(mode),
    primaryAccent: ds.colors.primaryAccent, // Add missing primaryAccent color
  };
  const isDark = mode === 'dark';

  // Load persisted settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [savedMode, savedLocale] = await Promise.all([
          AsyncStorage.getItem(THEME_STORAGE_KEY),
          AsyncStorage.getItem(LOCALE_STORAGE_KEY),
        ]);

        if (savedMode === 'light' || savedMode === 'dark') {
          setModeState(savedMode);
        }

        if (savedLocale === 'en' || savedLocale === 'bg') {
          setLocaleState(savedLocale);
        }
      } catch (error) {
        log.warn('Failed to load theme/locale settings', { event: 'load_theme_locale_settings_failed', component: 'themeLocaleProvider' }, error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Set theme mode with persistence and feedback
  const setMode = useCallback(async (newMode: ThemeMode) => {
    if (newMode === mode) return;

    try {
      // Trigger haptic and sound feedback
      trigger('tap');
      play('tapSoft');

      // Update state
      setModeState(newMode);

      // Persist to storage
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);

      // Trigger confirmation feedback
      trigger('confirm');
      play('success');
    } catch (error) {
      log.error('Failed to save theme mode', { event: 'save_theme_mode_failed', component: 'themeLocaleProvider' }, error);
      trigger('error');
      play('warning');
    }
  }, [mode, trigger, play]);

  // Toggle theme with feedback
  const toggleTheme = useCallback(async () => {
    const newMode = mode === 'dark' ? 'light' : 'dark';
    await setMode(newMode);
  }, [mode, setMode]);

  // Set locale with persistence and feedback
  const setLocale = useCallback(async (newLocale: Locale) => {
    if (newLocale === locale) return;

    try {
      // Trigger haptic and sound feedback
      trigger('tap');
      play('tapSoft');

      // Update state
      setLocaleState(newLocale);

      // Persist to storage
      await AsyncStorage.setItem(LOCALE_STORAGE_KEY, newLocale);

      // Trigger confirmation feedback
      trigger('confirm');
      play('success');
    } catch (error) {
      log.error('Failed to save locale', { event: 'save_locale_failed', component: 'themeLocaleProvider' }, error);
      trigger('error');
      play('warning');
    }
  }, [locale, trigger, play]);

  // Toggle locale with feedback
  const toggleLocale = useCallback(async () => {
    const newLocale = locale === 'en' ? 'bg' : 'en';
    await setLocale(newLocale);
  }, [locale, setLocale]);

  // Context value
  const contextValue: ThemeContextType = {
    colors,
    mode,
    isDark,
    setMode,
    toggleTheme,
    locale,
    setLocale,
    toggleLocale,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeLocaleProvider');
  }
  return {
    colors: context.colors,
    mode: context.mode,
    isDark: context.isDark,
    setMode: context.setMode,
    toggleTheme: context.toggleTheme,
  };
};

// Hook to use locale
export const useLocale = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useLocale must be used within ThemeLocaleProvider');
  }
  return {
    locale: context.locale,
    setLocale: context.setLocale,
    toggleLocale: context.toggleLocale,
  };
};

// Hook to use both theme and locale
export const useThemeLocale = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeLocale must be used within ThemeLocaleProvider');
  }
  return context;
};
