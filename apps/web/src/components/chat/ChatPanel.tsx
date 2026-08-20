'use client';

import React, { useState } from 'react';
import { Send, Sparkles, CheckCircle2, User } from 'lucide-react';
import QuoteCard from './QuoteCard';

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
}: ChatPanelProps): JSX.Element {
    const [input, setInput] = useState<string>('');

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        onSendMessage(input.trim());
        setInput('');
    };

    return (
        <div className="flex flex-col h-full bg-white border border-[#E8E2D9] rounded-3xl overflow-hidden shadow-card">
            {/* Chat Header */}
            <div className="p-4 bg-[#FAF8F5] border-b border-[#E8E2D9] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#C85A32] text-white flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
                        {artisanAvatar ? (
                            <img src={artisanAvatar} alt={artisanName} className="w-full h-full object-cover" />
                        ) : (
                            artisanName.charAt(0) || <User className="w-5 h-5" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h3 className="font-display font-bold text-sm text-[#1E1B18]">{artisanName}</h3>
                            {isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />}
                        </div>
                        <span className="text-[11px] text-[#2E7D32] font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" />
                            Verified Artisan Studio
                        </span>
                    </div>
                </div>
            </div>

            {/* Messages Scroll Area */}
            <div
                aria-label="Conversation messages feed"
                className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 bg-[#FDFBF7]"
            >
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex flex-col ${msg.sender === 'buyer' ? 'items-end' : 'items-start'}`}
                    >
                        <div
                            className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                                msg.sender === 'buyer'
                                    ? 'bg-[#C85A32] text-white rounded-tr-none'
                                    : 'bg-white text-[#1E1B18] border border-[#E8E2D9] rounded-tl-none shadow-xs'
                            }`}
                        >
                            <p>{msg.text}</p>
                            {msg.quoteProposal && (
                                <div className="mt-3">
                                    <QuoteCard
                                        productTitle={msg.quoteProposal.productTitle}
                                        price={msg.quoteProposal.price}
                                        category={msg.quoteProposal.category}
                                        status={msg.quoteProposal.status}
                                        onAccept={onAcceptQuote}
                                    />
                                </div>
                            )}
                        </div>
                        <span className="text-[10px] text-[#6B635B] mt-1 font-mono">{msg.timestamp}</span>
                    </div>
                ))}
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-[#E8E2D9] flex items-center gap-2">
                <input
                    id="chat-message-input"
                    type="text"
                    placeholder={`Message ${artisanName}...`}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 h-10 px-4 text-xs bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#C85A32]"
                />
                <button
                    type="submit"
                    disabled={!input.trim()}
                    className="btn-primary h-10 px-4 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                </button>
            </form>
        </div>
    );
}

export default ChatPanel;
