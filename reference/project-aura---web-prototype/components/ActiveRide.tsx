import React, { useEffect, useState, useMemo, useRef } from 'react';
import { GlassView } from './ui/GlassView';
import { RideOption, RideStatus, Driver, PaymentMethod, Coordinates } from '../types';
import { MockRideSocket, RideUpdate } from '../services/mockSocket';
import { DriverChat } from './DriverChat';
import { RideReceipt } from './RideReceipt';
import { SafetyHub } from './SafetyHub';
import { NeonButton } from './ui/NeonButton';
import { useTranslation } from 'react-i18next';

interface ActiveRideProps {
    ride: RideOption;
    paymentMethod: PaymentMethod;
    onCancel: () => void;
    onDriverUpdate?: (location: Coordinates) => void;
}

const MOCK_DRIVER: Driver = {
    id: 'd-123',
    name: 'Marcus Chen',
    rating: 4.98,
    carModel: 'Tesla Model S Plaid',
    carPlate: '8X2-99L',
    stats: {
        rides: 3482,
        yearsDriving: 5,
        languages: ['English', 'Mandarin'],
        compliments: ['Smooth Drive', 'Immaculate Car']
    }
};

type CancelPhase = 'none' | 'warning' | 'countdown';

export const ActiveRide: React.FC<ActiveRideProps> = ({ ride, paymentMethod, onCancel, onDriverUpdate }) => {
    const { t } = useTranslation();
    const [status, setStatus] = useState<RideStatus>('searching');
    const [eta, setEta] = useState<number | null>(null);
    const [showChat, setShowChat] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [showSafety, setShowSafety] = useState(false);
    
    // Cancellation State
    const [cancelPhase, setCancelPhase] = useState<CancelPhase>('none');
    const [cancelCountdown, setCancelCountdown] = useState(5);
    const cancelTimerRef = useRef<number | null>(null);
    
    // Free Cancellation Timer
    const [secondsToCancel, setSecondsToCancel] = useState(120); // 2 minutes
    const [hasFreeCancelExpired, setHasFreeCancelExpired] = useState(false);

    // Edge Case State
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [driverCancelled, setDriverCancelled] = useState(false);

    // Initialize Socket
    useEffect(() => {
        const socket = new MockRideSocket();
        
        // Small delay to simulate connection handshake
        const connectTimer = window.setTimeout(() => {
            socket.connect((update: RideUpdate) => {
                // Simulate random network glitch (Edge Case)
                if (Math.random() > 0.995) {
                    setIsReconnecting(true);
                    setTimeout(() => setIsReconnecting(false), 3000);
                    return; // Skip update while "reconnecting"
                }

                if (update.status === 'cancelled') {
                    setDriverCancelled(true);
                    return;
                }

                setStatus(update.status);
                
                if (update.eta !== undefined) {
                    setEta(update.eta);
                }

                if (update.location && onDriverUpdate) {
                    onDriverUpdate(update.location);
                }
                
                if (update.status === 'completed') {
                    setShowReceipt(true);
                }
            });
        }, 2000); // Longer search sim for effect

        return () => {
            window.clearTimeout(connectTimer);
            socket.disconnect();
        };
    }, [onDriverUpdate]);

    // Free Cancellation Timer Logic
    useEffect(() => {
        if (status === 'confirmed' || status === 'arriving') {
            const timer = window.setInterval(() => {
                setSecondsToCancel(prev => {
                    if (prev <= 1) {
                        setHasFreeCancelExpired(true);
                        window.clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => window.clearInterval(timer);
        }
    }, [status]);

    // Format timer mm:ss
    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // Handle Cancellation Countdown (Confirmation Step)
    useEffect(() => {
        if (cancelPhase === 'countdown') {
            cancelTimerRef.current = window.setInterval(() => {
                setCancelCountdown((prev) => {
                    if (prev <= 1) {
                        if (cancelTimerRef.current !== null) window.clearInterval(cancelTimerRef.current);
                        onCancel(); // Finalize cancellation
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (cancelTimerRef.current !== null) window.clearInterval(cancelTimerRef.current);
            setCancelCountdown(5); // Reset
        }
        return () => {
            if (cancelTimerRef.current !== null) window.clearInterval(cancelTimerRef.current);
        };
    }, [cancelPhase, onCancel]);

    const statusConfig = useMemo(() => {
        if (isReconnecting) return { text: t('active_ride.reconnecting'), color: 'text-aura-danger', barColor: 'bg-aura-danger', glow: 'animate-pulse' };
        
        switch (status) {
            case 'searching': return { text: t('active_ride.connecting'), color: 'text-aura-primary', barColor: 'bg-aura-primary', glow: 'shadow-[0_0_15px_#00F5FF]' };
            case 'confirmed': return { text: t('active_ride.confirmed'), color: 'text-aura-success', barColor: 'bg-aura-success', glow: 'shadow-[0_0_15px_#00FFB3]' };
            case 'arriving': return { text: t('active_ride.arriving'), color: 'text-aura-primaryAccent', barColor: 'bg-aura-primaryAccent', glow: 'shadow-[0_0_20px_#19FBFF]' };
            case 'in_progress': return { text: t('active_ride.en_route'), color: 'text-blue-400', barColor: 'bg-blue-400', glow: 'shadow-[0_0_15px_#60A5FA]' };
            case 'completed': return { text: t('active_ride.completed'), color: 'text-white', barColor: 'bg-white', glow: 'shadow-[0_0_15px_white]' };
            case 'cancelled': return { text: t('common.cancel'), color: 'text-aura-danger', barColor: 'bg-aura-danger', glow: '' };
            default: return { text: 'ACTIVE', color: 'text-white', barColor: 'bg-white', glow: 'shadow-none' };
        }
    }, [status, isReconnecting, t]);

    const progressSegments = 24;
    const currentProgress = status === 'searching' ? 4 
                          : status === 'confirmed' ? 8 
                          : status === 'arriving' ? 16
                          : status === 'in_progress' ? 20
                          : 24;

    // --- RENDERERS ---

    if (driverCancelled) {
        return (
            <div className="p-6 max-w-lg mx-auto w-full animate-[fadeIn_0.3s]">
                <GlassView className="p-8 text-center border-aura-danger/30">
                    <div className="w-16 h-16 rounded-full bg-aura-danger/10 flex items-center justify-center mx-auto mb-4 border border-aura-danger/20 shadow-[0_0_30px_rgba(255,51,102,0.2)]">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF3366" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">{t('active_ride.driver_cancelled')}</h2>
                    <p className="text-aura-textSecondary text-sm mb-6">{t('active_ride.driver_cancelled_desc')}</p>
                    <NeonButton label={t('active_ride.find_new')} onClick={onCancel} fullWidth />
                </GlassView>
            </div>
        );
    }

    if (showReceipt) {
        return (
            <RideReceipt 
                price={ride.price}
                destination="Selected Destination"
                date="Today, Just now"
                carType={ride.name}
                paymentMethod={paymentMethod}
                driver={MOCK_DRIVER}
                onClose={onCancel}
                actionLabel="Complete Rating"
            />
        );
    }

    return (
        <>
            <div className="p-6 max-w-lg mx-auto w-full animate-[slideUp_0.5s_ease-out] relative">
                
                {/* Advanced Technical Radar Pulse Overlay for Searching */}
                {status === 'searching' && !isReconnecting && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-56 z-0 w-[500px] h-[500px] pointer-events-none">
                         {/* Tech Rings */}
                         <div className="absolute inset-[20px] border border-aura-primary/5 rounded-full animate-[spin_20s_linear_infinite]" style={{ borderStyle: 'dashed' }} />
                         <div className="absolute inset-[80px] border border-aura-primary/10 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                         
                         {/* Scanning Sector */}
                         <div className="absolute inset-0 rounded-full animate-[spin_4s_linear_infinite]"
                              style={{ background: 'conic-gradient(from 0deg, transparent 0deg, transparent 300deg, rgba(0,245,255,0.1) 360deg)' }} />

                         {/* Radar Blips */}
                         <div className="absolute top-[20%] left-[30%] w-1.5 h-1.5 bg-white rounded-full animate-ping opacity-50" style={{ animationDuration: '3s' }} />
                         <div className="absolute bottom-[30%] right-[25%] w-1.5 h-1.5 bg-white rounded-full animate-ping opacity-50" style={{ animationDuration: '2.2s', animationDelay: '1s' }} />
                         
                         {/* Central Pulse */}
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-aura-primary rounded-full shadow-[0_0_30px_#00F5FF] animate-pulse" />
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-aura-primary/20 rounded-full animate-ping" />
                    </div>
                )}

                <GlassView className="p-0 border-white/10 backdrop-blur-3xl overflow-hidden shadow-2xl relative">
                    {/* Reconnecting Overlay */}
                    {isReconnecting && (
                         <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center flex-col gap-3 animate-[fadeIn_0.2s]">
                             <div className="w-12 h-12 border-2 border-aura-danger border-t-transparent rounded-full animate-spin" />
                             <span className="text-aura-danger text-xs font-bold tracking-widest uppercase animate-pulse">{t('active_ride.reconnecting')}</span>
                         </div>
                    )}

                    {/* SAFETY SHIELD ICON */}
                    <button 
                        onClick={() => setShowSafety(true)}
                        className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/5 hover:bg-aura-danger/20 flex items-center justify-center border border-white/10 hover:border-aura-danger/50 text-white/50 hover:text-aura-danger transition-colors"
                    >
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </button>

                    {/* Top Status Bar with Gradient */}
                    <div className="relative p-6 pb-0 z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex-1">
                                <div className={`${statusConfig.color} font-bold text-[10px] tracking-[0.2em] mb-2 flex items-center gap-2 animate-pulse`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.barColor} ${statusConfig.glow}`} />
                                    {statusConfig.text}
                                </div>
                                <div className="text-3xl font-bold text-white mb-1 tracking-tight truncate">
                                    {status === 'searching' ? t('active_ride.scanning') : ride.name}
                                </div>
                                {status !== 'searching' && (
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="bg-white/10 px-2 py-1 rounded text-white font-mono text-xs border border-white/5 tracking-wider shadow-inner">{MOCK_DRIVER.carPlate}</div>
                                        <span className="text-sm text-aura-textSecondary">{MOCK_DRIVER.carModel}</span>
                                    </div>
                                )}
                            </div>
                            
                            {status !== 'searching' && (
                                <div className="relative group cursor-pointer ml-4">
                                    <div className="w-14 h-14 rounded-2xl bg-[#1a1a1a] border border-white/10 overflow-hidden flex items-center justify-center shadow-lg group-hover:border-aura-primary/50 transition-colors">
                                        <div className="text-2xl">👨‍✈️</div>
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-black border border-white/20 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-md">
                                        <span className="text-aura-primary">★</span>
                                        {MOCK_DRIVER.rating}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Sci-Fi Segmented Progress Bar */}
                        <div className="flex gap-[2px] mb-8 w-full h-1.5 bg-black/20 rounded-full overflow-hidden">
                            {Array.from({ length: progressSegments }).map((_, i) => (
                                <div 
                                    key={i}
                                    className={`flex-1 transition-all duration-300 ${
                                        i < currentProgress 
                                            ? `${statusConfig.barColor} ${statusConfig.glow} opacity-100` 
                                            : 'bg-white/5 opacity-20'
                                    }`}
                                />
                            ))}
                        </div>
                        
                        {/* ETA Big Display */}
                        {eta !== null && status !== 'completed' && (
                            <div className="absolute top-6 right-6 text-right pointer-events-none opacity-10 scale-150 origin-top-right">
                                <div className="text-6xl font-black text-white tracking-tighter">{eta}</div>
                            </div>
                        )}
                    </div>

                    {/* Action Grid */}
                    <div className="grid grid-cols-2 gap-[1px] bg-white/5 border-t border-white/5">
                        <button 
                            onClick={() => setShowChat(true)}
                            disabled={status === 'searching' || status === 'completed'}
                            className="p-4 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-medium text-white flex flex-col items-center justify-center gap-2 group"
                        >
                            <div className="p-2 rounded-full bg-white/5 group-hover:scale-110 transition-transform">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            </div>
                            <span className="opacity-80">{t('active_ride.message')}</span>
                        </button>
                        
                        {/* Cancel Button */}
                        <button 
                            onClick={() => setCancelPhase('warning')}
                            disabled={status === 'completed'}
                            className="p-4 hover:bg-aura-danger/5 text-aura-danger transition-colors text-sm font-medium flex flex-col items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed group"
                        >
                            <div className="flex flex-col items-center">
                                <div className="p-2 rounded-full bg-aura-danger/10 group-hover:scale-110 transition-transform mb-1">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                                </div>
                                <span>{t('common.cancel')}</span>
                            </div>
                            {/* Free Cancellation Timer Indicator */}
                            {(status === 'confirmed' || status === 'arriving') && !hasFreeCancelExpired && (
                                <span className="text-[10px] text-aura-success mt-1 opacity-80 group-hover:opacity-100 transition-opacity font-mono tracking-wide">
                                    Free: {formatTime(secondsToCancel)}
                                </span>
                            )}
                        </button>
                    </div>
                </GlassView>
            </div>

            {/* --- CANCELLATION MODALS --- */}
            
            {/* Stage 1: Warning */}
            {cancelPhase === 'warning' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s] p-6">
                    <GlassView className="w-full max-w-sm border-aura-danger/30 shadow-[0_0_50px_rgba(255,51,102,0.1)]">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-aura-danger/10 flex items-center justify-center mx-auto mb-4 border border-aura-danger/20">
                                <span className="text-3xl">⚠️</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{t('active_ride.cancel_ride')}</h3>
                            
                            {hasFreeCancelExpired ? (
                                <p className="text-white/60 text-sm mb-6">
                                    {t('active_ride.cancel_fee_warning')} <span className="text-white font-bold">$5.00</span> {t('active_ride.cancel_fee_apply')}
                                </p>
                            ) : (
                                <p className="text-white/60 text-sm mb-6">
                                    {t('active_ride.free_cancel_time')} <span className="text-aura-success font-bold font-mono">{formatTime(secondsToCancel)}</span>.
                                </p>
                            )}

                            <div className="space-y-3">
                                <button 
                                    onClick={() => setCancelPhase('countdown')}
                                    className="w-full py-3 rounded-xl bg-aura-danger text-white font-bold hover:bg-red-500 transition-colors shadow-[0_0_20px_rgba(255,51,102,0.3)]"
                                >
                                    {t('active_ride.confirm_cancel')}
                                </button>
                                <button 
                                    onClick={() => setCancelPhase('none')}
                                    className="w-full py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors border border-white/5"
                                >
                                    {t('active_ride.keep_ride')}
                                </button>
                            </div>
                        </div>
                    </GlassView>
                </div>
            )}

            {/* Stage 2: Countdown Timer */}
            {cancelPhase === 'countdown' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-6">
                    <div className="flex flex-col items-center gap-6 animate-[slideUp_0.3s]">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            {/* Spinning Warning Ring */}
                            <div className="absolute inset-0 border-2 border-aura-danger/20 rounded-full animate-[spin_4s_linear_infinite]" 
                                 style={{ borderTopColor: 'transparent' }} />

                            <svg className="w-full h-full -rotate-90">
                                <circle cx="64" cy="64" r="60" stroke="#331111" strokeWidth="6" fill="transparent" />
                                <circle 
                                    cx="64" cy="64" r="60" 
                                    stroke="#FF3366" strokeWidth="6" fill="transparent" 
                                    strokeDasharray={377}
                                    strokeDashoffset={377 - ((5 - cancelCountdown) / 5) * 377}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000 ease-linear"
                                />
                            </svg>
                            <span className="absolute text-4xl font-black text-white">{cancelCountdown}</span>
                        </div>
                        
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-white mb-1">{t('active_ride.cancelling')}</h3>
                            <p className="text-aura-textSecondary text-xs tracking-wider uppercase">Tap {t('common.undo')} to stop</p>
                        </div>

                        <button 
                            onClick={() => setCancelPhase('none')}
                            className="px-8 py-3 rounded-full bg-white text-black font-bold hover:scale-105 transition-transform shadow-[0_0_20px_white] tracking-widest"
                        >
                            {t('common.undo')}
                        </button>
                    </div>
                </div>
            )}

            {/* Modals */}
            {showChat && <DriverChat driver={MOCK_DRIVER} onClose={() => setShowChat(false)} />}
            {showSafety && <SafetyHub onClose={() => setShowSafety(false)} />}
        </>
    );
};