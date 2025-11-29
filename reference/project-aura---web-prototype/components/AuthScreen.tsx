
import React, { useState, useEffect } from 'react';
import { GlassView } from './ui/GlassView';
import { NeonButton } from './ui/NeonButton';
import { useTranslation } from 'react-i18next';

interface AuthScreenProps {
    onComplete: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onComplete }) => {
    const { t } = useTranslation();
    const [status, setStatus] = useState<'idle' | 'scanning' | 'verified'>('idle');
    const [scanProgress, setScanProgress] = useState(0);

    const startScan = () => {
        setStatus('scanning');
    };

    useEffect(() => {
        let interval: any;
        if (status === 'scanning') {
            interval = setInterval(() => {
                setScanProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setStatus('verified');
                        setTimeout(onComplete, 1200); // Wait for success animation
                        return 100;
                    }
                    return prev + 2;
                });
            }, 30);
        }
        return () => clearInterval(interval);
    }, [status, onComplete]);

    return (
        <div className="w-full h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[#050607]">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-aura-primary/5 rounded-full blur-[100px] animate-pulse" />
            </div>

            <GlassView className="w-full max-w-sm p-8 flex flex-col items-center relative z-10 border-white/5 !bg-black/40">
                <h1 className="text-3xl font-bold tracking-tighter text-white mb-2">AURA</h1>
                <p className="text-xs text-aura-textSecondary uppercase tracking-[0.3em] mb-12">{t('auth.identity_verification')}</p>

                {/* Scanner Visual */}
                <div className="relative w-64 h-64 mb-12 flex items-center justify-center">
                    {/* Rotating Rings */}
                    <div className={`absolute inset-0 border border-white/10 rounded-full ${status === 'scanning' ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
                    <div className={`absolute inset-4 border border-aura-primary/20 rounded-full border-dashed ${status === 'scanning' ? 'animate-[spin_10s_linear_infinite_reverse]' : ''}`} />
                    
                    {/* Scanning Reticle */}
                    <div className="relative w-40 h-40">
                         {/* Corner Brackets */}
                         <svg className="absolute inset-0 w-full h-full text-aura-primary transition-all duration-500" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                             <path d="M20 20 L20 35 M20 20 L35 20" className={status === 'verified' ? 'stroke-aura-success' : ''} />
                             <path d="M80 20 L80 35 M80 20 L65 20" className={status === 'verified' ? 'stroke-aura-success' : ''} />
                             <path d="M20 80 L20 65 M20 80 L35 80" className={status === 'verified' ? 'stroke-aura-success' : ''} />
                             <path d="M80 80 L80 65 M80 80 L65 80" className={status === 'verified' ? 'stroke-aura-success' : ''} />
                         </svg>

                         {/* Face/ID Icon Placeholder */}
                         <div className="absolute inset-0 flex items-center justify-center">
                            {status === 'verified' ? (
                                <div className="text-aura-success animate-[zoomIn_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)]">
                                     <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                </div>
                            ) : (
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-white/20"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="6"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M2 12h2"/><path d="M20 12h2"/></svg>
                            )}
                         </div>

                         {/* Scan Line */}
                         {status === 'scanning' && (
                             <div className="absolute left-0 right-0 h-[2px] bg-aura-primary shadow-[0_0_15px_#00F5FF] animate-[scan_1.5s_linear_infinite]" />
                         )}
                    </div>
                </div>

                {/* Status Text & Button */}
                <div className="w-full text-center h-20">
                    {status === 'idle' && (
                        <NeonButton label={t('auth.scan_face_id')} onClick={startScan} fullWidth className="animate-[fadeIn_0.5s]" />
                    )}
                    {status === 'scanning' && (
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-aura-primary font-mono text-xs tracking-widest animate-pulse">{t('auth.verifying')}</span>
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-aura-primary transition-all duration-75" style={{ width: `${scanProgress}%` }} />
                            </div>
                        </div>
                    )}
                    {status === 'verified' && (
                        <div className="text-aura-success font-bold tracking-widest text-lg animate-[slideUp_0.3s]">
                            {t('auth.access_granted')}
                        </div>
                    )}
                </div>

                {/* Manual Login Link */}
                <div className="mt-8 text-white/30 text-xs hover:text-white cursor-pointer transition-colors">
                    {t('auth.use_passcode')}
                </div>
            </GlassView>
        </div>
    );
};
