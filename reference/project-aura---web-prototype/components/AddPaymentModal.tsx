import React, { useState } from 'react';
import { GlassView } from './ui/GlassView';
import { NeonButton } from './ui/NeonButton';
import { useToast } from '../context/ToastContext';

interface AddPaymentModalProps {
    onClose: () => void;
}

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ onClose }) => {
    const { showToast } = useToast();
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');
    const [zip, setZip] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Format card number with spaces
    const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 16) val = val.slice(0, 16);
        const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
        setCardNumber(formatted);
    };

    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 4) val = val.slice(0, 4);
        if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2);
        setExpiry(val);
    };

    const handleSave = () => {
        // Validation simulation
        if (cardNumber.replace(/\s/g, '').length < 16) {
            showToast('Invalid card number', 'error');
            return;
        }
        if (expiry.length < 5) {
            showToast('Invalid expiry date', 'error');
            return;
        }
        if (cvc.length < 3) {
            showToast('Invalid CVC', 'error');
            return;
        }

        setIsProcessing(true);

        // Simulate API call to Payment Processor (Stripe Mock)
        setTimeout(() => {
            setIsProcessing(false);
            showToast('Card added securely', 'success');
            onClose();
        }, 1500);
    };

    const simulateScan = () => {
        setIsScanning(true);
        setTimeout(() => {
            setCardNumber('4242 4242 4242 4242');
            setExpiry('12/26');
            setCvc('123');
            setIsScanning(false);
            showToast('Card details scanned', 'success');
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s]">
            <GlassView className="w-full max-w-lg mx-4 mb-4 sm:mb-0 p-6 flex flex-col animate-[slideUp_0.3s]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold tracking-wide text-white">Add Payment Method</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                </div>

                {/* Scan Card Visual */}
                <div 
                    onClick={simulateScan}
                    className={`relative w-full h-32 rounded-xl bg-gradient-to-br from-gray-900 to-black border border-white/10 mb-6 flex flex-col items-center justify-center cursor-pointer group overflow-hidden transition-all duration-300 ${isScanning ? 'border-aura-primary/50' : 'hover:border-white/20'}`}
                >
                    {isScanning && (
                        <div className="absolute inset-0 bg-aura-primary/5 z-10">
                            <div className="absolute top-0 w-full h-1 bg-aura-primary shadow-[0_0_20px_#00F5FF] animate-[scan_1.5s_linear_infinite]" />
                        </div>
                    )}
                    
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`mb-2 transition-colors ${isScanning ? 'text-aura-primary' : 'text-white/40 group-hover:text-white'}`}>
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                    </svg>
                    <span className="text-sm font-medium text-white/70 group-hover:text-white">
                        {isScanning ? 'Scanning Card...' : 'Scan Card'}
                    </span>
                </div>

                <div className="space-y-4 mb-8">
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-aura-textSecondary mb-2">Card Number</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={cardNumber}
                                onChange={handleCardChange}
                                placeholder="0000 0000 0000 0000"
                                maxLength={19}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-aura-primary/50 font-mono tracking-wider placeholder-white/20 transition-all"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2 pointer-events-none opacity-50">
                                <svg width="24" height="16" viewBox="0 0 36 24" fill="none"><rect width="36" height="24" rx="4" fill="#1A1A1A"/><circle cx="12" cy="12" r="8" fill="#EB001B" fillOpacity="0.8"/><circle cx="24" cy="12" r="8" fill="#F79E1B" fillOpacity="0.8"/></svg>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs uppercase tracking-wider text-aura-textSecondary mb-2">Expiry</label>
                            <input 
                                type="text" 
                                value={expiry}
                                onChange={handleExpiryChange}
                                placeholder="MM/YY"
                                maxLength={5}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-aura-primary/50 font-mono tracking-widest placeholder-white/20 transition-all"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs uppercase tracking-wider text-aura-textSecondary mb-2">CVC</label>
                            <input 
                                type="password" 
                                value={cvc}
                                onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0,4))}
                                placeholder="123"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-aura-primary/50 font-mono tracking-widest placeholder-white/20 transition-all"
                            />
                        </div>
                    </div>
                     <div>
                        <label className="block text-xs uppercase tracking-wider text-aura-textSecondary mb-2">ZIP Code</label>
                         <input 
                                type="text" 
                                value={zip}
                                onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0,5))}
                                placeholder="90210"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-aura-primary/50 font-mono tracking-widest placeholder-white/20 transition-all"
                        />
                    </div>
                </div>

                <div className="mt-2">
                    <NeonButton 
                        label={isProcessing ? "Verifying..." : "Save Securely"} 
                        fullWidth 
                        onClick={handleSave}
                        disabled={isProcessing}
                        icon={isProcessing ? <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" /> : undefined}
                    />
                </div>
                
                <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-white/30 uppercase tracking-widest">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Encrypted by Stripe
                </div>
            </GlassView>
        </div>
    );
};