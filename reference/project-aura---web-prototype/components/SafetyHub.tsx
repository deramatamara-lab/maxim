
import React, { useState, useRef } from 'react';
import { GlassView } from './ui/GlassView';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';

interface SafetyHubProps {
    onClose: () => void;
}

export const SafetyHub: React.FC<SafetyHubProps> = ({ onClose }) => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [sosActive, setSosActive] = useState(false);
    const [progress, setProgress] = useState(0);
    const pressTimer = useRef<any>(null);

    const handlePressStart = () => {
        setSosActive(true);
        let p = 0;
        pressTimer.current = setInterval(() => {
            p += 2;
            setProgress(p);
            if (p >= 100) {
                if (pressTimer.current) clearInterval(pressTimer.current);
                triggerSOS();
            }
        }, 20); // 1 second hold
    };

    const handlePressEnd = () => {
        if (pressTimer.current) clearInterval(pressTimer.current);
        setSosActive(false);
        setProgress(0);
    };

    const triggerSOS = () => {
        showToast(t('safety.alert_triggered'), 'error');
        // In a real app, this would block the UI or open a call
        onClose(); 
    };

    return (
        <div className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-[fadeIn_0.2s]">
            <GlassView className="w-full max-w-sm border-aura-danger/30 shadow-[0_0_50px_rgba(255,51,102,0.15)] overflow-hidden">
                <div className="bg-aura-danger/10 p-4 border-b border-aura-danger/20 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-aura-danger font-bold uppercase tracking-widest">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        {t('safety.title')}
                    </div>
                    <button onClick={onClose} className="text-white/50 hover:text-white">✕</button>
                </div>

                <div className="p-8 flex flex-col items-center gap-8">
                    
                    {/* SOS BUTTON */}
                    <div 
                        className="relative group cursor-pointer select-none"
                        onMouseDown={handlePressStart}
                        onMouseUp={handlePressEnd}
                        onMouseLeave={handlePressEnd}
                        onTouchStart={handlePressStart}
                        onTouchEnd={handlePressEnd}
                    >
                        {/* Ripples */}
                        <div className="absolute inset-[-20px] rounded-full border border-aura-danger/30 animate-[ping_2s_linear_infinite]" />
                        <div className="absolute inset-[-40px] rounded-full border border-aura-danger/10 animate-[ping_2s_linear_infinite_1s]" />

                        {/* Progress Ring */}
                        <svg className="absolute inset-[-8px] w-[144px] h-[144px] -rotate-90 pointer-events-none">
                             <circle cx="72" cy="72" r="68" stroke="#331111" strokeWidth="4" fill="transparent" />
                             <circle 
                                cx="72" cy="72" r="68" 
                                stroke="#FF3366" strokeWidth="4" fill="transparent"
                                strokeDasharray={427}
                                strokeDashoffset={427 - (progress / 100) * 427}
                                strokeLinecap="round"
                             />
                        </svg>

                        <button className="w-32 h-32 rounded-full bg-aura-danger text-white font-black text-3xl shadow-[0_0_30px_#FF3366] active:scale-95 transition-transform flex flex-col items-center justify-center z-10 relative">
                            <span>{t('safety.sos')}</span>
                            <span className="text-[9px] font-normal opacity-80 mt-1 uppercase tracking-wide">{t('safety.hold_to_call')}</span>
                        </button>
                    </div>

                    <p className="text-center text-white/50 text-sm">
                        {t('safety.desc')}
                    </p>

                    <div className="w-full h-[1px] bg-white/10" />

                    {/* Secondary Options */}
                    <div className="w-full space-y-3">
                        <button className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center gap-4 transition-colors text-left">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                            </div>
                            <div>
                                <div className="font-bold text-white text-sm">{t('safety.share_status')}</div>
                                <div className="text-[10px] text-white/50">{t('safety.share_desc')}</div>
                            </div>
                        </button>
                        <button className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center gap-4 transition-colors text-left">
                            <div className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            </div>
                            <div>
                                <div className="font-bold text-white text-sm">{t('safety.toolkit')}</div>
                                <div className="text-[10px] text-white/50">{t('safety.toolkit_desc')}</div>
                            </div>
                        </button>
                    </div>

                </div>
            </GlassView>
        </div>
    );
};
