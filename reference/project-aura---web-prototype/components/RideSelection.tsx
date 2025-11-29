import React, { useState } from 'react';
import { RIDE_OPTIONS, MOCK_PAYMENT_METHODS, ds } from '../constants';
import { RideOption, PaymentMethod, RidePreferences as RidePreferencesType } from '../types';
import { GlassView } from './ui/GlassView';
import { NeonButton } from './ui/NeonButton';
import { PaymentSelection } from './PaymentSelection';
import { RidePreferences } from './RidePreferences';
import { useTranslation } from 'react-i18next';

interface RideSelectionProps {
    onSelect: (ride: RideOption, paymentMethod: PaymentMethod, prefs: RidePreferencesType) => void;
    onBack: () => void;
}

const DEFAULT_PREFS: RidePreferencesType = {
    temperature: 70,
    lighting: '#00F5FF',
    music: 'lofi',
    conversation: 'normal',
    luggageAssist: false
};

export const RideSelection: React.FC<RideSelectionProps> = ({ onSelect, onBack }) => {
    const { t } = useTranslation();
    const [selectedId, setSelectedId] = useState<string>(RIDE_OPTIONS[0].id);
    const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>(MOCK_PAYMENT_METHODS[0]);
    const [prefs, setPrefs] = useState<RidePreferencesType>(DEFAULT_PREFS);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showPrefsModal, setShowPrefsModal] = useState(false);

    const getPaymentIcon = (method: PaymentMethod) => {
        if (method.type === 'wallet') return '';
        if (method.brand === 'visa') return 'VISA';
        if (method.brand === 'mastercard') return 'MC';
        return '💳';
    };

    const handleConfirm = () => {
        const ride = RIDE_OPTIONS.find(r => r.id === selectedId)!;
        onSelect(ride, selectedPayment, prefs);
    };

    // Helper to get vehicle stats based on ID (simulated data)
    const getVehicleStats = (id: string) => {
        switch(id) {
            case 'aura-x': return { seats: 4, bags: 2, range: '300mi' };
            case 'aura-black': return { seats: 3, bags: 3, range: 'Unlimited' };
            case 'aura-hyper': return { seats: 2, bags: 1, range: 'Sport' };
            default: return { seats: 4, bags: 2 };
        }
    };

    return (
        <>
            <div className={`w-full max-w-lg mx-auto h-full flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0,0.67,0)] ${showPaymentModal || showPrefsModal ? 'scale-95 opacity-50 blur-sm grayscale' : 'scale-100 opacity-100'}`}>
                <GlassView className="flex flex-col h-full overflow-hidden p-0 animate-[slideUp_0.5s_cubic-bezier(0.16,1,0.3,1)] shadow-2xl !bg-[#050607]/80 backdrop-blur-3xl border border-white/10">
                    {/* Header */}
                    <div className="p-6 pb-2 flex items-center justify-between z-10 bg-gradient-to-b from-black/40 to-transparent">
                        <button 
                            onClick={onBack} 
                            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white hover:scale-105 transition-all active:scale-95 border border-white/5"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                        </button>
                        <div className="flex flex-col items-center">
                            <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase text-aura-primary mb-0.5">{t('ride_select.fleet')}</h2>
                            <span className="text-white font-semibold tracking-widest text-sm uppercase">{t('ride_select.select_vehicle')}</span>
                        </div>
                        <div className="w-10" />
                    </div>

                    {/* Ride List */}
                    <div className="flex-1 overflow-y-auto px-6 py-2 space-y-5 hide-scrollbar relative">
                        {RIDE_OPTIONS.map((ride, index) => {
                            const isSelected = selectedId === ride.id;
                            const stats = getVehicleStats(ride.id);

                            return (
                                <div 
                                    key={ride.id}
                                    onClick={() => setSelectedId(ride.id)}
                                    className={`
                                        relative rounded-[24px] cursor-pointer transition-all duration-500 group select-none
                                        ${isSelected ? 'scale-[1.02] z-10' : 'hover:scale-[1.01] opacity-70 hover:opacity-100 z-0'}
                                    `}
                                    style={{ animation: `slideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) backwards ${index * 0.05}s` }}
                                >
                                    {/* Selection Glow Container */}
                                    <div className={`absolute -inset-[1px] rounded-[24px] bg-gradient-to-r from-aura-primary via-aura-primaryAccent to-aura-secondary transition-opacity duration-500 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                                    
                                    {/* Blur Glow behind */}
                                    {isSelected && <div className="absolute -inset-4 bg-aura-primary/20 rounded-[32px] blur-xl opacity-50 transition-all duration-500" />}

                                    {/* Inner Card Content */}
                                    <div className={`
                                        relative h-full rounded-[23px] p-4 flex flex-col gap-3 overflow-hidden transition-colors duration-300
                                        ${isSelected ? 'bg-[#0A0A0A]' : 'bg-[#121212] border border-white/5'}
                                    `}>
                                        {/* Holographic Scan Effect */}
                                        {isSelected && (
                                            <div className="absolute inset-0 pointer-events-none z-0">
                                                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-transparent to-aura-primary/10 animate-[scan_2.5s_linear_infinite]" />
                                            </div>
                                        )}

                                        {/* Top Row: Icon + Name + Price */}
                                        <div className="flex items-center justify-between relative z-10">
                                            <div className="flex items-center gap-4">
                                                {/* Vehicle Avatar */}
                                                <div className={`
                                                    w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-500 relative overflow-hidden
                                                    ${isSelected 
                                                        ? 'bg-gradient-to-br from-aura-primary/20 to-aura-secondary/20 text-white shadow-[0_0_15px_rgba(0,245,255,0.2)] ring-1 ring-aura-primary/50' 
                                                        : 'bg-[#1F1F1F] text-white/30'}
                                                `}>
                                                    <span className="relative z-10 drop-shadow-md">{ride.icon === 'Zap' ? '⚡' : ride.icon === 'Star' ? '★' : '🚀'}</span>
                                                </div>
                                                
                                                <div>
                                                    <h3 className={`font-bold text-lg tracking-tight transition-colors duration-300 ${isSelected ? 'text-white' : 'text-white/70'}`}>{ride.name}</h3>
                                                    <div className="flex items-center gap-2 text-[10px] font-medium tracking-wider uppercase text-aura-textSecondary">
                                                        <span>{ride.time} {t('ride_select.away')}</span>
                                                        {isSelected && <span className="w-1 h-1 rounded-full bg-aura-primary animate-pulse" />}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className={`text-xl font-bold tracking-tight transition-all duration-300 ${isSelected ? 'text-aura-primary scale-110 origin-right drop-shadow-[0_0_8px_rgba(0,245,255,0.5)]' : 'text-white/50'}`}>
                                                    ${ride.price}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom Row: Specs & Badges (Visible on Select) */}
                                        <div className={`
                                            relative z-10 flex items-center justify-between pt-2 border-t border-white/5 transition-all duration-500
                                            ${isSelected ? 'opacity-100 max-h-12 mt-1' : 'opacity-0 max-h-0 overflow-hidden'}
                                        `}>
                                            <div className="flex gap-4">
                                                <div className="flex items-center gap-1.5 text-xs text-white/60">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                                    {stats.seats}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-white/60">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                                                    {stats.bags}
                                                </div>
                                            </div>
                                            
                                            {/* CUSTOMIZE BUTTON */}
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setShowPrefsModal(true); }}
                                                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-aura-primary transition-colors"
                                            >
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                                                {t('ride_select.customize')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer Area */}
                    <div className="p-6 pt-4 pb-8 bg-gradient-to-t from-[#050607] via-[#050607]/95 to-transparent z-20">
                        {/* Payment Dock */}
                        <div className="relative mb-5 group">
                             <div className="absolute inset-0 bg-white/5 rounded-xl blur-sm group-hover:bg-white/10 transition-colors" />
                             <button 
                                onClick={() => setShowPaymentModal(true)}
                                className="relative w-full bg-[#161616]/80 backdrop-blur-md rounded-xl p-3 flex items-center justify-between border border-white/10 group-hover:border-aura-primary/30 transition-all active:scale-[0.99]"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-8 bg-black rounded flex items-center justify-center text-xs border border-white/10 shadow-inner relative overflow-hidden">
                                        <div className="absolute -inset-2 bg-gradient-to-br from-white/10 to-transparent transform rotate-12" />
                                        <span className="relative z-10 font-bold">{getPaymentIcon(selectedPayment)}</span>
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="text-[9px] text-aura-textSecondary uppercase tracking-[0.2em] font-bold">{t('ride_select.payment')}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-white tracking-wide">{selectedPayment.label || `•••• ${selectedPayment.last4}`}</span>
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/30"><path d="M6 9l6 6 6-6"/></svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-aura-primary text-[10px] font-bold uppercase tracking-widest bg-aura-primary/10 px-2 py-1 rounded border border-aura-primary/20 group-hover:bg-aura-primary group-hover:text-black transition-colors">
                                    {t('ride_select.change')}
                                </div>
                            </button>
                        </div>
                        
                        <NeonButton 
                            label={`${t('ride_select.request')} ${RIDE_OPTIONS.find(r => r.id === selectedId)?.name.toUpperCase()}`} 
                            fullWidth 
                            onClick={handleConfirm}
                            className="h-16 text-lg tracking-[0.15em] font-black shadow-[0_0_40px_rgba(0,245,255,0.2)] hover:shadow-[0_0_60px_rgba(0,245,255,0.4)] transition-shadow duration-500"
                        />
                    </div>
                </GlassView>
            </div>

            {showPaymentModal && (
                <PaymentSelection 
                    selectedMethodId={selectedPayment.id}
                    onSelect={setSelectedPayment}
                    onClose={() => setShowPaymentModal(false)}
                />
            )}

            {showPrefsModal && (
                <RidePreferences 
                    initialPrefs={prefs}
                    onSave={setPrefs}
                    onClose={() => setShowPrefsModal(false)}
                />
            )}
        </>
    );
};