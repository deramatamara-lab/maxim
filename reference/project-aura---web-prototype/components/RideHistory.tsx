
import React, { useState, useEffect } from 'react';
import { GlassView } from './ui/GlassView';
import { MOCK_RIDE_HISTORY } from '../constants';
import { RideHistoryItem } from '../types';
import { RideReceipt } from './RideReceipt';
import { Skeleton } from './ui/Skeleton';
import { useTranslation } from 'react-i18next';

export const RideHistory: React.FC = () => {
    const { t } = useTranslation();
    const [selectedRide, setSelectedRide] = useState<RideHistoryItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Simulate network latency for premium feel
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1200);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="w-full max-w-lg mx-auto h-[70vh] flex flex-col animate-[fadeIn_0.4s_ease-out]">
            <div className="px-6 mb-4">
                <h2 className="text-2xl font-bold tracking-tight text-white">{t('nav.activity')}</h2>
                <p className="text-aura-textSecondary text-sm">{t('admin.recent_rides')}</p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-4 hide-scrollbar">
                {isLoading ? (
                    // Skeleton Loading State
                    <>
                        {[1, 2, 3].map((i) => (
                            <GlassView key={i} className="p-4 flex gap-4 h-28">
                                <Skeleton variant="rectangular" width={64} height={64} className="flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton variant="text" width="60%" />
                                    <Skeleton variant="text" width="40%" height={12} />
                                    <div className="pt-2 flex justify-between">
                                        <Skeleton variant="text" width="25%" height={20} className="rounded-full" />
                                        <Skeleton variant="text" width="20%" />
                                    </div>
                                </div>
                            </GlassView>
                        ))}
                    </>
                ) : (
                    // Actual Data
                    MOCK_RIDE_HISTORY.map((ride: RideHistoryItem) => (
                        <HistoryCard key={ride.id} ride={ride} onClick={() => setSelectedRide(ride)} />
                    ))
                )}
            </div>

            {/* Modal for Ride Details */}
            {selectedRide && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s] p-4">
                     <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                        <RideReceipt 
                            price={selectedRide.price}
                            destination={selectedRide.destination}
                            date={`${selectedRide.date} • ${selectedRide.time}`}
                            carType={selectedRide.carType}
                            paymentId={selectedRide.paymentId}
                            driver={selectedRide.driver}
                            onClose={() => setSelectedRide(null)}
                        />
                     </div>
                </div>
            )}
        </div>
    );
};

const HistoryCard: React.FC<{ ride: RideHistoryItem; onClick: () => void }> = ({ ride, onClick }) => {
    const { t } = useTranslation();
    const isCompleted = ride.status === 'completed';
    
    // Translate status if possible, else fallback
    const statusLabel = ride.status === 'completed' ? t('active_ride.completed') : 
                        ride.status === 'cancelled' ? t('active_ride.driver_cancelled') : ride.status;

    return (
        <GlassView className="p-0 group cursor-pointer transition-transform duration-200 active:scale-[0.98]">
            <button className="w-full text-left p-4 flex gap-4" onClick={onClick}>
                {/* Simulated Map Thumbnail */}
                <div className="w-16 h-16 rounded-xl bg-gray-800 relative overflow-hidden flex-shrink-0 border border-white/10 group-hover:border-aura-primary/30 transition-colors">
                    <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_50%_50%,_#333_1px,_transparent_1px)] bg-[length:4px_4px]" />
                    {/* Simulated Path Line */}
                    <svg className="absolute inset-0 w-full h-full opacity-60 p-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M4 20 Q 12 18 20 4" stroke="#00F5FF" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-white truncate pr-2 text-sm md:text-base">{ride.destination}</h3>
                        <span className="font-medium text-white">${ride.price.toFixed(2)}</span>
                    </div>
                    
                    <div className="text-xs text-aura-textSecondary mt-1 flex items-center gap-2">
                        <span>{ride.date} • {ride.time}</span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="text-[10px] font-bold text-aura-primary bg-aura-primary/10 px-2 py-0.5 rounded border border-aura-primary/20 tracking-wider uppercase">
                                {ride.carType}
                            </div>
                            {ride.driver && (
                                <div className="text-[10px] text-white/50 flex items-center gap-1">
                                    <span className="w-0.5 h-3 bg-white/10 mx-0.5"></span>
                                    {ride.driver.name}
                                </div>
                            )}
                        </div>
                        <div className={`text-[10px] uppercase font-bold tracking-wider ${isCompleted ? 'text-aura-success' : 'text-aura-danger'}`}>
                            {statusLabel} {ride.rating ? `• ★ ${ride.rating}.0` : ''}
                        </div>
                    </div>
                </div>
            </button>
        </GlassView>
    );
};
