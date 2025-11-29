import React, { useState, useEffect } from 'react';
import { GlassView } from './ui/GlassView';
import { NeonButton } from './ui/NeonButton';
import { MOCK_LOCATIONS } from '../constants';
import { useToast } from '../context/ToastContext';
import { UserRole } from '../types';
import { Skeleton } from './ui/Skeleton';
import { useTranslation } from 'react-i18next';

interface ProfileProps {
    onSwitchRole?: (role: UserRole) => void;
}

export const Profile: React.FC<ProfileProps> = ({ onSwitchRole }) => {
    const { t, i18n } = useTranslation();
    const { showToast } = useToast();
    const [quietMode, setQuietMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate data fetch
        const timer = setTimeout(() => setIsLoading(false), 1200);
        return () => clearTimeout(timer);
    }, []);

    const toggleQuietMode = () => {
        const newState = !quietMode;
        setQuietMode(newState);
        showToast(
            newState ? t('profile.quiet_mode') + ' Enabled' : t('profile.quiet_mode') + ' Disabled',
            newState ? 'success' : 'info'
        );
    };

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'bg' : 'en';
        i18n.changeLanguage(newLang);
        showToast(newLang === 'en' ? 'Language switched to English' : 'Езикът е сменен на Български', 'success');
    };

    const handleLogout = () => {
        showToast(t('common.loading') + '...', 'info');
    };

    return (
        <div className="w-full max-w-lg mx-auto h-[70vh] flex flex-col animate-[fadeIn_0.4s_ease-out] pb-24 overflow-y-auto hide-scrollbar">
            
            {/* Header Card with Parallax-like Glow */}
            <div className="px-6 mb-6 pt-2">
                <GlassView className="p-6 relative overflow-hidden group border-white/10">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-aura-primary/20 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/3 group-hover:bg-aura-primary/30 transition-colors duration-700" />
                    
                    <div className="flex items-center gap-5 relative z-10">
                        {isLoading ? (
                            <Skeleton variant="circular" width={88} height={88} className="ring-4 ring-white/5" />
                        ) : (
                            <div className="relative">
                                <div className="w-22 h-22 rounded-full border-2 border-aura-primary/30 p-1">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-4xl shadow-2xl relative overflow-hidden">
                                        <span className="relative z-10 filter drop-shadow-lg">👨‍💻</span>
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50" />
                                    </div>
                                </div>
                                <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#050607] rounded-full flex items-center justify-center">
                                    <div className="w-4 h-4 bg-aura-success rounded-full border border-black animate-pulse" />
                                </div>
                            </div>
                        )}
                        
                        <div className="flex-1">
                            {isLoading ? (
                                <div className="space-y-3">
                                    <Skeleton variant="text" width={140} height={28} />
                                    <Skeleton variant="rectangular" width={110} height={24} className="rounded-full" />
                                </div>
                            ) : (
                                <div className="animate-[slideUp_0.4s_ease-out]">
                                    <h2 className="text-3xl font-bold text-white tracking-tight">Alex V.</h2>
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-aura-primary/10 border border-aura-primary/20 mt-2 shadow-[0_0_15px_rgba(0,245,255,0.1)] backdrop-blur-md">
                                        <span className="text-[10px] font-black text-aura-primary tracking-widest uppercase">Aura Black Member</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </GlassView>
            </div>

            {/* Stats Grid */}
            <div className="px-6 grid grid-cols-2 gap-4 mb-8">
                {isLoading ? (
                    <>
                         <GlassView className="p-4 h-28 flex flex-col items-center justify-center gap-3">
                            <Skeleton variant="text" width={48} height={40} />
                            <Skeleton variant="text" width={80} height={12} />
                         </GlassView>
                         <GlassView className="p-4 h-28 flex flex-col items-center justify-center gap-3">
                            <Skeleton variant="text" width={48} height={40} />
                            <Skeleton variant="text" width={80} height={12} />
                         </GlassView>
                    </>
                ) : (
                    <>
                        <GlassView className="p-4 flex flex-col items-center justify-center gap-1 group hover:bg-white/5 transition-colors cursor-default animate-[zoomIn_0.4s_ease-out_0.1s]">
                            <span className="text-4xl font-bold text-white group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">4.95</span>
                            <span className="text-[10px] text-aura-textSecondary uppercase tracking-[0.2em] font-bold mt-1">{t('profile.rating')}</span>
                        </GlassView>
                        <GlassView className="p-4 flex flex-col items-center justify-center gap-1 group hover:bg-white/5 transition-colors cursor-default animate-[zoomIn_0.4s_ease-out_0.2s]">
                            <span className="text-4xl font-bold text-white group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">142</span>
                            <span className="text-[10px] text-aura-textSecondary uppercase tracking-[0.2em] font-bold mt-1">{t('profile.rides')}</span>
                        </GlassView>
                    </>
                )}
            </div>

            {/* DEV MODE SWITCHER (Prototype Controls) */}
            {onSwitchRole && !isLoading && (
                <div className="px-6 mb-8 animate-[slideUp_0.4s_ease-out_0.3s]">
                    <div className="flex items-center justify-between mb-3 pl-1">
                        <h3 className="text-[10px] font-bold text-aura-primary uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-aura-primary rounded-full animate-pulse shadow-[0_0_5px_#00F5FF]" />
                            {t('profile.prototype_controls')}
                        </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => onSwitchRole('driver')}
                            className="p-4 bg-[#111] border border-white/10 rounded-xl hover:border-aura-primary/50 transition-all hover:bg-aura-primary/5 text-left group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-16 h-16 bg-aura-primary/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 group-hover:bg-aura-primary/10 transition-colors" />
                            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform origin-left duration-300">🚖</div>
                            <div className="font-bold text-white text-sm relative z-10">{t('profile.driver_app')}</div>
                            <div className="text-[10px] text-white/50 mt-1 relative z-10">{t('profile.simulate_trip')}</div>
                        </button>
                        <button 
                            onClick={() => onSwitchRole('admin')}
                            className="p-4 bg-[#111] border border-white/10 rounded-xl hover:border-aura-primary/50 transition-all hover:bg-aura-primary/5 text-left group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/10 transition-colors" />
                            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform origin-left duration-300">📊</div>
                            <div className="font-bold text-white text-sm relative z-10">{t('profile.admin')}</div>
                            <div className="text-[10px] text-white/50 mt-1 relative z-10">{t('profile.analytics')}</div>
                        </button>
                    </div>
                </div>
            )}

            {/* Saved Places */}
            <div className="px-6 mb-8 animate-[slideUp_0.4s_ease-out_0.4s]">
                <h3 className="text-[10px] font-bold text-aura-textSecondary uppercase tracking-[0.2em] mb-3 pl-1">{t('profile.saved_places')}</h3>
                <div className="space-y-2">
                    {isLoading ? (
                        [1, 2].map(i => <Skeleton key={i} height={72} className="rounded-xl w-full" />)
                    ) : (
                        MOCK_LOCATIONS.map(loc => (
                            <GlassView key={loc.name} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-all cursor-pointer group border border-transparent hover:border-white/10">
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70 group-hover:text-aura-primary group-hover:bg-aura-primary/10 transition-colors border border-white/5 group-hover:border-aura-primary/30 group-hover:shadow-[0_0_10px_rgba(0,245,255,0.2)]">
                                    {loc.name === 'Home' ? '🏠' : loc.name === 'Work' ? '💼' : '📍'}
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-white text-sm tracking-wide">{loc.name}</div>
                                    <div className="text-[11px] text-aura-textSecondary mt-0.5">123 Wilshire Blvd, Los Angeles</div>
                                </div>
                                <div className="p-2 rounded-full text-white/20 group-hover:text-white group-hover:bg-white/10 transition-all">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                                </div>
                            </GlassView>
                        ))
                    )}
                </div>
            </div>

            {/* Preferences */}
            <div className="px-6 mb-8 animate-[slideUp_0.4s_ease-out_0.5s]">
                <h3 className="text-[10px] font-bold text-aura-textSecondary uppercase tracking-[0.2em] mb-3 pl-1">{t('profile.preferences')}</h3>
                <GlassView className="divide-y divide-white/5 border border-white/10">
                    
                    {/* LANGUAGE TOGGLE */}
                    <div className="p-4 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm border border-white/10 group-hover:border-white/30 transition-colors">🌐</div>
                            <span className="font-medium text-sm text-white tracking-wide">{t('profile.language')}</span>
                        </div>
                        <button 
                            onClick={toggleLanguage}
                            className="flex items-center bg-black/40 border border-white/10 rounded-lg p-1 relative overflow-hidden"
                        >
                            <div className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all duration-300 z-10 ${i18n.language === 'en' ? 'text-black' : 'text-white/50'}`}>EN</div>
                            <div className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all duration-300 z-10 ${i18n.language === 'bg' ? 'text-black' : 'text-white/50'}`}>BG</div>
                            
                            {/* Sliding Background */}
                            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-aura-primary rounded shadow-[0_0_10px_rgba(0,245,255,0.4)] transition-all duration-300 ${i18n.language === 'en' ? 'left-1' : 'left-[calc(50%+2px)]'}`} />
                        </button>
                    </div>

                    {/* QUIET MODE */}
                    <div className="p-4 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm border border-white/10 group-hover:border-white/30 transition-colors">🔇</div>
                            <span className="font-medium text-sm text-white tracking-wide">{t('profile.quiet_mode')}</span>
                        </div>
                        <button 
                            onClick={toggleQuietMode}
                            className={`w-11 h-6 rounded-full transition-colors relative border duration-300 ${quietMode ? 'bg-aura-primary/20 border-aura-primary' : 'bg-black/40 border-white/10'}`}
                        >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 shadow-sm ${quietMode ? 'left-[22px] bg-aura-primary shadow-[0_0_8px_#00F5FF]' : 'left-1 bg-white/30'}`} />
                        </button>
                    </div>

                    {/* PAYMENT METHODS */}
                    <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm border border-white/10 group-hover:border-white/30 transition-colors">💳</div>
                            <span className="font-medium text-sm text-white tracking-wide">{t('profile.payment_methods')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-aura-textSecondary group-hover:text-white transition-colors">Visa •••• 4242</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30 group-hover:text-white transition-colors"><polyline points="9 18 15 12 9 6"/></svg>
                        </div>
                    </div>
                </GlassView>
            </div>

            <div className="px-6 pb-6 animate-[slideUp_0.4s_ease-out_0.6s]">
                <NeonButton 
                    label={t('profile.log_out')} 
                    variant="ghost" 
                    fullWidth 
                    className="!h-12 !text-xs !border-aura-danger/30 !text-aura-danger hover:!bg-aura-danger/10 hover:!border-aura-danger/50 hover:!shadow-[0_0_20px_rgba(255,51,102,0.2)]" 
                    onClick={handleLogout}
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>}
                />
            </div>
        </div>
    );
};
