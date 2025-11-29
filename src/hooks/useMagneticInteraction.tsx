import { ViewStyle } from 'react-native';
import { useSharedValue, useAnimatedStyle, withSpring, runOnJS, Animated } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Dimensions, ViewStyle, LayoutRectangle, LayoutChangeEvent } from 'react-native';
import { ds } from '@/constants/theme';

interface MagneticConfig {
  strength?: number;
  radius?: number;
  damping?: number;
  stiffness?: number;
  enableHaptics?: boolean;
  enableSound?: boolean;
}

const DEFAULT_MAGNETIC_CONFIG: Required<Omit<MagneticConfig, 'enableHaptics' | 'enableSound'>> = {
  strength: 0.15,
  radius: 100,
  damping: 25,
  stiffness: 300,
};

export const useMagneticInteraction = (config: MagneticConfig = {}) => {
  const {
    strength = DEFAULT_MAGNETIC_CONFIG.strength,
    radius = DEFAULT_MAGNETIC_CONFIG.radius,
    damping = DEFAULT_MAGNETIC_CONFIG.damping,
    stiffness = DEFAULT_MAGNETIC_CONFIG.stiffness,
    enableHaptics = true,
    enableSound = true,
  } = config;

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  
  const containerRef = useRef<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const calculateMagneticPull = useCallback((touchX: number, touchY: number) => {
    const { x, y, width, height } = containerRef.current;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    
    const distance = Math.sqrt(
      Math.pow(touchX - centerX, 2) + Math.pow(touchY - centerY, 2)
    );

    if (distance < radius) {
      const pullStrength = (1 - distance / radius) * strength;
      const deltaX = (touchX - centerX) * pullStrength;
      const deltaY = (touchY - centerY) * pullStrength;
      
      // Calculate subtle rotation based on position
      const rotationAngle = Math.atan2(deltaY, deltaX) * 0.05;
      
      return {
        x: deltaX,
        y: deltaY,
        scale: 1 + pullStrength * 0.05,
        rotation: rotationAngle,
      };
    }

    return {
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
    };
  }, [radius, strength]);

  const handlePan = useCallback((event: { absoluteX: number; absoluteY: number }) => {
    const { absoluteX, absoluteY } = event;
    const pull = calculateMagneticPull(absoluteX, absoluteY);
    
    translateX.value = withSpring(pull.x, { damping, stiffness });
    translateY.value = withSpring(pull.y, { damping, stiffness });
    scale.value = withSpring(pull.scale, { damping, stiffness });
    rotation.value = withSpring(pull.rotation, { damping: 30, stiffness: 400 });
  }, [calculateMagneticPull, damping, stiffness]);

  const handlePanEnd = useCallback(() => {
    translateX.value = withSpring(0, { damping: 20, stiffness: 400 });
    translateY.value = withSpring(0, { damping: 20, stiffness: 400 });
    scale.value = withSpring(1, { damping: 20, stiffness: 400 });
    rotation.value = withSpring(0, { damping: 30, stiffness: 400 });
  }, []);

  const gesture = Gesture.Pan()
    .onBegin(handlePan)
    .onUpdate(handlePan)
    .onFinalize(handlePanEnd);

  const magneticStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}rad` },
    ],
  }));

  const MagneticWrapper = useCallback(({ children, style, onLayout }: {
    children: React.ReactNode;
    style?: ViewStyle;
    onLayout?: (layout: LayoutRectangle) => void;
  }) => {
    return (
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[magneticStyle, style]}
          onLayout={(e: LayoutChangeEvent) => {
            const { x, y, width, height } = e.nativeEvent.layout;
            containerRef.current = { x, y, width, height };
            onLayout?.(e.nativeEvent.layout);
          }}
        >
          {children}
        </Animated.View>
      </GestureDetector>
    );
  }, [gesture, magneticStyle]);

  return {
    MagneticWrapper,
    magneticStyle,
    reset: () => handlePanEnd(),
  };
};

// Advanced magnetic interaction with proximity glow
export const useAdvancedMagneticInteraction = (config: MagneticConfig & {
  enableGlow?: boolean;
  glowColor?: string;
} = {}) => {
  const {
    enableGlow = true,
    glowColor = ds.colors.primary,
    ...magneticConfig
  } = config;

  const { MagneticWrapper, magneticStyle, reset } = useMagneticInteraction(magneticConfig);
  const glowIntensity = useSharedValue(0);

  const handleAdvancedPan = useCallback((event: { absoluteX: number; absoluteY: number }) => {
    const { absoluteX, absoluteY } = event;
    // Trigger magnetic behavior
    // Calculate proximity for glow
    const intensity = Math.max(0, 1 - Math.abs(absoluteX - Dimensions.get('window').width / 2) / 200);
    glowIntensity.value = withSpring(intensity * 0.3, { damping: 20, stiffness: 300 });
  }, []);

  const handleAdvancedEnd = useCallback(() => {
    glowIntensity.value = withSpring(0, { damping: 20, stiffness: 300 });
    reset();
  }, [reset]);

  const advancedGlowStyle = useAnimatedStyle(() => ({
    shadowColor: glowColor,
    shadowOpacity: enableGlow ? glowIntensity.value : 0,
    shadowRadius: 20 + glowIntensity.value * 30,
    shadowOffset: {
      width: 0,
      height: 0,
    },
  }));

  const AdvancedMagneticWrapper = useCallback(({ children, style, onLayout }: {
    children: React.ReactNode;
    style?: ViewStyle;
    onLayout?: (layout: LayoutRectangle) => void;
  }) => {
    return (
      <GestureDetector gesture={Gesture.Pan()
        .onBegin(handleAdvancedPan)
        .onUpdate(handleAdvancedPan)
        .onFinalize(handleAdvancedEnd)
      }>
        <Animated.View
          style={[magneticStyle, advancedGlowStyle, style]}
          onLayout={(e: LayoutChangeEvent) => {
            onLayout?.(e.nativeEvent.layout);
          }}
        >
          {children}
        </Animated.View>
      </GestureDetector>
    );
  }, [handleAdvancedPan, handleAdvancedEnd, magneticStyle, advancedGlowStyle]);

  return {
    MagneticWrapper: AdvancedMagneticWrapper,
    magneticStyle,
    glowStyle: advancedGlowStyle,
    reset: handleAdvancedEnd,
  };
};

// Hover-like interaction for touch devices
export const useHoverInteraction = (config: {
  hoverScale?: number;
  hoverOpacity?: number;
  duration?: number;
} = {}) => {
  const {
    hoverScale = 1.05,
    hoverOpacity = 0.9,
    duration = ds.motion.duration.fast,
  } = config;

  const isHovered = useSharedValue(0);

  const hoverStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + isHovered.value * (hoverScale - 1) }],
    opacity: 1 - isHovered.value * (1 - hoverOpacity),
  }));

  const gesture = Gesture.LongPress()
    .onBegin(() => {
      isHovered.value = withSpring(1, { damping: 20, stiffness: 300 });
    })
    .onFinalize(() => {
      isHovered.value = withSpring(0, { damping: 20, stiffness: 300 });
    });

  const HoverWrapper = useCallback(({ children, style }: {
    children: React.ReactNode;
    style?: ViewStyle;
  }) => {
    return (
      <GestureDetector gesture={gesture}>
        <Animated.View style={[hoverStyle, style]}>
          {children}
        </Animated.View>
      </GestureDetector>
    );
  }, [gesture, hoverStyle]);

  return {
    HoverWrapper,
    hoverStyle,
  };
};
