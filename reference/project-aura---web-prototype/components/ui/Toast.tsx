
import React, { useEffect, useState } from 'react';
import { GlassView } from './GlassView';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type: ToastType;
    duration?: number;
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, duration = 3000, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for exit animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        success: (
            <div className="w-6 h-6 rounded-full bg-aura-success/20 flex items-center justify-center border border-aura-success/50 text-aura-success">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
        ),
        error: (
            <div className="w-6 h-6 rounded-full bg-aura-danger/20 flex items-center justify-center border border-aura-danger/50 text-aura-danger">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
        ),
        info: (
            <div className="w-6 h-6 rounded-full bg-aura-primary/20 flex items-center justify-center border border-aura-primary/50 text-aura-primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </div>
        )
    };

    return (
        <div 
            className={`
                fixed top-6 left-1/2 -translate-x-1/2 z-[200]
                transition-all duration-300 ease-out
                ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'}
            `}
        >
            <GlassView className="px-6 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] border-white/10 !rounded-full flex items-center gap-3 min-w-[300px]">
                {icons[type]}
                <span className="text-sm font-medium text-white tracking-wide">{message}</span>
            </GlassView>
        </div>
    );
};
