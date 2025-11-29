/**
 * Language Provider
 * Manages language switching and provides i18n context
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/locales/i18n';
import { log } from '@/utils/logger';

// Language options
export const SUPPORTED_LANGUAGES = {
  en: { code: 'en', name: 'English', nativeName: 'English' },
  bg: { code: 'bg', name: 'Bulgarian', nativeName: 'Български' },
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Storage key for language preference
const LANGUAGE_STORAGE_KEY = '@app_language';

// Language context interface
interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  changeLanguage: (language: SupportedLanguage) => Promise<void>;
  availableLanguages: typeof SUPPORTED_LANGUAGES;
  t: (key: string, options?: Record<string, any>) => string; // Translation function
  isRTL: boolean; // Right-to-left support for future languages
}

// Create context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Language Provider Props
interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: SupportedLanguage;
}

/**
 * Language Provider Component
 * Manages internationalization state and provides translation context
 */
export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
  defaultLanguage = 'en',
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(defaultLanguage);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved language preference on mount
  useEffect(() => {
    loadLanguagePreference();
  }, []);

  /**
   * Load language preference from storage
   */
  const loadLanguagePreference = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      
      if (savedLanguage && Object.keys(SUPPORTED_LANGUAGES).includes(savedLanguage)) {
        const language = savedLanguage as SupportedLanguage;
        await i18n.changeLanguage(language);
        setCurrentLanguage(language);
        
        log.info('Language loaded from storage', {
          event: 'language_loaded',
          component: 'LanguageProvider',
          language,
        });
      } else {
        // Use device locale if available and supported
        const deviceLanguage = getDeviceLanguage();
        if (deviceLanguage) {
          await i18n.changeLanguage(deviceLanguage);
          setCurrentLanguage(deviceLanguage);
          
          log.info('Using device language', {
            event: 'device_language_used',
            component: 'LanguageProvider',
            language: deviceLanguage,
          });
        }
      }
    } catch (error) {
      log.error('Failed to load language preference', {
        event: 'language_load_failed',
        component: 'LanguageProvider',
      }, error);
    } finally {
      setIsInitialized(true);
    }
  };

  /**
   * Get device language if supported
   */
  const getDeviceLanguage = (): SupportedLanguage | null => {
    // In a real app, you'd use expo-localization or react-native-localize
    // For now, return null to use default
    return null;
  };

  /**
   * Change app language
   */
  const changeLanguage = async (language: SupportedLanguage) => {
    try {
      // Update i18n
      await i18n.changeLanguage(language);
      
      // Save to storage
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      
      // Update state
      setCurrentLanguage(language);
      
      log.info('Language changed', {
        event: 'language_changed',
        component: 'LanguageProvider',
        language,
      });
    } catch (error) {
      log.error('Failed to change language', {
        event: 'language_change_failed',
        component: 'LanguageProvider',
        language,
      }, error);
      throw error;
    }
  };

  /**
   * Translation function
   */
  const t = (key: string, options?: Record<string, any>): string => {
    return i18n.t(key, options);
  };

  // Right-to-left support (currently all languages are LTR)
  const isRTL = false;

  // Context value
  const contextValue: LanguageContextType = {
    currentLanguage,
    changeLanguage,
    availableLanguages: SUPPORTED_LANGUAGES,
    t,
    isRTL,
  };

  // Don't render children until language is initialized
  if (!isInitialized) {
    return null;
  }

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Hook to use language context
 */
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  return context;
};

/**
 * Hook to get translation function only (convenience)
 */
export const useTranslation = () => {
  const { t } = useLanguage();
  return { t };
};

export default LanguageProvider;
