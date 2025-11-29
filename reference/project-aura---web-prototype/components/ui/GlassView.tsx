import React from 'react';
import { ds } from '../../constants';

interface GlassViewProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
  border?: boolean;
}

export const GlassView: React.FC<GlassViewProps> = ({ 
  children, 
  className = '', 
  intensity = 'medium',
  border = true
}) => {
  const bgOpacity = intensity === 'high' ? 'bg-[#161616]/95' : intensity === 'medium' ? 'bg-[#161616]/80' : 'bg-[#161616]/60';
  const borderClass = border ? 'border border-white/10' : '';
  
  return (
    <div 
      className={`
        backdrop-blur-xl 
        ${bgOpacity} 
        ${borderClass} 
        shadow-2xl
        relative
        overflow-hidden
        ${className}
      `}
      style={{
        borderRadius: ds.radius.xl
      }}
    >
      {/* Noise Texture Overlay Simulation */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
      />
      
      {/* Subtle Inner Glow */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] rounded-[inherit]" />

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};