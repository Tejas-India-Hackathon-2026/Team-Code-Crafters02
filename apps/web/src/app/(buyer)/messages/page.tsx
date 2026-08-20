'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useWebSockets } from '../../../hooks/useWebSockets';
import { createClient } from '../../../lib/supabaseClient';
import QuoteCard from '../../../components/chat/QuoteCard';
import {
    ShieldAlert,
    Send,
    MessageSquare,
    Video,
    CheckCircle2,
    XCircle,
    ShoppingBag,
    Tag,
    DollarSign,
    Sparkles,
    AlertCircle,
    ArrowLeft,
    FileText,
    Check,
    X,
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
    status: 'IN_DISCUSSION' | 'ORDER_FINALIZED' | 'CANCELLED';
    startedAt: string;
}

function MessagesContent() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [inputText, setInputText] = useState('');
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [activeDiscussion, setActiveDiscussion] = useState<ProductDiscussion | null>(null);
    const [blockedAttempt, setBlockedAttempt] = useState<ProductDiscussion | null>(null);
    const [showConflictModal, setShowConflictModal] = useState(false);

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
                setUserProfile(profile || { id: user.id, full_name: user.email?.split('@')[0] });

                const { data: convs } = await supabase.from('conversations').select('id').limit(1);
                if (convs && convs.length > 0) {
                    setActiveConversationId(convs[0].id);
                } else {
                    setActiveConversationId('conv-default-session');
                }
            }
        };
        initChat();
    }, []);

    // 2. Manage 1-Product-at-a-Time Discussion Constraint
    useEffect(() => {
        if (!paramArtisanId || !paramProductTitle) return;

        const storageKey = `active_discussion_${paramArtisanId}`;
        const existingRaw = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
        const existing: ProductDiscussion | null = existingRaw ? JSON.parse(existingRaw) : null;

        const incomingDiscussion: ProductDiscussion = {
            artisanId: paramArtisanId,
            artisanName: paramVendorName || 'Artisan Maker',
            reelId: paramReelId || 'reel-0',
            productTitle: paramProductTitle,
            price: paramPrice ? parseFloat(paramPrice) : 0,
            category: paramCategory || 'Handcrafted',
            videoUrl: paramVideoUrl || '',
            status: 'IN_DISCUSSION',
            startedAt: new Date().toISOString(),
        };

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
    }, [paramArtisanId, paramProductTitle]);

    const { messages, sendMessage, isConnected, warningBanner } = useWebSockets(activeConversationId);

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

    return (
        <main className="min-h-screen bg-[#FDFBF7] p-4 sm:p-6 flex flex-col items-center">
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

            <div className="w-full max-w-3xl bg-white border border-[#E8E2D9] rounded-2xl shadow-card overflow-hidden flex flex-col h-[780px]">
                {/* Chat Header */}
                <div className="p-4 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FDFBF7]">
                    <div className="flex items-center gap-3">
                        <Link href="/verification/feed" className="text-[#6B635B] hover:text-[#1E1B18]">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div className="w-8 h-8 rounded-lg bg-[#C85A32]/10 text-[#C85A32] flex items-center justify-center">
                            <MessageSquare className="w-4 h-4" />
                        </div>
                        <div>
                            <h1 className="font-display font-bold text-sm text-[#1E1B18]">
                                {activeDiscussion ? activeDiscussion.artisanName : 'Artisan Ingress-Sanitized Chat'}
                            </h1>
                            <p className="text-[10px] text-[#6B635B]">
                                Ingress filter active: Contact & off-platform links automatically masked
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-medium ${isConnected ? 'bg-[#EDF7ED] text-[#2E7D32]' : 'bg-[#FFF4E5] text-[#ED6C02]'}`}>
                            {isConnected ? '● Gateway Live' : 'Connecting...'}
                        </span>
                    </div>
                </div>

                {/* Pinned Active Product Discussion Card */}
                {activeDiscussion && (
                    <div className="bg-[#FDFBF7] border-b border-[#E8E2D9] p-3.5 px-4 animate-slide-up">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                {activeDiscussion.videoUrl ? (
                                    <div className="w-12 h-16 bg-black rounded-lg overflow-hidden shrink-0 border border-[#E8E2D9]">
                                        <video src={activeDiscussion.videoUrl} className="w-full h-full object-cover" muted playsInline />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 rounded-lg bg-[#C85A32]/10 text-[#C85A32] flex items-center justify-center shrink-0">
                                        <ShoppingBag className="w-5 h-5" />
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-[#6B635B] uppercase tracking-wider">
                                            Active Inquiry:
                                        </span>
                                        <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                                            activeDiscussion.status === 'ORDER_FINALIZED'
                                                ? 'bg-[#EDF7ED] text-[#2E7D32]'
                                                : activeDiscussion.status === 'CANCELLED'
                                                    ? 'bg-[#F3EFEA] text-[#6B635B]'
                                                    : 'bg-[#FFF4E5] text-[#ED6C02]'
                                        }`}>
                                            {activeDiscussion.status === 'ORDER_FINALIZED'
                                                ? '✓ Order Confirmed'
                                                : activeDiscussion.status === 'CANCELLED'
                                                    ? 'Closed'
                                                    : '● In Discussion'}
                                        </span>
                                    </div>
                                    <h3 className="text-xs font-bold text-[#1E1B18] truncate mt-0.5" title={activeDiscussion.productTitle}>
                                        {activeDiscussion.productTitle}
                                    </h3>
                                    <p className="text-[11px] text-[#C85A32] font-mono font-bold">
                                        {activeDiscussion.price ? `₹${activeDiscussion.price.toLocaleString('en-IN')}` : 'Price on Quote'}
                                    </p>
                                </div>
                            </div>

                            {/* Commands for Active Product */}
                            <div className="flex items-center gap-2 shrink-0">
                                {activeDiscussion.status === 'IN_DISCUSSION' ? (
                                    <>
                                        <button
                                            onClick={handleFinalizeOrder}
                                            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 font-semibold"
                                            title="Confirm this product and place order"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                            Finalize Order
                                        </button>
                                        <button
                                            onClick={handleCancelDiscussion}
                                            className="btn-ghost text-xs py-1.5 px-2.5 flex items-center gap-1 text-[#D32F2F] hover:bg-[#FDEDED]"
                                            title="Cancel discussion to allow other product inquiries"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                            Close
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setActiveDiscussion({
                                                ...activeDiscussion,
                                                status: 'IN_DISCUSSION',
                                            });
                                        }}
                                        className="btn-ghost text-xs py-1.5 px-3 text-[#C85A32]"
                                    >
                                        Reopen Discussion
                                    </button>
                                )}
                            </div>
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

                {/* Message Thread */}
                <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-white">
                    {messages.length === 0 && (
                        <div className="text-center py-8 text-xs text-[#6B635B]">
                            <p className="font-semibold text-[#1E1B18] mb-1">Start Your Direct Maker Conversation</p>
                            <p>Discuss dimensions, material customization, and delivery with the artisan below.</p>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div
                            key={msg.id || idx}
                            className={`p-3 rounded-2xl max-w-md text-xs leading-relaxed shadow-sm ${
                                msg.sender_id === userProfile?.id
                                    ? 'bg-[#C85A32] text-white self-end rounded-br-none'
                                    : 'bg-[#F3EFEA] text-[#1E1B18] self-start rounded-bl-none'
                            }`}
                        >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            {msg.is_flagged && (
                                <span className="text-[10px] block mt-1 font-mono text-[#F7EAD9]">
                                    ⚠️ Sanitized by Platform Gateway
                                </span>
                            )}
                        </div>
                    ))}

                    {/* In-Chat Interactive Milestone Quote Card */}
                    <div className="self-center w-full max-w-md my-2">
                        <QuoteCard
                            isVendor={userProfile?.is_vendor || false}
                            isVerified={userProfile?.vendor_verified || false}
                            onSendQuoteMessage={(quoteStr) => sendMessage(quoteStr)}
                            onAcceptAndFund={(gross, tds, net) => handleAcceptAndFundEscrow(gross, tds, net)}
                        />
                    </div>
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSend} className="p-3 border-t border-[#E8E2D9] bg-white flex gap-2">
                    <input
                        type="text"
                        placeholder="Type message to artisan (phone/email links automatically sanitized)..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="flex-1 h-11 px-3.5 border border-[#E8E2D9] rounded-xl text-xs outline-none focus:border-[#C85A32] focus:ring-2 focus:ring-[#C85A32]/10 transition-all"
                    />
                    <button
                        type="submit"
                        className="btn-primary px-5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                        <span>Send</span>
                        <Send className="w-3.5 h-3.5" />
                    </button>
                </form>
            </div>
        </main>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-xs text-[#6B635B]">Loading messages...</div>}>
            <MessagesContent />
        </Suspense>
    );
}