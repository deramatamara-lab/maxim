
import React, { useState, useRef, useEffect } from 'react';
import { GlassView } from './ui/GlassView';
import { ChatMessage, Driver } from '../types';

interface DriverChatProps {
    driver: Driver;
    onClose: () => void;
}

export const DriverChat: React.FC<DriverChatProps> = ({ driver, onClose }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', sender: 'driver', text: `Hi, I'm ${driver.name}. I'm on my way!`, timestamp: Date.now() }
    ]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: input, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        // Simulate driver reply
        setTimeout(() => {
            const driverMsg: ChatMessage = { 
                id: (Date.now()+1).toString(), 
                sender: 'driver', 
                text: "Got it, see you soon.", 
                timestamp: Date.now() 
            };
            setMessages(prev => [...prev, driverMsg]);
        }, 2000);
    };

    return (
        <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s]">
            <GlassView className="w-full max-w-md h-[500px] flex flex-col p-0 overflow-hidden shadow-2xl border-aura-primary/30">
                {/* Header */}
                <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-aura-secondary/20 flex items-center justify-center border border-aura-secondary/50">
                            <span className="text-lg">👨‍✈️</span>
                        </div>
                        <div>
                            <div className="font-semibold text-white">{driver.name}</div>
                            <div className="text-xs text-aura-secondary flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-aura-secondary animate-pulse"/>
                                Online
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                                msg.sender === 'user' 
                                    ? 'bg-aura-primary text-black font-medium rounded-br-none' 
                                    : 'bg-[#222] border border-white/10 text-gray-200 rounded-bl-none'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/10 bg-[#111]">
                    <div className="relative flex items-center gap-2">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Message driver..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-full py-3 px-5 text-sm focus:outline-none focus:border-aura-primary/50 text-white placeholder-white/30"
                        />
                        <button 
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="p-3 bg-aura-primary rounded-full text-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-aura-primaryAccent transition-colors"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        </button>
                    </div>
                </div>
            </GlassView>
        </div>
    );
};
