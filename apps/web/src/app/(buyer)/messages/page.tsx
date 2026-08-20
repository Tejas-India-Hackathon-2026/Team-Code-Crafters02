'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useWebSockets } from '../../../hooks/useWebSockets';
import { createClient } from '../../../lib/supabaseClient';
import QuoteCard from '../../../components/chat/QuoteCard';
import {
    ShieldAlert,
    Send,
    MessageSquare,
    ShoppingBag,
    CheckCircle2,
    ArrowLeft,
    Shield,
    Sparkles,
    Check,
    X,
    AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

interface ProductDiscussion {
    artisanId: string;
    artisanName: string;
    reelId: string;
    productTitle: string;
    price: number;
    category: string;
    videoUrl?: string;
    avatarUrl?: string;
    status: 'IN_DISCUSSION' | 'ORDER_FINALIZED' | 'CANCELLED';
    startedAt: string;
}

interface ConversationItem {
    id: string;
    artisanId: string;
    artisanName: string;
    craftCategory: string;
    avatarUrl: string;
    productTitle: string;
    price: number;
    unread: boolean;
    lastMessage: string;
    lastTimestamp: string;
}

const DEFAULT_CONVERSATIONS: ConversationItem[] = [
    {
        id: 'conv-kavita',
        artisanId: 'artisan-kavita-01',
        artisanName: 'Kavita Devi (Master Weaver)',
        craftCategory: 'Banarasi Handloom Silk',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        productTitle: 'Custom Bridal Katan Silk Saree in Crimson',
        price: 24500,
        unread: true,
        lastMessage: 'I have prepared the formal milestone quote wi...',
        lastTimestamp: '2h ago',
    },
    {
        id: 'conv-rajesh',
        artisanId: 'artisan-rajesh-02',
        artisanName: 'Rajesh Prajapati (Blue Pottery)',
        craftCategory: 'Jaipur Blue Pottery',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        productTitle: 'Handcrafted Egyptian Cobalt Dinner Set (24 Pcs)',
        price: 14800,
        unread: false,
        lastMessage: 'Yes, the cobalt glaze will be 100% food and mic...',
        lastTimestamp: '1d ago',
    },
];

function MessagesContent() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [inputText, setInputText] = useState('');
    const [activeConversationId, setActiveConversationId] = useState<string>('conv-kavita');
    const [userProfile, setUserProfile] = useState<any>(null);
    const [activeDiscussion, setActiveDiscussion] = useState<ProductDiscussion | null>(null);
    const [blockedAttempt, setBlockedAttempt] = useState<ProductDiscussion | null>(null);
    const [showConflictModal, setShowConflictModal] = useState(false);
    const [conversationsList, setConversationsList] = useState<ConversationItem[]>(DEFAULT_CONVERSATIONS);

    // 1. Ingest URL params for product inquiry
    const paramArtisanId = searchParams.get('artisanId');
    const paramReelId = searchParams.get('reelId');
    const paramProductTitle = searchParams.get('productTitle');
    const paramPrice = searchParams.get('price');
    const paramCategory = searchParams.get('category');
    const paramVideoUrl = searchParams.get('videoUrl');
    const paramVendorName = searchParams.get('vendorName');

    useEffect(() => {
        const initChat = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
                setUserProfile(profile || { id: user.id, full_name: user.email?.split('@')[0], is_vendor: false });

                const { data: convs } = await supabase.from('conversations').select('id').limit(1);
                if (convs && convs.length > 0) {
                    setActiveConversationId(convs[0].id);
                }
            }
        };
        initChat();
    }, []);

    // 2. Manage 1-Product-at-a-Time Discussion Constraint & Conversation List
    useEffect(() => {
        if (!paramArtisanId || !paramProductTitle) {
            // Default active discussion to first item
            if (!activeDiscussion && conversationsList.length > 0) {
                const defaultItem = conversationsList[0];
                setActiveDiscussion({
                    artisanId: defaultItem.artisanId,
                    artisanName: defaultItem.artisanName,
                    reelId: 'reel-default',
                    productTitle: defaultItem.productTitle,
                    price: defaultItem.price,
                    category: defaultItem.craftCategory,
                    avatarUrl: defaultItem.avatarUrl,
                    status: 'IN_DISCUSSION',
                    startedAt: new Date().toISOString(),
                });
            }
            return;
        }

        const storageKey = `active_discussion_${paramArtisanId}`;
        const existingRaw = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
        const existing: ProductDiscussion | null = existingRaw ? JSON.parse(existingRaw) : null;

        const incomingDiscussion: ProductDiscussion = {
            artisanId: paramArtisanId,
            artisanName: paramVendorName || 'Verified Artisan Maker',
            reelId: paramReelId || 'reel-0',
            productTitle: paramProductTitle,
            price: paramPrice ? parseFloat(paramPrice) : 2499,
            category: paramCategory || 'Handcrafted Heritage',
            videoUrl: paramVideoUrl || '',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            status: 'IN_DISCUSSION',
            startedAt: new Date().toISOString(),
        };

        const targetConvId = `conv-${paramArtisanId}`;
        setActiveConversationId(targetConvId);

        // Add or update in conversations list
        setConversationsList((prev) => {
            const exists = prev.find((c) => c.artisanId === paramArtisanId || c.id === targetConvId);
            if (exists) {
                return prev.map((c) =>
                    c.id === exists.id
                        ? { ...c, productTitle: paramProductTitle, price: incomingDiscussion.price }
                        : c
                );
            }
            const newItem: ConversationItem = {
                id: targetConvId,
                artisanId: paramArtisanId,
                artisanName: incomingDiscussion.artisanName,
                craftCategory: incomingDiscussion.category,
                avatarUrl: incomingDiscussion.avatarUrl!,
                productTitle: paramProductTitle,
                price: incomingDiscussion.price,
                unread: true,
                lastMessage: `Inquiry for ${paramProductTitle}`,
                lastTimestamp: 'Just now',
            };
            return [newItem, ...prev];
        });

        // If an active discussion already exists for this artisan on a DIFFERENT product
        if (existing && existing.status === 'IN_DISCUSSION' && existing.productTitle !== incomingDiscussion.productTitle) {
            setBlockedAttempt(incomingDiscussion);
            setActiveDiscussion(existing);
            setShowConflictModal(true);
        } else {
            // Set as active discussion
            const current = existing && existing.status === 'IN_DISCUSSION' ? existing : incomingDiscussion;
            setActiveDiscussion(current);
            if (typeof window !== 'undefined') {
                localStorage.setItem(storageKey, JSON.stringify(current));
            }

            // Pre-populate default inquiry if input is empty
            if (!inputText) {
                setInputText(
                    `Hi! I am interested in ordering this verified handcrafted product: "${current.productTitle}"${current.price ? ` (₹${current.price.toLocaleString('en-IN')})` : ''}. Can you please confirm customization options and delivery schedule?`
                );
            }
        }
    }, [paramArtisanId, paramProductTitle, paramPrice, paramCategory, paramVendorName]);

    const { messages, sendMessage, isConnected, warningBanner } = useWebSockets(activeConversationId);

    // Scroll to bottom on message updates
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;
        sendMessage(inputText);
        setInputText('');
    };

    // Command: Finalize & Place Order
    const handleFinalizeOrder = () => {
        if (!activeDiscussion) return;

        const updated: ProductDiscussion = {
            ...activeDiscussion,
            status: 'ORDER_FINALIZED',
        };
        setActiveDiscussion(updated);
        if (typeof window !== 'undefined') {
            localStorage.setItem(`active_discussion_${updated.artisanId}`, JSON.stringify(updated));
        }

        sendMessage(
            `[COMMAND: ORDER_FINALIZED] ✓ I would like to finalize and confirm my order for "${updated.productTitle}" at ₹${updated.price.toLocaleString('en-IN')}. Please generate the TDS-compliant milestone invoice.`
        );
    };

    // Command: Cancel Discussion & Unlock New Product
    const handleCancelDiscussion = () => {
        if (!activeDiscussion) return;

        const updated: ProductDiscussion = {
            ...activeDiscussion,
            status: 'CANCELLED',
        };
        setActiveDiscussion(updated);
        if (typeof window !== 'undefined') {
            localStorage.setItem(`active_discussion_${updated.artisanId}`, JSON.stringify(updated));
        }

        sendMessage(
            `[COMMAND: DISCUSSION_CLOSED] ✕ I have closed the inquiry for "${updated.productTitle}". Ready to start a new discussion.`
        );
    };

    // Switch to new product after resolving conflict
    const handleSwitchToNewProduct = () => {
        if (!blockedAttempt) return;
        setActiveDiscussion(blockedAttempt);
        if (typeof window !== 'undefined') {
            localStorage.setItem(`active_discussion_${blockedAttempt.artisanId}`, JSON.stringify(blockedAttempt));
        }
        setShowConflictModal(false);
        setBlockedAttempt(null);
        setInputText(
            `Hi! I have started a new inquiry for "${blockedAttempt.productTitle}" (₹${blockedAttempt.price.toLocaleString('en-IN')}). Could you share the maker details and dispatch timeline?`
        );
    };

    const handleAcceptAndFundEscrow = async (grossAmount: number, tdsAmount: number, netAmount: number) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const res = await fetch('/api/escrow/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    buyerId: user?.id,
                    vendorId: activeDiscussion?.artisanId || null,
                    grossAmount,
                    productTitle: activeDiscussion?.productTitle || 'Handcrafted Artisan Item',
                    status: 'HELD_IN_ESCROW',
                }),
            });

            const data = await res.json();
            if (data.orderId) {
                sendMessage(
                    `[ESCROW_PAYMENT_CONFIRMED] ✓ Milestone accepted! ₹${grossAmount.toLocaleString('en-IN')} locked in escrow (1% TDS: ₹${tdsAmount}). Order #${data.orderId.slice(0, 8)} is now HELD_IN_ESCROW.`
                );
                router.push(`/orders/${data.orderId}`);
            }
        } catch (err: any) {
            console.error('Escrow funding error:', err);
        }
    };

    const handleSelectConversation = (conv: ConversationItem) => {
        setActiveConversationId(conv.id);
        setActiveDiscussion({
            artisanId: conv.artisanId,
            artisanName: conv.artisanName,
            reelId: 'reel-0',
            productTitle: conv.productTitle,
            price: conv.price,
            category: conv.craftCategory,
            avatarUrl: conv.avatarUrl,
            status: 'IN_DISCUSSION',
            startedAt: new Date().toISOString(),
        });
        setConversationsList((prev) =>
            prev.map((c) => (c.id === conv.id ? { ...c, unread: false } : c))
        );
    };

    return (
        <main className="min-h-screen bg-[#F7F4EE] px-4 py-6 sm:px-6 lg:px-8 flex flex-col justify-between">
            {/* Conflict Alert Modal if buyer tries discussing 2 products simultaneously with 1 artisan */}
            {showConflictModal && blockedAttempt && activeDiscussion && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="card p-6 bg-white max-w-md w-full shadow-modal border border-[#E8E2D9]">
                        <div className="w-12 h-12 rounded-full bg-[#FFF4E5] text-[#ED6C02] flex items-center justify-center mx-auto mb-3">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h2 className="text-base font-bold text-[#1E1B18] font-display text-center mb-2">
                            Active Product Inquiry in Progress
                        </h2>
                        <p className="text-xs text-[#6B635B] text-center mb-4 leading-relaxed">
                            You are currently in an active discussion with <strong className="text-[#1E1B18]">{activeDiscussion.artisanName}</strong> for:
                            <br />
                            <span className="font-semibold text-[#C85A32] inline-block mt-1">"{activeDiscussion.productTitle}"</span>
                            <br />
                            <span className="text-[11px] block mt-1 text-[#6B635B]">
                                Platform Rule: You can only discuss <strong>1 product at a time</strong> with an artisan until you either finalize the order or close the discussion.
                            </span>
                        </p>

                        <div className="flex flex-col gap-2.5">
                            <button
                                onClick={() => setShowConflictModal(false)}
                                className="btn-primary text-xs py-2.5 w-full font-semibold"
                            >
                                Continue Discussing "{activeDiscussion.productTitle}"
                            </button>
                            <button
                                onClick={handleSwitchToNewProduct}
                                className="btn-ghost text-xs py-2.5 w-full font-semibold text-[#D32F2F] hover:bg-[#FDEDED]"
                            >
                                Close Current & Switch to "{blockedAttempt.productTitle}"
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Elevated Two-Column Container */}
            <div className="w-full max-w-6xl mx-auto bg-white border border-[#E8E2D9] rounded-3xl shadow-card overflow-hidden flex flex-col md:flex-row h-[780px]">
                
                {/* ─── LEFT SIDEBAR: CONVERSATIONS ─────────────────────────────── */}
                <div className="w-full md:w-80 lg:w-88 border-r border-[#E8E2D9] bg-[#FAF8F5] flex flex-col shrink-0">
                    {/* Conversations Header */}
                    <div className="p-5 border-b border-[#E8E2D9]">
                        <h2 className="text-xl font-bold font-display text-[#1E1B18]">
                            Conversations
                        </h2>
                        <p className="text-xs text-[#6B635B] mt-0.5">
                            In-App Secure Chat & Proposals
                        </p>
                    </div>

                    {/* Conversation List */}
                    <div className="flex-1 overflow-y-auto divide-y divide-[#F3EFEA]">
                        {conversationsList.map((conv) => {
                            const isSelected =
                                activeDiscussion?.artisanId === conv.artisanId ||
                                activeConversationId === conv.id;

                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => handleSelectConversation(conv)}
                                    className={`w-full p-4 text-left flex items-start gap-3 transition-all cursor-pointer ${
                                        isSelected
                                            ? 'bg-white shadow-xs border-l-4 border-l-[#C85A32]'
                                            : 'hover:bg-[#F3EFEA]/70'
                                    }`}
                                >
                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-[#C85A32] overflow-hidden shrink-0 border border-[#E8E2D9]">
                                        <img
                                            src={conv.avatarUrl}
                                            alt={conv.artisanName}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Conversation Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1 mb-0.5">
                                            <h3 className="font-semibold text-xs text-[#1E1B18] truncate">
                                                {conv.artisanName}
                                            </h3>
                                            {conv.unread && (
                                                <div className="w-2 h-2 rounded-full bg-[#C85A32] shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-[11px] text-[#C85A32] font-medium truncate mb-1">
                                            {conv.craftCategory}
                                        </p>
                                        <p className="text-[11px] text-[#6B635B] truncate leading-tight">
                                            {conv.lastMessage}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ─── RIGHT MAIN CHAT AREA ────────────────────────────────────── */}
                <div className="flex-1 flex flex-col bg-white min-w-0">
                    
                    {/* Chat Header */}
                    <div className="p-4 sm:px-6 border-b border-[#E8E2D9] flex items-center justify-between bg-white shrink-0">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-[#C85A32] overflow-hidden shrink-0 border border-[#E8E2D9]">
                                <img
                                    src={activeDiscussion?.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'}
                                    alt={activeDiscussion?.artisanName || 'Artisan'}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="min-w-0">
                                <h2 className="font-display font-bold text-sm sm:text-base text-[#1E1B18] truncate">
                                    {activeDiscussion?.artisanName || 'Verified Master Artisan'}
                                </h2>
                                <p className="text-xs text-[#6B635B] truncate mt-0.5 font-medium">
                                    {activeDiscussion?.productTitle || 'Custom Handcrafted Inquiry'}
                                </p>
                            </div>
                        </div>

                        {/* Verified Maker Badge & Live Status */}
                        <div className="flex items-center gap-2.5 shrink-0">
                            <span className={`hidden sm:inline-flex text-[10px] px-2.5 py-0.5 rounded-full font-mono font-medium ${isConnected ? 'bg-[#EDF7ED] text-[#2E7D32]' : 'bg-[#FFF4E5] text-[#ED6C02]'}`}>
                                {isConnected ? '● Gateway Live' : 'Connecting...'}
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border border-[#2E7D32]/30 bg-[#EDF7ED] text-[#2E7D32]">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>VERIFIED MAKER</span>
                            </span>
                        </div>
                    </div>

                    {/* Active Product Discussion Banner (when in active inquiry) */}
                    {activeDiscussion && activeDiscussion.status === 'IN_DISCUSSION' && (
                        <div className="bg-[#FAF8F5] border-b border-[#E8E2D9] px-4 py-2.5 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[10px] font-bold text-[#6B635B] uppercase tracking-wider shrink-0">
                                    Active Inquiry:
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF4E5] text-[#ED6C02] shrink-0">
                                    ● In Discussion
                                </span>
                                <span className="text-xs font-bold text-[#1E1B18] truncate">
                                    {activeDiscussion.productTitle}
                                </span>
                                <span className="text-xs font-bold text-[#C85A32] font-mono shrink-0">
                                    ₹{activeDiscussion.price?.toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                    onClick={handleFinalizeOrder}
                                    className="btn-primary text-[11px] py-1 px-2.5 flex items-center gap-1 font-semibold"
                                    title="Finalize order and generate quote"
                                >
                                    <Check className="w-3 h-3" />
                                    Finalize Order
                                </button>
                                <button
                                    onClick={handleCancelDiscussion}
                                    className="btn-ghost text-[11px] py-1 px-2 text-[#D32F2F] hover:bg-[#FDEDED]"
                                    title="Close inquiry"
                                >
                                    <X className="w-3 h-3" />
                                    Close
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Real-time Ingress Interceptor Alert Banner */}
                    {warningBanner && (
                        <div className="bg-[#FDEDED] border-b border-[#F5C2C7] p-3 text-[#D32F2F] text-xs flex items-center gap-2 animate-bounce">
                            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                            <span>{warningBanner}</span>
                        </div>
                    )}

                    {/* Chat Messages Stream */}
                    <div className="flex-1 p-5 sm:p-6 overflow-y-auto flex flex-col gap-4 bg-[#FDFBF7]/40">
                        {messages.length === 0 && (
                            <div className="text-center py-6 text-xs text-[#6B635B]">
                                <p className="font-semibold text-[#1E1B18] mb-1">Secure Maker Conversation</p>
                                <p>Discuss dimensions, material customization, and delivery with the artisan below.</p>
                            </div>
                        )}

                        {messages.map((msg, idx) => {
                            const isBuyer = msg.sender_id === userProfile?.id || msg.sender_id === 'user' || msg.sender_id === 'buyer';

                            return (
                                <div
                                    key={msg.id || idx}
                                    className={`flex flex-col ${isBuyer ? 'items-end' : 'items-start'} max-w-2xl`}
                                >
                                    <div
                                        className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                                            isBuyer
                                                ? 'bg-[#C85A32] text-white rounded-tr-xs'
                                                : 'bg-white border border-[#E8E2D9] text-[#1E1B18] rounded-tl-xs'
                                        }`}
                                    >
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                        {msg.is_flagged && (
                                            <span className="text-[10px] block mt-1 font-mono text-[#F7EAD9]">
                                                ⚠️ Sanitized by Platform Gateway
                                            </span>
                                        )}
                                        <div
                                            className={`text-[10px] mt-2 text-right ${
                                                isBuyer ? 'text-white/70' : 'text-[#6B635B]'
                                            }`}
                                        >
                                            {msg.created_at
                                                ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : 'Just now'}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* In-Chat Interactive Formal Maker Quote Card */}
                        <div className="w-full max-w-lg my-2">
                            <QuoteCard
                                title={activeDiscussion?.productTitle || 'Custom Bridal Katan Silk Saree (6.3m)'}
                                grossPrice={activeDiscussion?.price || 24500}
                                isVendor={userProfile?.is_vendor || false}
                                isVerified={userProfile?.vendor_verified || false}
                                onSendQuoteMessage={(quoteStr) => sendMessage(quoteStr)}
                                onAcceptAndFund={(gross, tds, net) => handleAcceptAndFundEscrow(gross, tds, net)}
                            />
                        </div>

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Bar */}
                    <div className="p-4 border-t border-[#E8E2D9] bg-white">
                        <form onSubmit={handleSend} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Discuss dimensions, colors, or milestone delivery..."
                                className="flex-1 h-12 px-4 border border-[#E8E2D9] rounded-2xl text-xs sm:text-sm outline-none focus:border-[#C85A32] focus:ring-2 focus:ring-[#C85A32]/10 bg-[#FAF8F5] transition-all placeholder:text-[#6B635B]"
                            />
                            <button
                                type="submit"
                                className="w-12 h-12 rounded-2xl bg-[#C85A32] hover:bg-[#B04B26] text-white flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
                                title="Send Message"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Anti-Circumvention Shield Label at Bottom Left */}
            <div className="max-w-6xl mx-auto w-full mt-3 flex items-center gap-1.5 text-xs text-[#2C4A3E] font-medium px-2">
                <Shield className="w-4 h-4 text-[#2E7D32]" />
                <span>Anti-Circumvention Shield Active</span>
            </div>
        </main>
    );
}

export default function MessagesPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#F7F4EE] flex items-center justify-center text-xs text-[#6B635B]">
                    Loading conversations...
                </div>
            }
        >
            <MessagesContent />
        </Suspense>
    );
}