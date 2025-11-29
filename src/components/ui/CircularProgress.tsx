import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { ds } from '@/constants/theme';

interface CircularProgressProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0 to 1
  color?: string;
  backgroundColor?: string;
  duration?: number;
  onComplete?: () => void;
  children?: React.ReactNode;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  size = 120,
  strokeWidth = 8,
  progress,
  color = ds.colors.primary,
  backgroundColor = ds.colors.surfaceElevated,
  duration = 1000,
  onComplete,
  children,
}) => {
  const animatedProgress = useSharedValue(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration,
      easing: Easing.linear,
    }, (finished) => {
      if (finished && progress === 1 && onComplete) {
        runOnJS(onComplete)();
      }
    });
  }, [progress, duration, onComplete, animatedProgress]);

  const animatedProps = useAnimatedProps(() => {
    const currentProgress = animatedProgress.value;
    const offset = circumference - (circumference * currentProgress);
    
    return {
      strokeDashoffset: offset,
    };
  });

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
        
        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
          strokeDasharray={circumference}
          animatedProps={animatedProps}
        />
      </Svg>
      
      {/* Children in center */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </View>
    </View>
  );
};

// Animated Circle component
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default CircularProgress;
