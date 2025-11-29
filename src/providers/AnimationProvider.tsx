import React, { createContext, useContext, useCallback, useState, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import { runOnUI } from 'react-native-reanimated';

import { ds } from '../constants/theme';
import { useHaptics } from '../hooks/useHaptics';
import { useSound } from '../hooks/useSound';
import { useReducedMotion } from '../hooks/useReducedMotion';

// Platform detection
const isAndroid = Platform.OS === 'android';

// Platform-specific optimizations function
const getPlatformOptimizations = () => {
  return {
    useNativeDriver: ds.motion.performance.useNativeDriver,
    maxConcurrentAnimations: isAndroid ? 
      ds.motion.performance.android.maxConcurrentAnimations :
      ds.motion.performance.ios.maxConcurrentAnimations,
    enableHardwareAcceleration: isAndroid ? 
      ds.motion.performance.android.enableHardwareAcceleration :
      ds.motion.performance.ios.enableHardwareAcceleration,
  };
};

// Animation context types
interface AnimationContextType {
  // Global animation controls
  isAnimating: boolean;
  currentAnimation: string | null;
  
  // Orchestrated animations
  orchestratePageTransition: (from: string, to: string) => Promise<void>;
  orchestrateModalAnimation: (isOpen: boolean, modalName: string) => void;
  orchestrateTabSwitch: (fromTab: string, toTab: string) => void;
  
  // Performance controls
  reduceMotion: boolean;
  setReduceMotion: (enabled: boolean) => void;
  
  // Animation utilities
  triggerHaptic: (type: 'tap' | 'selection' | 'confirm' | 'error') => void;
  playSound: (type: 'tapSoft' | 'success' | 'warning') => void;
  
  // Performance monitoring
  animationQueue: string[];
  clearQueue: () => void;
}

const AnimationContext = createContext<AnimationContextType | null>(null);

// Animation Provider Component
export const AnimationProvider: React.FC<{
  children: React.ReactNode;
  enablePerformanceMonitoring?: boolean;
}> = ({ 
  children, 
  enablePerformanceMonitoring = true 
}) => {
  const { trigger } = useHaptics();
  const { play } = useSound();
  
  // Global state
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<string | null>(null);
  const [animationQueue, setAnimationQueue] = useState<string[]>([]);
  
  // Use system-aware reduced motion hook
  const { 
    isReducedMotion, 
    setReducedMotion: setReducedMotionPreference,
    getAnimationDuration: _getAnimationDuration,
    getAnimationConfig: _getAnimationConfig,
  } = useReducedMotion();
  
  // Expose reduceMotion for backward compatibility
  const reduceMotion = isReducedMotion;
  const setReduceMotion = setReducedMotionPreference;
  
  // Performance monitoring
  const performanceMetricsRef = useRef({
    totalAnimations: 0,
    averageDuration: 0,
    droppedFrames: 0,
  });

  // Orchestrated page transition animation
  const orchestratePageTransition = useCallback(async (from: string, to: string) => {
    if (isAnimating || reduceMotion) return;
    
    setIsAnimating(true);
    const animationName = `pageTransition_${from}_to_${to}`;
    setCurrentAnimation(animationName);
    
    // Add to queue for monitoring
    setAnimationQueue(prev => [...prev, animationName]);
    
    // Trigger haptic and sound feedback
    trigger('tap');
    play('tapSoft');
    
    // Platform-specific transition timing
    const transitionDuration = isAndroid ? 300 : 350;
    
    await new Promise(resolve => {
      runOnUI(() => {
        // Page transition logic would be implemented here
        // This would coordinate with the actual page components
        setTimeout(resolve, transitionDuration);
      })();
    });
    
    setIsAnimating(false);
    setCurrentAnimation(null);
    
    if (enablePerformanceMonitoring) {
      performanceMetricsRef.current.totalAnimations++;
    }
  }, [trigger, play, enablePerformanceMonitoring, isAnimating, reduceMotion]);

  // Orchestrated modal animation
  const orchestrateModalAnimation = useCallback((
    isOpen: boolean, 
    modalName: string
  ) => {
    if (reduceMotion) return;
    
    const animationType = isOpen ? 'modalOpen' : 'modalClose';
    const animationName = `${animationType}_${modalName}`;
    setCurrentAnimation(animationName);
    
    // Trigger appropriate feedback
    if (isOpen) {
      trigger('selection');
      play('success');
    } else {
      trigger('tap');
      play('tapSoft');
    }
    
    // Add to queue
    setAnimationQueue(prev => [...prev, animationName]);
    
    runOnUI(() => {
      // Modal animation logic would be implemented here
      // This would coordinate with modal components
      setTimeout(() => {
        setCurrentAnimation(null);
      }, isOpen ? 320 : 220);
    })();
  }, [trigger, play, reduceMotion]);

  // Orchestrated tab switch animation
  const orchestrateTabSwitch = useCallback((fromTab: string, toTab: string) => {
    if (reduceMotion) return;
    
    const animationName = `tabSwitch_${fromTab}_to_${toTab}`;
    setCurrentAnimation(animationName);
    
    // Trigger feedback
    trigger('tap');
    play('tapSoft');
    
    // Add to queue
    setAnimationQueue(prev => [...prev, animationName]);
    
    runOnUI(() => {
      // Tab switch animation logic
      setTimeout(() => {
        setCurrentAnimation(null);
      }, 280);
    })();
  }, [trigger, play, reduceMotion]);

  // Haptic feedback wrapper
  const triggerHaptic = useCallback((type: 'tap' | 'selection' | 'confirm' | 'error') => {
    if (ds.motion.performance.enableHaptics) {
      trigger(type);
    }
  }, [trigger]);

  // Sound feedback wrapper
  const playSound = useCallback((type: 'tapSoft' | 'success' | 'warning') => {
    if (ds.motion.performance.enableSound) {
      play(type);
    }
  }, [play]);

  // Reduce motion setter
  const handleSetReduceMotion = useCallback((enabled: boolean) => {
    setReduceMotion(enabled);
  }, [setReduceMotion]);

  // Clear animation queue
  const clearQueue = useCallback(() => {
    setAnimationQueue([]);
  }, []);

  // Context value
  const contextValue: AnimationContextType = {
    isAnimating,
    currentAnimation,
    orchestratePageTransition,
    orchestrateModalAnimation,
    orchestrateTabSwitch,
    reduceMotion,
    setReduceMotion: handleSetReduceMotion,
    triggerHaptic,
    playSound,
    animationQueue,
    clearQueue,
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsAnimating(false);
      setCurrentAnimation(null);
      setAnimationQueue([]);
    };
  }, []);

  return (
    <AnimationContext.Provider value={contextValue}>
      {children}
    </AnimationContext.Provider>
  );
};

// Hook to use animation context
export const useAnimationContext = () => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimationContext must be used within an AnimationProvider');
  }
  return context;
};

// Animation utility functions
export const AnimationUtils = {
  // Get platform-specific animation config
  getPlatformConfig: getPlatformOptimizations,
  
  // Check if device can handle complex animations
  canHandleComplexAnimations: () => {
    // Simple heuristic based on platform and performance settings
    return !ds.motion.performance.reduceMotion && 
           ds.motion.performance.useNativeDriver;
  },
  
  // Get optimal animation config based on device performance
  getOptimalConfig: (complexity: 'low' | 'medium' | 'high') => {
    const platform = isAndroid ? 'android' : 'ios';
    const baseConfig = ds.motion.performance[platform];
    
    switch (complexity) {
      case 'low':
        return {
          ...baseConfig,
          maxConcurrentAnimations: Math.floor(baseConfig.maxConcurrentAnimations * 0.5),
        };
      case 'medium':
        return baseConfig;
      case 'high':
        return {
          ...baseConfig,
          maxConcurrentAnimations: Math.floor(baseConfig.maxConcurrentAnimations * 1.5),
        };
      default:
        return baseConfig;
    }
  },
  
  // Debounce animation calls for performance
  debounceAnimation: (callback: (...args: unknown[]) => void, delay: number = 16) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: unknown[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callback.apply(null, args), delay);
    };
  },
  
  // Throttle animation calls for smooth performance
  throttleAnimation: (callback: (...args: unknown[]) => void, limit: number = 16) => {
    let inThrottle: boolean;
    return (...args: unknown[]) => {
      if (!inThrottle) {
        callback.apply(null, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
};

export default AnimationProvider;
