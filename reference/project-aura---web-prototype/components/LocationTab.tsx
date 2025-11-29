
import React from 'react';
import { GlassView } from './ui/GlassView';
import { MOCK_LOCATIONS } from '../constants';
import { NeonButton } from './ui/NeonButton';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';

export const LocationTab: React.FC = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();

    const handleAddPlace = () => {
        showToast('Address input not implemented in demo', 'info');
    };

    return (
        <div className="w-full max-w-lg mx-auto h-[70vh] flex flex-col animate-[fadeIn_0.4s_ease-out] pb-24">
             <div className="px-6 mb-4">
                <h2 className="text-2xl font-bold tracking-tight text-white">{t('nav.location')}</h2>
                <p className="text-aura-textSecondary text-sm">{t('profile.saved_places')}</p>
            </div>

            <div className="px-6 space-y-4 overflow-y-auto hide-scrollbar">
                {/* Add New Button */}
                <button 
                    onClick={handleAddPlace}
                    className="w-full p-4 rounded-2xl border border-dashed border-white/20 hover:border-aura-primary/50 hover:bg-aura-primary/5 transition-all flex items-center justify-center gap-2 group"
                >
                    <div className="w-8 h-8 rounded-full bg-aura-primary/10 flex items-center justify-center text-aura-primary group-hover:scale-110 transition-transform">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </div>
                    <span className="font-medium text-white/80 group-hover:text-aura-primary">{t('common.submit')} New</span>
                </button>

                {/* Saved Places List */}
                <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-aura-textSecondary uppercase tracking-wider pl-1">{t('profile.saved_places')}</h3>
                    {MOCK_LOCATIONS.map((loc) => (
                        <GlassView key={loc.name} className="p-0 overflow-hidden group">
                            <div className="flex items-center p-4 gap-4">
                                <div className="w-12 h-12 rounded-xl bg-[#222] relative overflow-hidden flex-shrink-0 border border-white/5 group-hover:border-aura-primary/30 transition-colors">
                                     {/* Mini Map Pattern */}
                                     <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[length:4px_4px]" />
                                     <div className="absolute inset-0 flex items-center justify-center text-lg">
                                        {loc.name === 'Home' ? '🏠' : loc.name === 'Work' ? '💼' : '📍'}
                                     </div>
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-white">{loc.name}</div>
                                    <div className="text-xs text-aura-textSecondary mt-0.5">123 Wilshire Blvd, Los Angeles</div>
                                </div>
                                <button className="p-2 text-white/30 hover:text-white transition-colors">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                                </button>
                            </div>
                        </GlassView>
                    ))}
                </div>

                {/* Recent Destinations */}
                <div className="space-y-3 pt-4">
                     <h3 className="text-xs font-semibold text-aura-textSecondary uppercase tracking-wider pl-1">{t('admin.recent_rides')}</h3>
                     {[1,2,3].map((i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-medium text-white/90">Nobu Malibu</div>
                                <div className="text-xs text-white/40">Yesterday</div>
                            </div>
                        </div>
                     ))}
                </div>
            </div>
        </div>
    );
};
