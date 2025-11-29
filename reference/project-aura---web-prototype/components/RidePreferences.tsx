
import React, { useState } from 'react';
import { GlassView } from './ui/GlassView';
import { NeonButton } from './ui/NeonButton';
import { RidePreferences as RidePreferencesType } from '../types';
import { useTranslation } from 'react-i18next';

interface RidePreferencesProps {
    initialPrefs: RidePreferencesType;
    onSave: (prefs: RidePreferencesType) => void;
    onClose: () => void;
}

export const RidePreferences: React.FC<RidePreferencesProps> = ({ initialPrefs, onSave, onClose }) => {
    const { t } = useTranslation();
    const [prefs, setPrefs] = useState<RidePreferencesType>(initialPrefs);

    const handleTempChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPrefs({ ...prefs, temperature: parseInt(e.target.value) });
    };

    const toggleLuggage = () => {
        setPrefs({ ...prefs, luggageAssist: !prefs.luggageAssist });
    };

    const colors = ['#00F5FF', '#FF00FF', '#00FFB3', '#FF3366', '#FFFFFF', '#FFAA00'];

    return (
        <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-[fadeIn_0.3s]">
            <GlassView className="w-full max-w-lg mx-auto sm:mx-4 h-[85vh] sm:h-auto flex flex-col animate-[slideUp_0.4s_cubic-bezier(0.16,1,0.3,1)] shadow-2xl border border-white/10 !bg-[#111]">
                
                {/* Header */}
                <div className="p-6 pb-2 flex justify-between items-center border-b border-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">{t('prefs.cabin_control')}</h2>
                        <p className="text-[10px] text-aura-textSecondary uppercase tracking-widest">{t('prefs.customize_exp')}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 hide-scrollbar">
                    
                    {/* Temperature */}
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-bold text-white uppercase tracking-wider">{t('prefs.temperature')}</span>
                            <span className="text-xs font-mono text-aura-primary">
                                {prefs.temperature < 30 ? t('prefs.cool') : prefs.temperature > 70 ? t('prefs.warm') : t('prefs.balanced')}
                            </span>
                        </div>
                        <div className="relative h-12 flex items-center">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-white/20 to-orange-500 rounded-full opacity-20" />
                            <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={prefs.temperature} 
                                onChange={handleTempChange}
                                className="w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div 
                                className="absolute h-8 w-8 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)] pointer-events-none transition-all duration-100 flex items-center justify-center text-[10px] font-bold text-black"
                                style={{ left: `calc(${prefs.temperature}% - 16px)` }}
                            >
                                {Math.round(65 + (prefs.temperature / 100) * 15)}°
                            </div>
                        </div>
                    </section>

                    {/* Ambient Lighting */}
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-bold text-white uppercase tracking-wider">{t('prefs.lighting')}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                            {colors.map(color => (
                                <button
                                    key={color}
                                    onClick={() => setPrefs({ ...prefs, lighting: color })}
                                    className={`w-10 h-10 rounded-full border-2 transition-all duration-300 ${prefs.lighting === color ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </section>

                    {/* Audio Vibe */}
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-bold text-white uppercase tracking-wider">{t('prefs.audio')}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {['lofi', 'jazz', 'techno', 'classical', 'none'].map((vibe) => (
                                <button
                                    key={vibe}
                                    onClick={() => setPrefs({ ...prefs, music: vibe as any })}
                                    className={`py-3 px-2 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all ${
                                        prefs.music === vibe 
                                            ? 'bg-aura-primary text-black border-aura-primary shadow-[0_0_10px_rgba(0,245,255,0.3)]' 
                                            : 'bg-white/5 text-white/60 border-transparent hover:bg-white/10'
                                    }`}
                                >
                                    {vibe}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Conversation */}
                    <section>
                         <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-bold text-white uppercase tracking-wider">{t('prefs.conversation')}</span>
                        </div>
                        <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
                            {['quiet', 'normal', 'chatty'].map((level) => (
                                <button
                                    key={level}
                                    onClick={() => setPrefs({ ...prefs, conversation: level as any })}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                                        prefs.conversation === level 
                                            ? 'bg-white/10 text-white shadow-sm' 
                                            : 'text-white/40 hover:text-white/80'
                                    }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </section>
                    
                    {/* Toggles */}
                    <section className="space-y-3">
                        <button 
                            onClick={toggleLuggage}
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-lg">🧳</span>
                                <span className="text-sm font-medium text-white">{t('prefs.luggage')}</span>
                            </div>
                            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${prefs.luggageAssist ? 'bg-aura-primary' : 'bg-white/10'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${prefs.luggageAssist ? 'translate-x-4' : ''}`} />
                            </div>
                        </button>
                    </section>

                </div>

                <div className="p-6 pt-2 bg-gradient-to-t from-[#111] to-transparent">
                    <NeonButton label={t('prefs.apply')} fullWidth onClick={() => { onSave(prefs); onClose(); }} />
                </div>
            </GlassView>
        </div>
    );
};
