
import React from 'react';
import { ds } from '../../constants';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  variant = 'rectangular', 
  width, 
  height 
}) => {
  const baseStyles = "relative overflow-hidden bg-white/5";
  
  const variantStyles = {
    text: 'rounded-md',
    rectangular: 'rounded-xl',
    circular: 'rounded-full',
  };

  const style = {
    width: width ?? (variant === 'text' ? '100%' : undefined),
    height: height ?? (variant === 'text' ? '1em' : undefined),
  };

  return (
    <div 
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={style}
    >
      {/* Shimmer Gradient */}
      <div 
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
        }}
      />
    </div>
  );
};
