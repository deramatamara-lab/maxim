
import React from 'react';
import { GlassView } from './ui/GlassView';
import { MOCK_ADMIN_STATS, MOCK_RECENT_TRANSACTIONS, ds } from '../constants';
import { MapHUD } from './MapHUD';
import { useTranslation } from 'react-i18next';

export const AdminDashboard: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="w-full h-screen bg-[#050607] flex overflow-hidden">
            {/* Sidebar */}
            <GlassView className="w-20 lg:w-64 h-full border-r border-white/10 !rounded-none flex flex-col p-4 z-20">
                <div className="mb-10 pl-2">
                    <div className="text-2xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-aura-primary to-white">
                        AURA <span className="text-xs font-normal tracking-widest text-white/50 block">{t('profile.admin')}</span>
                    </div>
                </div>

                <div className="space-y-2 flex-1">
                    {[
                        { icon: 'Activity', label: t('admin.overview'), active: true },
                        { icon: 'Map', label: t('admin.live_fleet'), active: false },
                        { icon: 'Users', label: t('profile.driver_app'), active: false },
                        { icon: 'DollarSign', label: t('driver.earnings'), active: false },
                    ].map((item) => (
                        <button 
                            key={item.label}
                            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
                                item.active 
                                    ? 'bg-aura-primary/10 text-aura-primary border border-aura-primary/20' 
                                    : 'text-white/50 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <div className="w-6 h-6 flex items-center justify-center">
                                {/* Simple Icon Proxies */}
                                {item.icon === 'Activity' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
                                {item.icon === 'Map' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>}
                                {item.icon === 'Users' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                                {item.icon === 'DollarSign' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
                            </div>
                            <span className="hidden lg:block font-medium">{item.label}</span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-xs border border-purple-500/50">JS</div>
                    <div className="hidden lg:block">
                        <div className="text-xs text-white font-bold">John Smith</div>
                        <div className="text-[10px] text-white/50">Super Admin</div>
                    </div>
                </div>
            </GlassView>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative overflow-y-auto animate-[fadeIn_0.5s]">
                {/* Header */}
                <div className="p-8 pb-4">
                    <h1 className="text-3xl font-bold text-white mb-6">{t('admin.overview')}</h1>
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {MOCK_ADMIN_STATS.map((stat) => (
                            <GlassView key={stat.label} className="p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-aura-textSecondary text-sm">{stat.label}</span>
                                    <div className={`text-xs px-2 py-0.5 rounded-full ${stat.isPositive ? 'bg-aura-success/10 text-aura-success' : 'bg-aura-danger/10 text-aura-danger'}`}>
                                        {stat.change}
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-white">{stat.value}</div>
                            </GlassView>
                        ))}
                    </div>
                </div>

                {/* Dashboard Widgets */}
                <div className="flex-1 p-8 pt-0 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Live Map Widget */}
                    <div className="lg:col-span-2 flex flex-col h-[400px] lg:h-auto relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                        <div className="absolute top-4 left-4 z-10">
                            <GlassView className="px-3 py-1 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-aura-success animate-pulse" />
                                <span className="text-xs font-bold text-white uppercase">{t('admin.live_fleet')}</span>
                            </GlassView>
                        </div>
                        <MapHUD />
                    </div>

                    {/* Recent Transactions */}
                    <GlassView className="flex flex-col h-full overflow-hidden">
                        <div className="p-6 border-b border-white/10">
                            <h3 className="font-bold text-white">{t('admin.recent_rides')}</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {MOCK_RECENT_TRANSACTIONS.map((t) => (
                                <div key={t.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${t.status === 'cancelled' ? 'bg-white/5 text-white/30' : 'bg-aura-primary/10 text-aura-primary'}`}>
                                            {t.type === 'Aura X' ? '⚡' : t.type === 'Hyper' ? '🚀' : '★'}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white">{t.user}</div>
                                            <div className="text-xs text-aura-textSecondary">{t.time} • {t.type}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-sm font-bold ${t.status === 'cancelled' ? 'text-aura-textSecondary line-through' : 'text-white'}`}>
                                            {t.amount}
                                        </div>
                                        <div className={`text-[10px] uppercase ${t.status === 'completed' ? 'text-aura-success' : 'text-aura-danger'}`}>
                                            {t.status}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-white/10">
                            <button className="w-full py-2 text-xs text-aura-primary font-bold tracking-widest hover:bg-aura-primary/10 rounded transition-colors">
                                {t('admin.view_all')}
                            </button>
                        </div>
                    </GlassView>
                </div>
            </div>
        </div>
    );
};
