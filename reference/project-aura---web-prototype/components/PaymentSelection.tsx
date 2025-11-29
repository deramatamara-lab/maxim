
import React, { useState } from 'react';
import { GlassView } from './ui/GlassView';
import { MOCK_PAYMENT_METHODS } from '../constants';
import { PaymentMethod } from '../types';
import { NeonButton } from './ui/NeonButton';
import { AddPaymentModal } from './AddPaymentModal';

interface PaymentSelectionProps {
    selectedMethodId: string;
    onSelect: (method: PaymentMethod) => void;
    onClose: () => void;
}

export const PaymentSelection: React.FC<PaymentSelectionProps> = ({ selectedMethodId, onSelect, onClose }) => {
    const [showAddModal, setShowAddModal] = useState(false);
    
    // Helper for card styling
    const getCardStyle = (method: PaymentMethod) => {
        if (method.type === 'wallet') return 'bg-gradient-to-br from-gray-900 to-black border-gray-700'; // Apple Pay style
        if (method.brand === 'visa') return 'bg-gradient-to-br from-[#1a1f71] to-[#0057b8] border-blue-900'; // Visa Blue
        if (method.brand === 'mastercard') return 'bg-gradient-to-br from-[#222] via-[#333] to-[#222] border-orange-900/30'; // Dark Generic with Orange hint
        return 'bg-gradient-to-br from-gray-800 to-gray-900 border-white/10'; // Fallback
    };

    const getIcon = (method: PaymentMethod) => {
        if (method.type === 'wallet') return <span className="text-lg"></span>;
        if (method.brand === 'visa') return <span className="italic font-serif font-black tracking-tighter">VISA</span>;
        if (method.brand === 'mastercard') return (
            <div className="flex -space-x-2">
                <div className="w-4 h-4 rounded-full bg-red-500/80" />
                <div className="w-4 h-4 rounded-full bg-yellow-500/80" />
            </div>
        );
        return <span className="text-lg">💳</span>;
    };

    if (showAddModal) {
        return <AddPaymentModal onClose={() => setShowAddModal(false)} />;
    }

    return (
        <div className="absolute inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xl animate-[fadeIn_0.3s]">
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={onClose} />
            
            <GlassView className="w-full max-w-lg mx-4 mb-4 sm:mb-0 overflow-hidden flex flex-col max-h-[80vh] relative z-10 animate-[slideUp_0.4s_cubic-bezier(0.19,1,0.22,1)] shadow-2xl border border-white/10">
                <div className="p-6 pb-4 flex justify-between items-center bg-black/20">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-white">Wallet</h2>
                        <p className="text-[10px] text-aura-textSecondary uppercase tracking-widest font-semibold">Select Payment Method</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>
                
                <div className="p-6 space-y-4 overflow-y-auto hide-scrollbar">
                    {MOCK_PAYMENT_METHODS.map((method) => {
                        const isSelected = selectedMethodId === method.id;
                        return (
                            <button
                                key={method.id}
                                onClick={() => {
                                    onSelect(method);
                                    onClose();
                                }}
                                className={`w-full group relative h-24 rounded-2xl border transition-all duration-300 overflow-hidden text-left shadow-lg transform
                                    ${getCardStyle(method)}
                                    ${isSelected 
                                        ? 'ring-2 ring-aura-primary scale-[1.02] shadow-[0_10px_30px_-5px_rgba(0,0,0,0.8)]' 
                                        : 'hover:scale-[1.01] hover:brightness-110 opacity-90'
                                    }
                                `}
                            >
                                {/* Shine Effect */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                
                                <div className="absolute inset-0 p-5 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        {/* Chip visual */}
                                        <div className="w-9 h-7 rounded bg-[#d4af37]/20 border border-[#d4af37]/50 relative overflow-hidden flex items-center justify-center">
                                            <div className="w-full h-[1px] bg-[#d4af37]/40 absolute top-1/2 -translate-y-1/2" />
                                            <div className="h-full w-[1px] bg-[#d4af37]/40 absolute left-1/2 -translate-x-1/2" />
                                            <div className="w-4 h-3 border border-[#d4af37]/60 rounded-sm" />
                                        </div>
                                        
                                        <div className="text-white/90 font-bold text-lg drop-shadow-md">
                                            {getIcon(method)}
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-[10px] text-white/50 font-mono tracking-widest uppercase mb-1">Card Number</div>
                                            <div className="text-white font-mono tracking-widest text-sm shadow-black drop-shadow-sm">
                                                •••• •••• •••• {method.last4 || 'PAY'}
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <div className="w-6 h-6 rounded-full bg-aura-primary text-black flex items-center justify-center shadow-[0_0_10px_rgba(0,245,255,0.5)]">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="p-6 pt-2 bg-gradient-to-t from-black/40 to-transparent">
                    <NeonButton 
                        label="Add New Card" 
                        variant="ghost" 
                        fullWidth 
                        onClick={() => setShowAddModal(true)}
                        className="!h-14 !text-sm border-dashed !border-white/20 hover:!border-aura-primary/50 hover:!text-aura-primary hover:!bg-aura-primary/5"
                        icon={<span className="text-lg mr-1">+</span>}
                    />
                </div>
            </GlassView>
        </div>
    );
};
