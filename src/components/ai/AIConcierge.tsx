/**
 * AI Concierge Component
 * Floating AI assistant powered by Gemini for ride recommendations and support
 * Distinct from driver chat - this is for AI-powered assistance
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutRight,
} from 'react-native-reanimated';
import { ds } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { CustomIcon } from '@/components/ui/CustomIcon';
import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';
import { log } from '@/utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
}

interface AIConciergeProps {
  onDestinationSuggestion?: (destination: string) => void;
  onRideTypeRecommendation?: (rideType: string) => void;
}

// Mock Gemini response generator (replace with actual API call)
const generateConciergeResponse = async (input: string): Promise<string> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

  const lowerInput = input.toLowerCase();

  // Contextual responses
  if (lowerInput.includes('airport') || lowerInput.includes('flight')) {
    return "I'd recommend Aura Black for airport trips - extra luggage space and priority pickup at terminals. Would you like me to set that up?";
  }
  if (lowerInput.includes('cheap') || lowerInput.includes('budget')) {
    return "Aura Go is our most economical option. For even better rates, try scheduling during off-peak hours (10am-4pm or after 8pm).";
  }
  if (lowerInput.includes('fast') || lowerInput.includes('hurry') || lowerInput.includes('urgent')) {
    return "Aura X is our fastest option with priority routing. Average pickup time is under 3 minutes in your area.";
  }
  if (lowerInput.includes('group') || lowerInput.includes('friends') || lowerInput.includes('people')) {
    return "For groups, I'd suggest Aura XL (up to 6 passengers) or Aura Van (up to 8). Both include extra luggage space.";
  }
  if (lowerInput.includes('safe') || lowerInput.includes('security')) {
    return "All Aura rides include real-time trip sharing, driver verification, and 24/7 safety support. You can also enable audio recording for extra peace of mind.";
  }
  if (lowerInput.includes('cancel') || lowerInput.includes('refund')) {
    return "You can cancel any ride within 2 minutes of booking for free. After that, a small fee may apply. Need help with a specific ride?";
  }
  if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
    return "Good evening! I'm your Aura concierge. Where are we heading tonight? I can help you find the perfect ride.";
  }

  // Default response
  return "I can help you find the best ride for your needs. Just tell me where you're going or what you're looking for - fastest option, most affordable, or something specific!";
};

// Typing indicator component
const TypingIndicator: React.FC = () => {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const animate = () => {
      dot1.value = withSpring(1, { damping: 10, stiffness: 100 });
      setTimeout(() => {
        dot2.value = withSpring(1, { damping: 10, stiffness: 100 });
      }, 150);
      setTimeout(() => {
        dot3.value = withSpring(1, { damping: 10, stiffness: 100 });
      }, 300);
      setTimeout(() => {
        dot1.value = withSpring(0, { damping: 10, stiffness: 100 });
        dot2.value = withSpring(0, { damping: 10, stiffness: 100 });
        dot3.value = withSpring(0, { damping: 10, stiffness: 100 });
      }, 600);
    };

    animate();
    const interval = setInterval(animate, 1200);
    return () => clearInterval(interval);
  }, [dot1, dot2, dot3]);

  const dotStyle1 = useAnimatedStyle(() => ({
    transform: [{ translateY: -dot1.value * 4 }],
    opacity: 0.5 + dot1.value * 0.5,
  }));

  const dotStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateY: -dot2.value * 4 }],
    opacity: 0.5 + dot2.value * 0.5,
  }));

  const dotStyle3 = useAnimatedStyle(() => ({
    transform: [{ translateY: -dot3.value * 4 }],
    opacity: 0.5 + dot3.value * 0.5,
  }));

  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        <Animated.View style={[styles.typingDot, dotStyle1]} />
        <Animated.View style={[styles.typingDot, dotStyle2]} />
        <Animated.View style={[styles.typingDot, dotStyle3]} />
      </View>
    </View>
  );
};

export const AIConcierge: React.FC<AIConciergeProps> = ({
  onDestinationSuggestion,
  onRideTypeRecommendation,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Good evening. Where are we heading tonight?',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const haptics = useHaptics();
  const sound = useSound();

  // Animation values
  const buttonScale = useSharedValue(1);
  const buttonGlow = useSharedValue(0);

  // Pulse animation for closed button
  useEffect(() => {
    if (!isOpen) {
      const interval = setInterval(() => {
        buttonGlow.value = withSpring(1, { damping: 10, stiffness: 100 });
        setTimeout(() => {
          buttonGlow.value = withSpring(0, { damping: 10, stiffness: 100 });
        }, 500);
      }, 3000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [isOpen, buttonGlow]);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
    shadowOpacity: 0.2 + buttonGlow.value * 0.3,
    shadowRadius: 15 + buttonGlow.value * 10,
  }));

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  const handleOpen = useCallback(() => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    buttonScale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
    setTimeout(() => {
      buttonScale.value = withSpring(1, { damping: 15, stiffness: 400 });
      setIsOpen(true);
    }, 100);
  }, [haptics, sound, buttonScale]);

  const handleClose = useCallback(() => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    setIsOpen(false);
  }, [haptics, sound]);

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;

    haptics.trigger('tap');
    sound.play('tapSoft');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    log.info('AI Concierge message sent', {
      event: 'ai_concierge_message',
      component: 'AIConcierge',
      messageLength: input.length,
    });

    try {
      const responseText = await generateConciergeResponse(input);

      setIsThinking(false);
      haptics.trigger('confirm');
      sound.play('success');

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: responseText,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMsg]);

      // Check for actionable suggestions
      if (responseText.includes('Aura Black') && onRideTypeRecommendation) {
        onRideTypeRecommendation('black');
      } else if (responseText.includes('Aura X') && onRideTypeRecommendation) {
        onRideTypeRecommendation('x');
      }
    } catch (error) {
      setIsThinking(false);
      haptics.trigger('error');
      sound.play('warning');

      log.error('AI Concierge error', {
        event: 'ai_concierge_error',
        component: 'AIConcierge',
      }, error);

      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, errorMsg]);
    }
  }, [input, haptics, sound, onRideTypeRecommendation]);

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === 'user';

    return (
      <Animated.View
        entering={FadeIn.duration(200)}
        style={[
          styles.messageRow,
          isUser ? styles.userMessageRow : styles.aiMessageRow,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.aiBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userText : styles.aiText,
            ]}
          >
            {item.text}
          </Text>
        </View>
      </Animated.View>
    );
  }, []);

  // Floating button when closed
  if (!isOpen) {
    return (
      <Animated.View style={[styles.floatingButton, buttonAnimatedStyle]}>
        <Pressable
          style={styles.floatingButtonInner}
          onPress={handleOpen}
          accessibilityLabel="Open AI Concierge"
          accessibilityHint="Get help finding the perfect ride"
        >
          <View style={styles.floatingButtonDot} />
        </Pressable>
      </Animated.View>
    );
  }

  // Chat panel when open
  return (
    <Animated.View
      entering={SlideInRight.duration(ds.motion.duration.entrance)}
      exiting={SlideOutRight.duration(ds.motion.duration.exit)}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <GlassCard elevated style={styles.chatCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerDot} />
              <Text style={styles.headerTitle}>AURA CONCIERGE</Text>
            </View>
            <Pressable
              style={styles.closeButton}
              onPress={handleClose}
              accessibilityLabel="Close AI Concierge"
            >
              <CustomIcon name="menu" size={16} color={ds.colors.textSecondary} />
            </Pressable>
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          />

          {/* Typing Indicator */}
          {isThinking && <TypingIndicator />}

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              placeholder="Ask Aura..."
              placeholderTextColor={ds.colors.textSecondary}
              returnKeyType="send"
              blurOnSubmit={false}
            />
            <Pressable
              style={[
                styles.sendButton,
                input.trim() ? styles.sendButtonActive : null,
              ]}
              onPress={handleSend}
              disabled={!input.trim()}
            >
              <CustomIcon
                name="chevronRight"
                size={16}
                color={input.trim() ? ds.colors.primary : ds.colors.textSecondary}
              />
            </Pressable>
          </View>
        </GlassCard>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Floating button
  floatingButton: {
    position: 'absolute',
    top: ds.spacing.lg,
    right: ds.spacing.lg,
    zIndex: 50,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ds.colors.surface,
    borderWidth: 1,
    borderColor: ds.colors.primary + '50',
    shadowColor: ds.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  floatingButtonInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingButtonDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ds.colors.primary,
  },

  // Chat container
  container: {
    position: 'absolute',
    top: ds.spacing.lg,
    right: ds.spacing.lg,
    zIndex: 50,
    width: Math.min(320, SCREEN_WIDTH - ds.spacing.lg * 2),
    maxHeight: 400,
  },
  keyboardView: {
    flex: 1,
  },
  chatCard: {
    flex: 1,
    padding: ds.spacing.md,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: ds.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.glassBorder,
    marginBottom: ds.spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ds.colors.primary,
  },
  headerTitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
    letterSpacing: ds.typography.tracking.wide,
  },
  closeButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Messages
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: ds.spacing.sm,
    gap: ds.spacing.sm,
  },
  messageRow: {
    flexDirection: 'row',
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  aiMessageRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    borderRadius: ds.radius.md,
  },
  userBubble: {
    backgroundColor: ds.colors.primary + '30',
    borderWidth: 1,
    borderColor: ds.colors.primary + '40',
    borderTopRightRadius: ds.radius.xs,
  },
  aiBubble: {
    backgroundColor: ds.colors.surface,
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    borderTopLeftRadius: ds.radius.xs,
  },
  messageText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    lineHeight: ds.typography.lineHeight.body,
  },
  userText: {
    color: ds.colors.primary,
  },
  aiText: {
    color: ds.colors.textPrimary,
  },

  // Typing indicator
  typingContainer: {
    paddingVertical: ds.spacing.xs,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.xs,
    backgroundColor: ds.colors.surface,
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    borderRadius: ds.radius.md,
    borderTopLeftRadius: ds.radius.xs,
    alignSelf: 'flex-start',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ds.colors.primary,
    opacity: 0.5,
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
    marginTop: ds.spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: ds.colors.backgroundAlt,
    borderRadius: ds.radius.sm,
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    color: ds.colors.textPrimary,
    borderWidth: 1,
    borderColor: ds.colors.glassBorder,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ds.colors.surface,
  },
  sendButtonActive: {
    backgroundColor: ds.colors.primary + '20',
  },
});

export default AIConcierge;
