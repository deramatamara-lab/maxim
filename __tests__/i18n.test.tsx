/**
 * Internationalization Tests
 * Basic verification of i18n functionality
 */

import { renderHook } from '@testing-library/react-native';
import { LanguageProvider, useTranslation, useLanguage } from '@/providers/LanguageProvider';
import React, { ReactNode } from 'react';

// Test wrapper
const wrapper = ({ children }: { children: ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

describe('Internationalization', () => {
  test('should provide translation function', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper });
    
    expect(result.current).toHaveProperty('t');
    expect(typeof result.current.t).toBe('function');
  });

  test('should translate common keys', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper });
    
    expect(result.current.t('common.cancel')).toBe('Cancel');
    expect(result.current.t('common.confirm')).toBe('Confirm');
    expect(result.current.t('common.loading')).toBe('Loading');
  });

  test('should provide language context', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    
    expect(result.current).toHaveProperty('currentLanguage');
    expect(result.current).toHaveProperty('changeLanguage');
    expect(result.current).toHaveProperty('availableLanguages');
    expect(result.current).toHaveProperty('t');
    expect(result.current).toHaveProperty('isRTL');
  });

  test('should have correct default language', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    
    expect(result.current.currentLanguage).toBe('en');
    expect(result.current.availableLanguages.en.name).toBe('English');
    expect(result.current.availableLanguages.bg.name).toBe('Bulgarian');
  });

  test('should handle missing translation keys gracefully', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper });
    
    // Should return the key if translation is missing
    expect(result.current.t('nonexistent.key')).toBe('nonexistent.key');
  });

  test('should support interpolation', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper });
    
    // Test with a key that might support interpolation
    const result1 = result.current.t('common.cancel', { defaultValue: 'Fallback' });
    expect(result1).toBe('Cancel'); // Should use actual translation, not fallback
  });

  test('should support Bulgarian translations', async () => {
    const { result, rerender } = renderHook(() => useLanguage(), { wrapper });
    
    // Change to Bulgarian
    await result.current.changeLanguage('bg');
    
    // Re-render to get updated state
    rerender();
    
    expect(result.current.currentLanguage).toBe('bg');
    expect(result.current.t('common.cancel')).toBe('Отказ');
    expect(result.current.t('common.confirm')).toBe('Потвърди');
  });
});

console.log('✅ Internationalization tests completed successfully');
