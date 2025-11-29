
import React, { useState, useEffect } from 'react';
import { GlassView } from './ui/GlassView';
import { NeonButton } from './ui/NeonButton';
import { MapHUD } from './MapHUD';
import { DriverPhase } from '../types';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';

// --- SUB-COMPONENT: Tactile Swipe Slider ---
const SwipeSlider: React.FC<{ onConfirm: () => void; label: string; color?: string }> = ({ onConfirm, label, color = "bg-aura-primary" }) => {
    const [val, setVal] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setVal(Number(e.target.value));
        setIsDragging(true);
    };
    
    const handleEnd = () => {
        setIsDragging(false);
        if(val > 90) { 
            setVal(100);
            onConfirm();
        } else {
            // Snap back
            setVal(0); 
        }
    };

    // Visual calculations
    const glowOpacity = Math.max(0.2, val / 100);
    const scaleThumb = 1 + (val / 100) * 0.1; // Slight scale up as you drag
    const dynamicShadow = `0 0 ${20 + (val/2)}px ${color === 'bg-aura-primary' ? '#00F5FF' : '#00FFB3'}`;

    return (
        <div className="relative w-full h-16 bg-[#111] rounded-full border border-white/10 overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] group">
            {/* Track Pattern */}
            <div className="absolute inset-0 opacity-10" 
                 style={{ backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 10px, #fff 10px, #fff 11px)' }} 
            />

            {/* Label (Fades out) */}
            <div 
                className="absolute inset-0 flex items-center justify-center text-xs font-bold tracking-[0.2em] text-white/40 pointer-events-none uppercase transition-all duration-300" 
                style={{ opacity: Math.max(0, 1 - (val / 50)), transform: `scale(${1 - (val/200)})` }}
            >
                {label}
            </div>
            
            {/* Progress Fill */}
            <div 
                className={`absolute top-0 bottom-0 left-0 ${color} transition-all duration-100 ease-out`} 
                style={{ 
                    width: `${val}%`,
                    opacity: 0.2 + (val/150)
                }} 
            />
            
            {/* Interaction Input */}
            <input 
                type="range" min="0" max="100" value={val} 
                onChange={handleChange} 
                onTouchEnd={handleEnd}
                onMouseUp={handleEnd}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 touch-none"
            />
            
            {/* Draggable Thumb */}
            <div 
                className={`
                    absolute top-1 bottom-1 w-14 rounded-full bg-white 
                    flex items-center justify-center pointer-events-none 
                    transition-all duration-100 ease-out z-10
                `} 
                style={{ 
                    left: `calc(${val}% - ${val/100 * 56}px)`,
                    boxShadow: dynamicShadow,
                    transform: `scale(${scaleThumb})`
                }}
            >
                {val >= 90 ? (
                    <div className="animate-scale">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" className="opacity-80"><path d="M9 18l6-6-6-6"/></svg>
                )}
            </div>
        </div>
    );
};

export const DriverApp: React.FC = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [phase, setPhase] = useState<DriverPhase>('offline');
    const [earnings, setEarnings] = useState(142.50);
    const [requestCountdown, setRequestCountdown] = useState(10);
    const [showHeatmap, setShowHeatmap] = useState(true);

    const isMoving = phase === 'pickup' || phase === 'trip';

    // Incoming Request Simulation
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (phase === 'online') {
            const delay = Math.random() * 4000 + 1500;
            timer = setTimeout(() => {
                setPhase('incoming');
                setRequestCountdown(10);
            }, delay);
        }
        return () => clearTimeout(timer);
    }, [phase]);

    // Countdown Logic
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (phase === 'incoming') {
            interval = setInterval(() => {
                setRequestCountdown((prev) => {
                    if (prev <= 0) {
                        setPhase('online');
                        return 0;
                    }
                    return prev - 0.1;
                });
            }, 100);
        }
        return () => clearInterval(interval);
    }, [phase]);

    const handleGoOnline = () => {
        setPhase('online');
        showToast(t('driver.online'), 'success');
    };

    const handleAccept = () => {
        setPhase('pickup');
    };

    const handleArrived = () => {
        setPhase('trip');
        showToast(t('active_ride.confirmed'), 'info');
    };

    const handleComplete = () => {
        setPhase('complete');
        setEarnings(prev => prev + 35.50);
        setTimeout(() => {
            setPhase('online');
            showToast(t('receipt.payment_confirmed'), 'success');
        }, 3000);
    };

    const handleGoOffline = () => {
        setPhase('offline');
        showToast(t('driver.offline'), 'info');
    };

    // SVG Math for Circular Progress
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    const progress = (requestCountdown / 10) * circumference;

    return (
        <div className="relative w-full h-screen bg-[#050607] overflow-hidden flex flex-col font-sans select-none text-white">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <MapHUD variant="driver" isMoving={isMoving} />
            </div>

            {/* --- TOP HUD --- */}
            
            {/* Navigation Instruction (Active) */}
            {isMoving && (
                <div className="absolute top-0 left-0 right-0 z-30 p-4 animate-[slideDown_0.4s_cubic-bezier(0.16,1,0.3,1)]">
                    <GlassView className="p-5 flex items-center justify-between shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] !border-aura-primary/40 !bg-[#111]/90">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-[#111] rounded-xl flex items-center justify-center border border-aura-primary shadow-[0_0_25px_rgba(0,245,255,0.15)] relative overflow-hidden">
                                <div className="absolute inset-0 bg-aura-primary/10 animate-pulse" />
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00F5FF" strokeWidth="3" className="rotate-45 relative z-10"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-white tracking-tighter leading-none mb-1">{t('driver.turn_right')}</div>
                                <div className="text-sm text-aura-primary font-mono tracking-wide">300 ft • Wilshire Blvd</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-white leading-none">12 <span className="text-sm font-normal text-gray-400">{t('common.min')}</span></div>
                            <div className="text-sm text-gray-400 font-mono mt-1">4.2 {t('common.mi')}</div>
                        </div>
                    </GlassView>
                </div>
            )}

            {/* Offline/Online Stats Header */}
            {!isMoving && (
                <div className="relative z-10 p-6 flex justify-between items-start pointer-events-none">
                    <GlassView className="pointer-events-auto px-5 py-3 flex items-center gap-4 border-l-4 border-l-aura-primary shadow-2xl">
                        <div className="flex flex-col">
                            <div className="text-[10px] text-aura-textSecondary uppercase tracking-widest font-bold">{t('driver.earnings')}</div>
                            <div className="text-2xl font-bold text-white tracking-tight">${earnings.toFixed(2)}</div>
                        </div>
                        <div className="h-8 w-[1px] bg-white/10" />
                        <div className="text-aura-success text-xs font-bold flex items-center gap-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="18 15 12 9 6 15"/></svg>
                            12%
                        </div>
                    </GlassView>

                    <div className="pointer-events-auto flex items-center gap-3">
                         <button 
                            onClick={() => setShowHeatmap(!showHeatmap)}
                            className={`w-12 h-12 rounded-full flex items-center justify-center border backdrop-blur-md transition-all active:scale-95 ${showHeatmap ? 'bg-white/10 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'bg-black/60 border-white/5 text-white/30'}`}
                         >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6v6l4 2"/></svg>
                        </button>
                        <button 
                            onClick={() => phase !== 'offline' && handleGoOffline()}
                            className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300 ${phase === 'offline' ? 'bg-red-500/10 border-red-500/20 text-red-500 opacity-0' : 'bg-aura-success/20 border-aura-success/50 text-aura-success shadow-[0_0_20px_rgba(0,255,179,0.3)]'}`}
                        >
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
                        </button>
                    </div>
                </div>
            )}

            {/* --- BOTTOM INTERACTION LAYER --- */}
            <div className="flex-1 flex flex-col justify-end p-6 z-20 pb-12">
                
                {/* 1. OFFLINE - Turbine Button */}
                {phase === 'offline' && (
                    <div className="flex justify-center items-center h-full animate-[fadeIn_0.5s]">
                        <div className="relative group cursor-pointer select-none" onClick={handleGoOnline}>
                            {/* Spinning Rings */}
                            <div className="absolute inset-[-60px] border border-white/5 rounded-full animate-[spin_12s_linear_infinite]" />
                            <div className="absolute inset-[-30px] border border-aura-primary/10 rounded-full animate-[spin_6s_linear_infinite_reverse]" />
                            
                            {/* Hover Glow */}
                            <div className="absolute inset-0 bg-aura-primary/20 rounded-full blur-3xl group-hover:bg-aura-primary/40 transition-all duration-500 opacity-0 group-hover:opacity-100" />
                            
                            <button className="relative w-36 h-36 rounded-full bg-[#0A0A0A] border-2 border-aura-primary flex flex-col items-center justify-center shadow-[0_0_50px_rgba(0,245,255,0.15)] group-hover:scale-105 transition-transform duration-300 overflow-hidden active:scale-95 active:shadow-[0_0_80px_rgba(0,245,255,0.4)]">
                                <div className="absolute inset-0 bg-gradient-to-t from-aura-primary/20 via-transparent to-transparent opacity-60" />
                                <span className="text-3xl font-black text-white tracking-widest relative z-10 drop-shadow-lg">{t('driver.go_online')}</span>
                                <span className="text-[10px] text-aura-primary uppercase tracking-[0.3em] mt-1 relative z-10 font-bold">{t('driver.online')}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* 2. ONLINE - Radar Scan */}
                {phase === 'online' && (
                    <GlassView className="p-6 text-center animate-[slideUp_0.4s] border-t-2 border-t-aura-primary/50 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-aura-primary/5 to-transparent animate-pulse" />
                        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-64 h-64 border border-aura-primary/20 rounded-full animate-ping" />
                        
                        <div className="relative z-10">
                            <div className="text-2xl font-semibold text-white mb-1">{t('driver.finding_trips')}</div>
                            <div className="text-sm text-aura-textSecondary mb-8">{t('driver.high_demand')}</div>
                            
                            {/* Loader */}
                            <div className="flex justify-center mb-8 gap-2">
                                <div className="w-2 h-2 rounded-full bg-aura-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 rounded-full bg-aura-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 rounded-full bg-aura-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>

                            <button onClick={handleGoOffline} className="w-full py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors text-xs font-bold tracking-widest uppercase">
                                {t('driver.stop_requests')}
                            </button>
                        </div>
                    </GlassView>
                )}

                {/* 3. INCOMING REQUEST - Urgent Modal */}
                {phase === 'incoming' && (
                    <div className="animate-[slideUp_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)] relative z-50">
                        <GlassView className="p-0 overflow-hidden border-2 border-aura-primary shadow-[0_0_100px_rgba(0,245,255,0.25)]">
                            {/* Urgent Header */}
                            <div className="relative h-40 bg-[#080808] flex items-center justify-between px-6 border-b border-white/10 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-aura-primary/20 via-black to-black animate-[shimmer_2s_infinite]" />
                                
                                <div className="relative z-10">
                                    <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-aura-primary text-black text-[10px] font-black uppercase tracking-wider mb-2 shadow-[0_0_10px_#00F5FF]">
                                        <span className="text-xs">⚡</span> Aura Black
                                    </div>
                                    <h2 className="text-5xl font-black text-white tracking-tight">$35.50</h2>
                                </div>

                                {/* Countdown Circle */}
                                <div className="relative w-24 h-24 flex items-center justify-center z-10">
                                    <svg className="w-full h-full -rotate-90 transform drop-shadow-[0_0_10px_rgba(0,245,255,0.5)]">
                                        <circle cx="48" cy="48" r={radius} stroke="#222" strokeWidth="6" fill="transparent" />
                                        <circle 
                                            cx="48" cy="48" r={radius} 
                                            stroke="#00F5FF" strokeWidth="6" fill="transparent" 
                                            strokeDasharray={circumference} 
                                            strokeDashoffset={circumference - progress}
                                            strokeLinecap="round"
                                            className="transition-all duration-100 ease-linear"
                                        />
                                    </svg>
                                    <span className={`absolute text-2xl font-bold ${requestCountdown < 3 ? 'text-aura-danger animate-pulse' : 'text-white'}`}>
                                        {Math.ceil(requestCountdown)}
                                    </span>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="p-6 bg-[#111]">
                                <div className="flex gap-5 mb-8">
                                    <div className="flex flex-col items-center pt-2">
                                        <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_10px_white]" />
                                        <div className="w-0.5 h-12 bg-gradient-to-b from-white to-aura-primary/50 my-1" />
                                        <div className="w-3 h-3 rounded-full bg-aura-primary shadow-[0_0_10px_#00F5FF]" />
                                    </div>
                                    <div className="flex-1 space-y-6">
                                        <div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{t('driver.pickup')} • 4 min</div>
                                            <div className="text-white font-bold text-xl">SoHo House</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{t('driver.dropoff')} • 12 mi</div>
                                            <div className="text-white font-bold text-xl">LAX Terminal 4</div>
                                        </div>
                                    </div>
                                    <div className="text-right pt-2">
                                        <div className="text-2xl font-bold text-white">4.9 ★</div>
                                        <div className="text-xs text-gray-400 font-medium">Alex V.</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <button 
                                        onClick={() => setPhase('online')}
                                        className="col-span-1 h-14 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-colors active:scale-95"
                                    >
                                        {t('driver.decline')}
                                    </button>
                                    <div className="col-span-2">
                                         <NeonButton 
                                            label={t('driver.accept')}
                                            fullWidth
                                            onClick={handleAccept}
                                            className="h-14 !text-lg shadow-[0_0_30px_rgba(0,245,255,0.3)]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </GlassView>
                    </div>
                )}

                {/* 4. ACTIVE TRIP - Pickup / Dropoff Swipes */}
                {isMoving && (
                    <GlassView className="p-0 overflow-hidden animate-[slideUp_0.3s] border-t border-white/20">
                        {/* Passenger Header */}
                        <div className="p-5 bg-white/5 flex items-center justify-between border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border border-white/20 font-bold text-white shadow-lg text-lg">
                                    AV
                                </div>
                                <div>
                                    <div className="text-base font-bold text-white">Alex V.</div>
                                    <div className="text-xs font-bold text-aura-primary tracking-wide uppercase">Gold Member</div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/10">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                </button>
                                <button className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/10">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            {phase === 'pickup' ? (
                                <>
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.4)]">1</div>
                                        <div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Next Stop</div>
                                            <div className="text-2xl font-bold text-white">SoHo House</div>
                                        </div>
                                    </div>
                                    <SwipeSlider label={t('driver.slide_arrive')} onConfirm={handleArrived} color="bg-aura-primary" />
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-10 h-10 rounded-full bg-aura-primary text-black flex items-center justify-center font-bold text-lg shadow-[0_0_20px_rgba(0,245,255,0.4)]">2</div>
                                        <div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dropoff</div>
                                            <div className="text-2xl font-bold text-white">LAX Terminal 4</div>
                                        </div>
                                    </div>
                                    <SwipeSlider label={t('driver.slide_complete')} onConfirm={handleComplete} color="bg-aura-success" />
                                </>
                            )}
                        </div>
                    </GlassView>
                )}

                {/* 5. COMPLETE - Success Celebration */}
                {phase === 'complete' && (
                    <div className="animate-[zoomIn_0.4s_cubic-bezier(0.34,1.56,0.64,1)]">
                        <GlassView className="p-8 text-center flex flex-col items-center justify-center h-80 border-2 border-aura-success/30 shadow-[0_0_100px_rgba(0,255,179,0.15)]">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-aura-success/30 blur-xl rounded-full" />
                                <div className="w-28 h-28 rounded-full bg-aura-success/10 flex items-center justify-center border-2 border-aura-success relative z-10">
                                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#00FFB3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-[check_0.6s_ease-out]"><polyline points="20 6 9 17 4 12"/></svg>
                                </div>
                            </div>
                            <h2 className="text-6xl font-black text-white mb-3 tracking-tighter">$35.50</h2>
                            <div className="inline-block px-3 py-1 rounded-full bg-aura-success/10 text-aura-success font-bold tracking-widest uppercase text-xs border border-aura-success/20">
                                {t('receipt.payment_confirmed')}
                            </div>
                        </GlassView>
                    </div>
                )}
            </div>
        </div>
    );
};
