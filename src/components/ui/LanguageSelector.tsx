/**
 * Language Selector Component
 * Allows users to switch between supported languages
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
  type ListRenderItem,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { GlassCard } from './GlassCard';
import { PremiumButton } from './PremiumButton';
import { Icon } from './Icon';
import { useLanguage, SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/providers/LanguageProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';
import { ds } from '@/constants/theme';

/**
 * Language Selector Props
 */
interface LanguageSelectorProps {
  /** Whether to show the selector as a button (default) or inline list */
  variant?: 'button' | 'inline';
  /** Custom button style */
  buttonStyle?: object;
  /** Custom modal style */
  modalStyle?: object;
  /** Whether to show native language names */
  showNativeNames?: boolean;
}

/**
 * Language Selector Component
 */
export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'button',
  buttonStyle,
  modalStyle,
  showNativeNames = true,
}) => {
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguage();
  const { trigger } = useHaptics();
  const { play } = useSound();
  const [showModal, setShowModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(currentLanguage);

  // Animation values
  const modalScale = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  // Animated styles
  const modalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // Handle button press
  const handleButtonPress = () => {
    trigger('tap');
    play('tapSoft');
    
    // Animate button
    buttonScale.value = withSpring(0.95, { damping: 15 });
    setTimeout(() => {
      buttonScale.value = withSpring(1, { damping: 15 });
    }, 100);
    
    setShowModal(true);
    modalScale.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  // Handle language selection
  const handleLanguageSelect = async (language: SupportedLanguage) => {
    trigger('tap');
    play('tapSoft');
    
    setSelectedLanguage(language);
    
    if (language !== currentLanguage) {
      try {
        await changeLanguage(language);
        
        // Close modal with animation
        modalScale.value = withSpring(0, { damping: 20, stiffness: 300 });
        setTimeout(() => {
          setShowModal(false);
        }, 200);
        
        trigger('confirm');
        play('success');
      } catch (error) {
        console.error('Failed to change language:', error);
      }
    } else {
      // Close modal if same language selected
      modalScale.value = withSpring(0, { damping: 20, stiffness: 300 });
      setTimeout(() => {
        setShowModal(false);
      }, 200);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    trigger('tap');
    play('tapSoft');
    
    modalScale.value = withSpring(0, { damping: 20, stiffness: 300 });
    setTimeout(() => {
      setShowModal(false);
      setSelectedLanguage(currentLanguage);
    }, 200);
  };

  // Render language item for list
  const renderLanguageItem: ListRenderItem<SupportedLanguage> = ({ item }) => {
    const isSelected = item === selectedLanguage;
    const language = availableLanguages[item];

    return (
      <Pressable
        style={[styles.languageItem, isSelected && styles.selectedItem]}
        onPress={() => handleLanguageSelect(item)}
        accessibilityLabel={`Select ${language.name}`}
        accessibilityRole="radio"
        accessibilityState={{ selected: isSelected }}
      >
        <View style={styles.languageInfo}>
          <Text style={styles.languageName}>
            {showNativeNames ? language.nativeName : language.name}
          </Text>
          <Text style={styles.languageCode}>{language.code.toUpperCase()}</Text>
        </View>
        
        {isSelected && (
          <Animated.View entering={FadeIn}>
            <Icon name="check" size={20} color={ds.colors.primary} />
          </Animated.View>
        )}
      </Pressable>
    );
  };

  // Render button variant
  if (variant === 'button') {
    const currentLang = availableLanguages[currentLanguage];

    return (
      <>
        <Animated.View style={[buttonAnimatedStyle, buttonStyle]}>
          <PremiumButton
            variant="secondary"
            size="sm"
            onPress={handleButtonPress}
            accessibilityLabel={`Current language: ${currentLang.name}. Tap to change language.`}
            accessibilityHint="Opens language selection modal"
            accessibilityRole="button"
          >
            <View style={styles.buttonContent}>
              <Icon name="globe" size={16} color={ds.colors.textSecondary} />
              <Text style={styles.buttonText}>
                {showNativeNames ? currentLang.nativeName : currentLang.name}
              </Text>
              <Icon name="chevronRight" size={14} color={ds.colors.textSecondary} />
            </View>
          </PremiumButton>
        </Animated.View>

        <Modal
          visible={showModal}
          transparent
          animationType="none"
          onRequestClose={handleModalClose}
          accessibilityViewIsModal={true}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalContainer, modalAnimatedStyle, modalStyle]}>
              <GlassCard elevated style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Language</Text>
                  <Pressable
                    style={styles.closeButton}
                    onPress={handleModalClose}
                    accessibilityLabel="Close language selection"
                    accessibilityRole="button"
                  >
                    <Icon name="close" size={20} color={ds.colors.textSecondary} />
                  </Pressable>
                </View>

                <FlatList
                  data={Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[]}
                  renderItem={renderLanguageItem}
                  keyExtractor={(item) => item}
                  style={styles.languageList}
                  showsVerticalScrollIndicator={false}
                  accessibilityLabel="Available languages"
                />
              </GlassCard>
            </Animated.View>
          </View>
        </Modal>
      </>
    );
  }

  // Render inline variant
  return (
    <View style={styles.inlineContainer}>
      <Text style={styles.inlineLabel}>Language</Text>
      <FlatList
        data={Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[]}
        renderItem={renderLanguageItem}
        keyExtractor={(item) => item}
        style={styles.inlineList}
        showsVerticalScrollIndicator={false}
        horizontal={false}
        accessibilityLabel="Available languages"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // Button variant styles
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.xs,
  },
  buttonText: {
    fontSize: ds.typography.size.body,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ds.spacing.xl,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 320,
  },
  modalContent: {
    padding: 0,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ds.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.border,
  },
  modalTitle: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
  },
  closeButton: {
    padding: ds.spacing.xs,
    borderRadius: ds.radius.sm,
  },

  // Language list styles
  languageList: {
    maxHeight: 300,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ds.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.border,
  },
  selectedItem: {
    backgroundColor: ds.colors.surfaceElevated,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
  },
  languageCode: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
    marginTop: 2,
  },

  // Inline variant styles
  inlineContainer: {
    gap: ds.spacing.md,
  },
  inlineLabel: {
    fontSize: ds.typography.size.bodyLg,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
  },
  inlineList: {
    maxHeight: 200,
  },
});

export default LanguageSelector;
