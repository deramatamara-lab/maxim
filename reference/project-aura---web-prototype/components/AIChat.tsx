import React, { useState, useRef, useEffect } from 'react';
import { GlassView } from './ui/GlassView';
import { generateConciergeResponse } from '../services/geminiService';
import { ChatMessage } from '../types';

export const AIChat: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', sender: 'ai', text: 'Good evening. Where are we heading tonight?', timestamp: Date.now() }
    ]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: input, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsThinking(true);

        const responseText = await generateConciergeResponse(input);
        
        setIsThinking(false);
        const aiMsg: ChatMessage = { id: (Date.now()+1).toString(), sender: 'ai', text: responseText, timestamp: Date.now() };
        setMessages(prev => [...prev, aiMsg]);
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-aura-surface border border-aura-primary/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,245,255,0.2)] hover:scale-105 transition-transform"
            >
                <div className="w-2 h-2 rounded-full bg-aura-primary animate-pulse" />
            </button>
        );
    }

    return (
        <div className="absolute top-6 right-6 z-50 w-80 h-96 animate-[fadeIn_0.3s_ease-out]">
            <GlassView className="w-full h-full flex flex-col p-4">
                <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-aura-primary" />
                        <span className="font-medium text-sm tracking-wider">AURA CONCIERGE</span>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-xl text-sm ${
                                msg.sender === 'user' 
                                    ? 'bg-aura-primary/20 text-aura-primary border border-aura-primary/20 rounded-tr-none' 
                                    : 'bg-white/5 text-white/90 border border-white/5 rounded-tl-none'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isThinking && (
                        <div className="flex justify-start">
                            <div className="bg-white/5 p-3 rounded-xl rounded-tl-none flex gap-1">
                                <div className="w-1.5 h-1.5 bg-aura-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 bg-aura-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-1.5 h-1.5 bg-aura-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="relative">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask Aura..."
                        className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-aura-primary/50 transition-colors"
                    />
                </div>
            </GlassView>
        </div>
    );
};