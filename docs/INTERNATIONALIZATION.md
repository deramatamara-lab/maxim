# Internationalization (i18n) Setup

This document describes the internationalization setup for Project Aura, supporting multiple languages for a global user base.

## Overview

The app uses `react-i18next` and `i18next` for internationalization, with support for English and Bulgarian languages out of the box.

## Architecture

### Core Components

1. **i18n Configuration** (`src/locales/i18n.ts`)
   - Main i18n setup with translation resources
   - Supports English (`en`) and Bulgarian (`bg`)
   - Configured with fallback to English

2. **Language Provider** (`src/providers/LanguageProvider.tsx`)
   - React context provider for language state
   - Handles language switching and persistence
   - Provides translation hooks

3. **Language Selector** (`src/components/ui/LanguageSelector.tsx`)
   - UI component for language selection
   - Modal and inline variants available
   - Animated transitions and haptic feedback

## Usage

### Basic Translation

```tsx
import { useTranslation } from '@/providers/LanguageProvider';

function MyComponent() {
  const { t } = useTranslation();
  
  return <Text>{t('common.cancel')}</Text>;
}
```

### Language Switching

```tsx
import { LanguageSelector } from '@/components/ui/LanguageSelector';

function Header() {
  return (
    <View>
      <LanguageSelector variant="button" />
    </View>
  );
}
```

### Advanced Usage

```tsx
import { useLanguage } from '@/providers/LanguageProvider';

function LanguageInfo() {
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguage();
  
  const handleLanguageChange = async (lang) => {
    await changeLanguage(lang);
  };
  
  return (
    <View>
      <Text>Current: {availableLanguages[currentLanguage].name}</Text>
    </View>
  );
}
```

## Translation Keys

Translation keys are organized by feature area:

### Common (`common.*)
- `cancel` - Cancel button
- `confirm` - Confirm button
- `loading` - Loading state
- `error` - Error messages
- `success` - Success messages

### Navigation (`nav.*)
- `home` - Home screen
- `activity` - Activity screen
- `location` - Location screen
- `profile` - Profile screen

### Home Screen (`home.*)
- `where_to` - Destination input placeholder
- `welcome` - Welcome message
- `request_ride` - Request ride button
- `select_dest` - Select destination message

### Active Ride (`active_ride.*)
- `connecting` - Connecting to fleet
- `confirmed` - Driver confirmed
- `arriving` - Driver arriving
- `en_route` - En route to destination
- `message` - Message driver button
- `cancel_ride` - Cancel ride button

### Receipt (`receipt.*)
- `ride_complete` - Ride complete message
- `rate_trip` - Rate trip prompt
- `payment_confirmed` - Payment confirmation

## Adding New Languages

1. **Update i18n Configuration**
   ```tsx
   // src/locales/i18n.ts
   const resources = {
     en: { /* existing */ },
     bg: { /* existing */ },
     es: { // Add Spanish
       translation: {
         common: {
           cancel: "Cancelar",
           // ... more translations
         }
       }
     }
   };
   ```

2. **Update Language Provider**
   ```tsx
   // src/providers/LanguageProvider.tsx
   export const SUPPORTED_LANGUAGES = {
     en: { code: 'en', name: 'English', nativeName: 'English' },
     bg: { code: 'bg', name: 'Bulgarian', nativeName: 'Български' },
     es: { code: 'es', name: 'Spanish', nativeName: 'Español' },
   };
   ```

3. **Add Translations**
   - Follow the existing key structure
   - Use consistent terminology
   - Test with real users if possible

## Best Practices

### Translation Guidelines

1. **Use Descriptive Keys**
   ```tsx
   // Good
   t('active_ride.driver_confirmed')
   
   // Bad
   t('driver_confirmed')
   ```

2. **Group Related Keys**
   ```tsx
   // Good
   t('ride_select.request')
   t('ride_select.customize')
   
   // Bad
   t('request')
   t('customize')
   ```

3. **Avoid Concatenation**
   ```tsx
   // Good
   t('ride_select.request_ride', { count: 3 })
   
   // Bad
   t('ride_select.request') + ' ' + t('ride_select.ride')
   ```

### Component Integration

1. **Always use the hook**
   ```tsx
   // Good
   const { t } = useTranslation();
   
   // Bad
   import i18n from 'i18next';
   i18n.t('key')
   ```

2. **Handle missing translations gracefully**
   ```tsx
   const text = t('some.key', { defaultValue: 'Fallback text' });
   ```

3. **Use proper accessibility**
   ```tsx
   <Button
     accessibilityLabel={t('common.cancel')}
     accessibilityHint={t('common.cancel_hint')}
   >
     {t('common.cancel')}
   </Button>
   ```

## Performance Considerations

1. **Lazy Loading**: Translation resources are loaded on demand
2. **Caching**: Language preferences are cached in AsyncStorage
3. **Minimal Re-renders**: Language context is optimized with React.memo

## Testing

### Unit Tests

```tsx
import { renderHook } from '@testing-library/react-native';
import { LanguageProvider, useTranslation } from '@/providers/LanguageProvider';

test('should translate text correctly', () => {
  const wrapper = ({ children }) => (
    <LanguageProvider>{children}</LanguageProvider>
  );
  
  const { result } = renderHook(() => useTranslation(), { wrapper });
  
  expect(result.current.t('common.cancel')).toBe('Cancel');
});
```

### Integration Tests

Test language switching functionality:
1. Verify language persistence
2. Check UI updates on language change
3. Test fallback behavior

## Troubleshooting

### Common Issues

1. **Missing Translation Keys**
   - Check the translation file
   - Verify key spelling and nesting

2. **Language Not Switching**
   - Ensure LanguageProvider wraps the component
   - Check AsyncStorage permissions

3. **Performance Issues**
   - Avoid excessive re-renders
   - Use translation keys efficiently

### Debug Mode

Enable debug mode in development:
```tsx
// src/locales/i18n.ts
i18n.init({
  debug: __DEV__, // Shows missing keys in console
});
```

## Future Enhancements

1. **RTL Support**: Add right-to-left language support
2. **Pluralization**: Implement proper pluralization rules
3. **Dynamic Loading**: Load translations from API
4. **Date/Time Formatting**: Localize dates and times
5. **Currency Formatting**: Localize currency display

## Resources

- [React i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [Expo Localization](https://docs.expo.dev/guides/localization/)
