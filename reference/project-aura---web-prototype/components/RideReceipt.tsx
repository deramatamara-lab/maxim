
import React, { useState } from 'react';
import { GlassView } from './ui/GlassView';
import { NeonButton } from './ui/NeonButton';
import { PaymentMethod, Driver } from '../types';
import { MOCK_PAYMENT_METHODS } from '../constants';

interface RideReceiptProps {
    price: number;
    destination: string;
    date: string;
    carType: string;
    paymentId?: string;
    paymentMethod?: PaymentMethod;
    driver?: Driver;
    onClose: () => void;
    actionLabel?: string;
}

export const RideReceipt: React.FC<RideReceiptProps> = ({ 
    price, 
    destination, 
    date, 
    carType,
    paymentId,
    paymentMethod,
    driver,
    onClose,
    actionLabel = "Close"
}) => {
    // Rating State
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedTip, setSelectedTip] = useState<number | null>(null);

    // Resolve payment method
    const resolvedPayment = paymentMethod || MOCK_PAYMENT_METHODS.find(p => p.id === paymentId) || MOCK_PAYMENT_METHODS[0];

    const getPaymentIcon = (method: PaymentMethod) => {
        if (method.type === 'wallet') return '';
        if (method.brand === 'visa') return 'VISA';
        if (method.brand === 'mastercard') return 'MC';
        return '💳';
    };

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    // Smart Tags based on rating
    const getTags = () => {
        if (rating === 0) return [];
        if (rating === 5) return ['Smooth Drive', 'Great Music', 'Clean Car', 'Conversation', 'Expert Nav'];
        if (rating >= 3) return ['Clean Car', 'On Time', 'Polite'];
        return ['Late Arrival', 'Cleanliness', 'Driving', 'Route'];
    };

    const tips = [1, 3, 5];

    return (
        <div className="p-6 max-w-lg mx-auto w-full animate-[slideUp_0.4s_cubic-bezier(0.16,1,0.3,1)] overflow-y-auto hide-scrollbar max-h-[90vh]">
            <GlassView className="p-0 flex flex-col items-center text-center border-aura-success/20 overflow-hidden">
                {/* Header Pattern */}
                <div className="w-full h-32 bg-[#0A0A0A] relative flex items-center justify-center overflow-hidden border-b border-white/5">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#00FFB3_0%,_transparent_60%)] opacity-10" />
                    <div className="absolute bottom-0 w-full h-[1px] bg-gradient-to-r from-transparent via-aura-success/50 to-transparent" />
                    
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-[#050607] flex items-center justify-center mb-2 ring-1 ring-aura-success/30 shadow-[0_0_30px_rgba(0,255,179,0.15)]">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00FFB3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-wide">Ride Complete</h2>
                    </div>
                </div>

                <div className="p-6 w-full">
                    
                    {/* Interactive Rating Section */}
                    <div className="mb-8">
                        <div className="flex justify-center gap-3 mb-4">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button 
                                    key={star}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                    className="text-3xl focus:outline-none transition-transform hover:scale-125 duration-200"
                                    style={{ 
                                        color: star <= (hoverRating || rating) ? '#00F5FF' : '#333',
                                        textShadow: star <= (hoverRating || rating) ? '0 0 15px rgba(0,245,255,0.6)' : 'none'
                                    }}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                        <div className="text-sm font-medium text-white h-5">
                            {rating === 5 ? "Excellent!" : rating === 4 ? "Good" : rating === 0 ? "Rate your trip" : "How was it?"}
                        </div>
                    </div>

                    {/* Feedback Tags (Only show if rated) */}
                    {rating > 0 && (
                        <div className="flex flex-wrap justify-center gap-2 mb-8 animate-[fadeIn_0.3s]">
                            {getTags().map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => toggleTag(tag)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                        selectedTags.includes(tag) 
                                            ? 'bg-aura-primary/20 border-aura-primary text-aura-primary shadow-[0_0_10px_rgba(0,245,255,0.2)]' 
                                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                    }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* DRIVER MINI CARD */}
                    {driver && (
                        <div className="mb-6 bg-white/5 rounded-xl p-3 border border-white/5 flex items-start text-left gap-4">
                             <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-xl shadow-inner border border-white/10">
                                👨‍✈️
                             </div>
                             <div className="flex-1">
                                <div className="font-bold text-white text-sm">{driver.name}</div>
                                <div className="text-[10px] text-aura-textSecondary mb-2">{driver.carModel} • {driver.carPlate}</div>
                             </div>
                        </div>
                    )}

                    {/* TIP SELECTOR (Only if rated > 3) */}
                    {rating >= 4 && (
                        <div className="mb-6 animate-[slideUp_0.3s]">
                            <div className="text-[10px] text-aura-textSecondary uppercase tracking-widest font-bold mb-3">Add a Tip</div>
                            <div className="grid grid-cols-4 gap-2">
                                {tips.map(amount => (
                                    <button
                                        key={amount}
                                        onClick={() => setSelectedTip(selectedTip === amount ? null : amount)}
                                        className={`py-3 rounded-lg text-sm font-bold border transition-all ${
                                            selectedTip === amount 
                                                ? 'bg-aura-success text-black border-aura-success' 
                                                : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                        }`}
                                    >
                                        ${amount}
                                    </button>
                                ))}
                                <button className="py-3 rounded-lg text-sm font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10">
                                    Custom
                                </button>
                            </div>
                        </div>
                    )}

                    {/* RECEIPT BREAKDOWN */}
                    <div className="w-full bg-[#080808] rounded-xl p-5 mb-6 text-left border border-white/5 shadow-inner">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-sm font-medium text-white/60">Total Paid</span>
                            <span className="text-2xl font-bold text-white tracking-tight">
                                ${ (price + (selectedTip || 0)).toFixed(2) }
                            </span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-white/10">
                            <span className="text-aura-textSecondary text-xs font-medium">Payment</span>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-8 h-5 bg-white/10 rounded flex items-center justify-center text-[10px] font-bold border border-white/10">
                                    {getPaymentIcon(resolvedPayment)}
                                </div>
                                <span className="text-xs font-medium text-white/80 tracking-wide">
                                    {resolvedPayment.label || `•••• ${resolvedPayment.last4}`}
                                </span>
                            </div>
                        </div>
                    </div>

                    <NeonButton 
                        label={rating > 0 ? "Submit Feedback" : actionLabel} 
                        fullWidth 
                        onClick={onClose} 
                        className={rating > 0 ? "shadow-[0_0_30px_rgba(0,245,255,0.3)]" : ""}
                    />
                </div>
            </GlassView>
        </div>
    );
};
