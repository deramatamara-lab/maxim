
import React, { useState } from 'react';

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost';
  fullWidth?: boolean;
  label: string;
  icon?: React.ReactNode;
}

export const NeonButton: React.FC<NeonButtonProps> = ({ 
  variant = 'primary', 
  fullWidth = false, 
  label, 
  icon,
  className = '',
  ...props 
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const baseStyles = "relative overflow-hidden font-medium transition-all duration-300 flex items-center justify-center gap-2 group isolate";
  const widthStyles = fullWidth ? "w-full" : "w-auto px-8";
  const sizeStyles = "h-14 rounded-xl";
  
  const variants = {
    primary: `
      bg-gradient-to-r from-aura-primary to-aura-primaryAccent 
      text-black
      shadow-[0_0_25px_rgba(0,245,255,0.35)]
      hover:shadow-[0_0_50px_rgba(0,245,255,0.6)]
      border border-transparent
    `,
    danger: `
      bg-aura-danger/10 border border-aura-danger/50 text-aura-danger
      hover:bg-aura-danger/20 hover:shadow-[0_0_25px_rgba(255,51,102,0.4)]
    `,
    ghost: `
      bg-white/5 border border-white/10 text-white
      hover:bg-white/10 hover:border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]
    `
  };

  return (
    <button
      className={`
        ${baseStyles}
        ${widthStyles}
        ${sizeStyles}
        ${variants[variant]}
        ${isPressed ? 'scale-[0.98]' : 'scale-100'}
        ${className}
      `}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      {...props}
    >
      {/* Holographic Sweep Effect */}
      <div className="absolute inset-0 -translate-x-[150%] group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/80 to-transparent skew-x-12 pointer-events-none z-20" />
      
      {/* Tech Scanline Overlay for Primary */}
      {variant === 'primary' && (
          <>
            <div className="absolute inset-0 opacity-20 pointer-events-none z-10" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)' }} />
            {/* Edge Highlights */}
            <div className="absolute inset-0 border border-white/20 rounded-xl pointer-events-none z-30" />
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white/80 rounded-tl-lg pointer-events-none z-30" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white/80 rounded-br-lg pointer-events-none z-30" />
          </>
      )}
      
      {/* Inner Glow Border */}
      <div className="absolute inset-0 rounded-xl shadow-[inset_0_0_15px_rgba(255,255,255,0.3)] pointer-events-none z-10" />

      <span className="relative z-20 font-bold tracking-wider uppercase text-sm flex items-center gap-2 drop-shadow-sm">
          {label}
      </span>
      {icon && <span className="relative z-20 drop-shadow-sm">{icon}</span>}
    </button>
  );
};
