/**
 * In-App Chat Interface Component
 * Real-time messaging between rider and driver
 * 
 * Features:
 * - Text messaging with typing indicators
 * - File attachments (images, documents)
 * - Voice messages with recording
 * - Quick reply suggestions
 * - Message reactions
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { ds } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { Icon } from '@/components/ui/Icon';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { useChat } from '@/hooks/useWebSocket';
import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';
import { log } from '@/utils/logger';
import { ChatMessage } from '@/services/websocketService';

// Extended message type with attachments
export interface ExtendedChatMessage extends ChatMessage {
  attachmentType?: 'image' | 'voice' | 'file' | 'location';
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentDuration?: number; // For voice messages in seconds
  attachmentSize?: number; // File size in bytes
  isVoicePlaying?: boolean;
}

// Quick reply suggestions
const QUICK_REPLIES = [
  "I'm on my way!",
  "Be there in 5 minutes",
  "I'm at the pickup point",
  "Can you come to the entrance?",
  "I'll be right out",
  "Thank you!",
];

interface ChatInterfaceProps {
  rideId: string;
  driverName?: string;
  onClose?: () => void;
}

export default function ChatInterface({ rideId, driverName, onClose }: ChatInterfaceProps) {
  const {
    messages,
    unreadCount,
    sendMessage,
    markAsRead,
    markAllAsRead,
  } = useChat(rideId);
  
  const haptics = useHaptics();
  const sound = useSound();
  
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const fadeValue = useSharedValue(0);
  const recordingPulse = useSharedValue(1);

  useEffect(() => {
    fadeValue.value = withTiming(1, { duration: 300 });
  }, [fadeValue]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    // Mark messages as read when component is active
    if (unreadCount > 0) {
      markAllAsRead();
    }
  }, [unreadCount, markAllAsRead]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
  }));

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;

    haptics.trigger('tap');
    sound.play('tapSoft');
    sendMessage(inputText.trim());
    setInputText('');
    setIsTyping(false);
    setShowQuickReplies(false);
  }, [inputText, haptics, sound, sendMessage]);

  const handleInputChange = useCallback((text: string) => {
    setInputText(text);
    setIsTyping(text.length > 0);
    if (text.length > 0) {
      setShowQuickReplies(false);
    }
  }, []);

  const handleQuickReply = useCallback((reply: string) => {
    haptics.trigger('tap');
    sound.play('tapSoft');
    sendMessage(reply);
    setShowQuickReplies(false);
    log.info('Quick reply sent', { event: 'quick_reply_sent', component: 'ChatInterface', reply });
  }, [haptics, sound, sendMessage]);

  // Voice recording handlers
  const startRecording = useCallback(async () => {
    haptics.trigger('tap');
    setIsRecording(true);
    setRecordingDuration(0);
    
    // Start pulse animation
    recordingPulse.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      true
    );
    
    // Start duration timer
    recordingTimerRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
    
    log.info('Voice recording started', { event: 'voice_recording_start', component: 'ChatInterface' });
  }, [haptics, recordingPulse]);

  const stopRecording = useCallback(async () => {
    if (!isRecording) return;
    
    haptics.trigger('confirm');
    sound.play('success');
    setIsRecording(false);
    recordingPulse.value = 1;
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    // In production, this would upload the recording and send as message
    if (recordingDuration >= 1) {
      // Simulate sending voice message
      log.info('Voice message sent', { 
        event: 'voice_message_sent', 
        component: 'ChatInterface',
        duration: recordingDuration 
      });
      Alert.alert('Voice Message', `${recordingDuration}s voice message would be sent`);
    }
    
    setRecordingDuration(0);
  }, [isRecording, recordingDuration, haptics, sound, recordingPulse]);

  const cancelRecording = useCallback(() => {
    haptics.trigger('error');
    setIsRecording(false);
    recordingPulse.value = 1;
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setRecordingDuration(0);
    
    log.info('Voice recording cancelled', { event: 'voice_recording_cancel', component: 'ChatInterface' });
  }, [haptics, recordingPulse]);

  // Attachment handlers
  const handleAttachPress = useCallback(() => {
    haptics.trigger('tap');
    setShowAttachMenu(!showAttachMenu);
  }, [haptics, showAttachMenu]);

  const handleAttachImage = useCallback(async () => {
    setShowAttachMenu(false);
    haptics.trigger('tap');
    
    // In production, this would use expo-image-picker
    log.info('Image attachment requested', { event: 'attach_image', component: 'ChatInterface' });
    Alert.alert('Attach Image', 'Image picker would open here');
  }, [haptics]);

  const handleAttachFile = useCallback(async () => {
    setShowAttachMenu(false);
    haptics.trigger('tap');
    
    // In production, this would use expo-document-picker
    log.info('File attachment requested', { event: 'attach_file', component: 'ChatInterface' });
    Alert.alert('Attach File', 'Document picker would open here');
  }, [haptics]);

  const handleShareLocation = useCallback(async () => {
    setShowAttachMenu(false);
    haptics.trigger('tap');
    
    // In production, this would share current location
    log.info('Location share requested', { event: 'share_location', component: 'ChatInterface' });
    Alert.alert('Share Location', 'Your current location would be shared');
  }, [haptics]);

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const recordingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: recordingPulse.value }],
  }));

  const handleKeyPress = useCallback(() => {
    if (Platform.OS === 'web') {
      handleSend();
    }
  }, [handleSend]);

  const handleLongPress = (message: ChatMessage) => {
    Alert.alert(
      'Message Options',
      'What would you like to do with this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Copy', onPress: () => log.info('Copy message', { event: 'copy_message', component: 'chatInterface', messageContent: message.content }) },
        { text: 'Report', onPress: () => log.info('Report message', { event: 'report_message', component: 'chatInterface', messageId: message.id }) },
      ]
    );
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isOwn = item.senderType === 'rider';
    const showTime = index === 0 || 
      new Date(item.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime() > 300000; // 5 minutes

    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 50).duration(300)}
        style={[
          styles.messageContainer,
          isOwn ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {showTime && (
          <Text style={styles.timeStamp}>
            {formatTime(item.timestamp)}
          </Text>
        )}
        
        <Pressable
          style={[
            styles.messageBubble,
            isOwn ? styles.ownBubble : styles.otherBubble,
          ]}
          onLongPress={() => handleLongPress(item)}
        >
          <Text style={[
            styles.messageText,
            isOwn ? styles.ownText : styles.otherText,
          ]}>
            {item.content}
          </Text>
        </Pressable>
        
        {!isOwn && (
          <Text style={styles.senderName}>
            {driverName || 'Driver'}
          </Text>
        )}
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="profile" size={48} color={ds.colors.textSecondary} />
      <Text style={styles.emptyStateText}>Start a conversation</Text>
      <Text style={styles.emptyStateSubtext}>
        Send a message to your driver
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View style={[styles.content, fadeStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={onClose}>
              <Icon name="chevronRight" size={24} color={ds.colors.text} />
            </Pressable>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>
                {driverName || 'Your Driver'}
              </Text>
              {isTyping && (
                <Text style={styles.typingIndicator}>typing...</Text>
              )}
            </View>
            <Pressable style={styles.moreButton}>
              <Icon name="menu" size={24} color={ds.colors.text} />
            </Pressable>
          </View>

          {/* Messages List */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
          />

          {/* Quick Replies */}
          {showQuickReplies && messages.length === 0 && (
            <Animated.View 
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              style={styles.quickRepliesContainer}
            >
              <Text style={styles.quickRepliesLabel}>Quick Replies</Text>
              <View style={styles.quickRepliesRow}>
                {QUICK_REPLIES.slice(0, 3).map((reply, index) => (
                  <Pressable
                    key={index}
                    style={styles.quickReplyChip}
                    onPress={() => handleQuickReply(reply)}
                  >
                    <Text style={styles.quickReplyText}>{reply}</Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Attachment Menu */}
          {showAttachMenu && (
            <Animated.View
              entering={FadeIn.duration(150)}
              exiting={FadeOut.duration(100)}
              style={styles.attachMenu}
            >
              <Pressable style={styles.attachMenuItem} onPress={handleAttachImage}>
                <View style={styles.attachMenuIcon}>
                  <Icon name="profile" size={20} color={ds.colors.primary} />
                </View>
                <Text style={styles.attachMenuText}>Photo</Text>
              </Pressable>
              <Pressable style={styles.attachMenuItem} onPress={handleAttachFile}>
                <View style={styles.attachMenuIcon}>
                  <Icon name="activity" size={20} color={ds.colors.secondary} />
                </View>
                <Text style={styles.attachMenuText}>File</Text>
              </Pressable>
              <Pressable style={styles.attachMenuItem} onPress={handleShareLocation}>
                <View style={styles.attachMenuIcon}>
                  <Icon name="location" size={20} color={ds.colors.warning} />
                </View>
                <Text style={styles.attachMenuText}>Location</Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Input Area */}
          <GlassCard elevated style={styles.inputCard}>
            {isRecording ? (
              /* Voice Recording UI */
              <View style={styles.recordingContainer}>
                <Pressable onPress={cancelRecording} style={styles.cancelRecordButton}>
                  <Icon name="menu" size={20} color={ds.colors.danger} />
                </Pressable>
                
                <View style={styles.recordingInfo}>
                  <Animated.View style={[styles.recordingDot, recordingStyle]} />
                  <Text style={styles.recordingTime}>
                    {formatRecordingTime(recordingDuration)}
                  </Text>
                  <Text style={styles.recordingLabel}>Recording...</Text>
                </View>
                
                <Pressable onPress={stopRecording} style={styles.stopRecordButton}>
                  <Icon name="search" size={24} color={ds.colors.backgroundDeep} />
                </Pressable>
              </View>
            ) : (
              /* Normal Input UI */
              <View style={styles.inputContainer}>
                <Pressable 
                  style={[styles.attachButton, showAttachMenu && styles.attachButtonActive]}
                  onPress={handleAttachPress}
                >
                  <Icon name="location" size={20} color={showAttachMenu ? ds.colors.primary : ds.colors.textSecondary} />
                </Pressable>
                
                <TextInput
                  ref={inputRef}
                  style={styles.textInput}
                  value={inputText}
                  onChangeText={handleInputChange}
                  onSubmitEditing={handleKeyPress}
                  placeholder="Type a message..."
                  placeholderTextColor={ds.colors.textSecondary}
                  multiline
                  maxLength={500}
                />
                
                {inputText.trim() ? (
                  <Pressable
                    style={[styles.sendButton, styles.sendButtonActive]}
                    onPress={handleSend}
                  >
                    <Icon name="search" size={20} color={ds.colors.backgroundDeep} />
                  </Pressable>
                ) : (
                  <Pressable
                    style={styles.voiceButton}
                    onPress={startRecording}
                  >
                    <Icon name="profile" size={20} color={ds.colors.textSecondary} />
                  </Pressable>
                )}
              </View>
            )}
            
            {/* Character count */}
            {inputText.length > 400 && !isRecording && (
              <Text style={styles.characterCount}>
                {inputText.length}/500
              </Text>
            )}
          </GlassCard>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ds.colors.backgroundDeep,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: ds.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.glassBorder,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ds.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
  },
  typingIndicator: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.secondary,
    fontFamily: ds.typography.family,
    marginTop: ds.spacing.xs,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ds.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: ds.spacing.lg,
    gap: ds.spacing.sm,
  },
  messageContainer: {
    marginBottom: ds.spacing.md,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  timeStamp: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
    marginBottom: ds.spacing.xs,
    alignSelf: 'center',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    borderRadius: ds.radius.lg,
  },
  ownBubble: {
    backgroundColor: ds.colors.primary,
  },
  otherBubble: {
    backgroundColor: ds.colors.surface,
    borderWidth: 1,
    borderColor: ds.colors.glassBorder,
  },
  messageText: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    lineHeight: 20,
  },
  ownText: {
    color: ds.colors.backgroundDeep,
  },
  otherText: {
    color: ds.colors.text,
  },
  senderName: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
    marginTop: ds.spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: ds.spacing.xxl,
  },
  emptyStateText: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
    marginTop: ds.spacing.md,
  },
  emptyStateSubtext: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
    marginTop: ds.spacing.xs,
  },
  inputCard: {
    margin: ds.spacing.lg,
    padding: ds.spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: ds.spacing.sm,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ds.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: ds.typography.size.body,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
    backgroundColor: ds.colors.backgroundAlt,
    borderRadius: ds.radius.md,
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: ds.colors.primary,
  },
  sendButtonInactive: {
    backgroundColor: ds.colors.surface,
  },
  characterCount: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
    textAlign: 'right',
    marginTop: ds.spacing.xs,
  },
  // Quick Replies
  quickRepliesContainer: {
    paddingHorizontal: ds.spacing.lg,
    paddingBottom: ds.spacing.md,
  },
  quickRepliesLabel: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
    marginBottom: ds.spacing.sm,
  },
  quickRepliesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.spacing.sm,
  },
  quickReplyChip: {
    paddingVertical: ds.spacing.sm,
    paddingHorizontal: ds.spacing.md,
    backgroundColor: ds.colors.surface,
    borderRadius: ds.radius.lg,
    borderWidth: 1,
    borderColor: ds.colors.glassBorder,
  },
  quickReplyText: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
  },
  // Attachment Menu
  attachMenu: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: ds.spacing.xl,
    paddingVertical: ds.spacing.lg,
    paddingHorizontal: ds.spacing.lg,
    backgroundColor: ds.colors.surface,
    marginHorizontal: ds.spacing.lg,
    marginBottom: ds.spacing.sm,
    borderRadius: ds.radius.lg,
  },
  attachMenuItem: {
    alignItems: 'center',
    gap: ds.spacing.xs,
  },
  attachMenuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ds.colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachMenuText: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
  },
  attachButtonActive: {
    backgroundColor: `${ds.colors.primary}20`,
  },
  // Voice Recording
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: ds.spacing.sm,
  },
  cancelRecordButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${ds.colors.danger}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing.sm,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ds.colors.danger,
  },
  recordingTime: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
  },
  recordingLabel: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
  },
  stopRecordButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ds.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ds.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
