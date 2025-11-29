import React from 'react';
import { GlassView } from './GlassView';
import { Tab } from '../../types';
import { useTranslation } from 'react-i18next';

interface FloatingTabBarProps {
    activeTab: Tab;
    onTabSelect: (tab: Tab) => void;
}

export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({ activeTab, onTabSelect }) => {
    const { t } = useTranslation();
    
    const tabs = [
        { id: Tab.HOME, label: t('nav.home'), icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        )},
        { id: Tab.ACTIVITY, label: t('nav.activity'), icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        )},
        { id: Tab.LOCATION, label: t('nav.location'), icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        )},
        { id: Tab.PROFILE, label: t('nav.profile'), icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        )},
    ];

    return (
        <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <div className="pointer-events-auto animate-[slideUp_0.4s_ease-out_0.2s]">
                <GlassView className="flex items-center gap-1 p-1.5 shadow-2xl" intensity="high">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabSelect(tab.id)}
                                className={`
                                    relative flex flex-col items-center justify-center w-20 h-16 rounded-xl transition-all duration-300
                                    ${isActive ? 'text-aura-primary' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}
                                `}
                            >
                                {/* Glow Effect for Active Tab */}
                                {isActive && (
                                    <div className="absolute inset-0 bg-aura-primary/10 rounded-xl blur-md" />
                                )}
                                
                                <div className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-1' : ''}`}>
                                    {tab.icon}
                                </div>
                                
                                <span className={`text-[10px] mt-1 font-medium tracking-wide transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                                    {tab.label}
                                </span>
                                
                                {/* Active Indicator Dot */}
                                {isActive && (
                                    <div className="absolute bottom-1.5 w-1 h-1 bg-aura-primary rounded-full shadow-[0_0_8px_#00F5FF]" />
                                )}
                            </button>
                        );
                    })}
                </GlassView>
            </div>
        </div>
    );
};