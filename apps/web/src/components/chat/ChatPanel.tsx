'use client';

import React, { useState } from 'react';
import { Send, Sparkles, CheckCircle2, User, ShieldCheck } from 'lucide-react';
import QuoteCard from './QuoteCard';
import { KintoBadge } from '../ui/kinto-card';

export interface ChatMessage {
    id: string;
    sender: 'buyer' | 'vendor';
    text: string;
    timestamp: string;
    quoteProposal?: {
        productTitle: string;
        price: number;
        category: string;
        tdsAmount: number;
        finalPayout: number;
        status: 'PROPOSED' | 'ACCEPTED' | 'FUNDED_ESCROW';
    };
}

export interface ChatPanelProps {
    artisanName: string;
    artisanAvatar?: string | null;
    isVerified?: boolean;
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    onAcceptQuote?: () => void;
}

/** ChatPanel renders real-time negotiation messages and formal maker quotes */
export function ChatPanel({
    artisanName,
    artisanAvatar,
    isVerified = true,
    messages,
    onSendMessage,
    onAcceptQuote,
}: ChatPanelProps): React.ReactNode {
    const [input, setInput] = useState<string>('');

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        onSendMessage(input.trim());
        setInput('');
    };

    return (
        <div className="flex flex-col h-full bg-white/95 backdrop-blur-xl border border-stone-200/90 rounded-3xl overflow-hidden shadow-xl">
            {/* Chat Header */}
            <div className="p-4 sm:p-5 bg-stone-50/90 backdrop-blur-md border-b border-stone-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#C85A32] text-white flex items-center justify-center font-bold text-sm overflow-hidden shrink-0 shadow-xs">
                        {artisanAvatar ? (
                            <img src={artisanAvatar} alt={artisanName} className="w-full h-full object-cover" />
                        ) : (
                            artisanName.charAt(0) || <User className="w-5 h-5" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h3 className="font-display font-bold text-sm text-stone-950">{artisanName}</h3>
                            {isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />}
                        </div>
                        <div className="mt-0.5">
                            <KintoBadge variant="success" dot={true}>
                                VERIFIED MAKER STUDIO
                            </KintoBadge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages Scroll Area */}
            <div
                aria-label="Conversation messages feed"
                className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 bg-[#FAF7F2]/60"
            >
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex flex-col ${msg.sender === 'buyer' ? 'items-end' : 'items-start'}`}
                    >
                        <div
                            className={`max-w-md p-4 rounded-2xl text-xs leading-relaxed transition-all shadow-xs ${
                                msg.sender === 'buyer'
                                    ? 'bg-[#C85A32] text-white rounded-tr-xs shadow-stone-900/5'
                                    : 'bg-white text-stone-900 border border-stone-200/90 rounded-tl-xs shadow-stone-900/5'
                            }`}
                        >
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                            {msg.quoteProposal && (
                                <div className="mt-3">
                                    <QuoteCard
                                        title={msg.quoteProposal.productTitle}
                                        grossPrice={msg.quoteProposal.price}
                                        isVerified={isVerified}
                                        onAcceptAndFund={onAcceptQuote ? () => onAcceptQuote() : undefined}
                                    />
                                </div>
                            )}
                        </div>
                        <span className="text-[10px] text-stone-400 mt-1 font-mono">{msg.timestamp}</span>
                    </div>
                ))}
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSend} className="p-3.5 bg-white border-t border-stone-200/80 flex items-center gap-2.5">
                <input
                    id="chat-message-input"
                    type="text"
                    placeholder={`Message ${artisanName}...`}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 h-11 px-4 text-xs bg-stone-50/80 border border-stone-200/90 rounded-full outline-none focus:border-[#C85A32] transition-colors font-mono"
                />
                <button
                    type="submit"
                    disabled={!input.trim()}
                    className="btn-primary h-11 px-5 text-xs font-semibold rounded-full flex items-center gap-1.5 disabled:opacity-50 font-mono shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                </button>
            </form>
        </div>
    );
}

export default ChatPanel;
