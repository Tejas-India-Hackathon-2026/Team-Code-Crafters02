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
    projectId?: string;
    proposalText?: string;
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
    projectId?: string;
    proposalText?: string;
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
    const paramArtisanId = searchParams.get('artisanId') || searchParams.get('partner') || searchParams.get('vendorId') || searchParams.get('buyerId');
    const paramReelId = searchParams.get('reelId');
    const paramProductTitle = searchParams.get('productTitle');
    const paramPrice = searchParams.get('price');
    const paramCategory = searchParams.get('category');
    const paramVideoUrl = searchParams.get('videoUrl');
    const paramVendorName = searchParams.get('vendorName');
    const paramProjectId = searchParams.get('projectId');
    const paramProposalText = searchParams.get('proposalText');

    useEffect(() => {
        const initChat = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
                const currentProf = profile || { id: user.id, full_name: user.email?.split('@')[0], is_vendor: false };
                setUserProfile(currentProf);

                const isCurrentVendor = !!currentProf.is_vendor || currentProf.full_name?.toLowerCase().includes('raja') || user.email?.toLowerCase().includes('raja');

                // Load registered conversations from shared registry
                const rawRegistry = typeof window !== 'undefined' ? localStorage.getItem('karigar_conversations_registry') : null;
                let registered: ConversationItem[] = [];

                if (rawRegistry) {
                    try {
                        const parsed = JSON.parse(rawRegistry);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            registered = parsed.map((item: any) => {
                                if (isCurrentVendor) {
                                    return {
                                        ...item,
                                        artisanName: item.buyerName || 'Rishav Kumar',
                                        craftCategory: `Buyer Inquiry: ${item.productTitle || 'case'}`,
                                    };
                                }
                                return item;
                            });
                        }
                    } catch (e) {}
                }

                // If none in registry yet, seed initial conversation
                if (registered.length === 0) {
                    const defaultInquiry: ConversationItem = {
                        id: 'conv-case-raja',
                        artisanId: user.id,
                        artisanName: isCurrentVendor ? 'Rishav Kumar (Buyer)' : 'Raja (Woodworking Artisan)',
                        craftCategory: isCurrentVendor ? 'Inquiry for "case"' : 'woodworking',
                        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                        productTitle: 'case',
                        price: 300,
                        unread: true,
                        lastMessage: 'Hi! I am interested in ordering this verified handcrafted product: "case" (₹300).',
                        lastTimestamp: 'Just now',
                    };
                    registered.push(defaultInquiry);
                }

                setConversationsList((prev) => {
                    const regIds = new Set(registered.map((r: any) => r.id));
                    const filtered = prev.filter((p) => !regIds.has(p.id));
                    return [...registered, ...filtered];
                });

                // Auto-select latest active conversation if no URL param
                if (!paramArtisanId && registered.length > 0) {
                    const activeItem = registered[0];
                    setActiveConversationId(activeItem.id);
                    const isCommission = activeItem.craftCategory?.toLowerCase().includes('commission') || !!activeItem.projectId;
                    setActiveDiscussion({
                        artisanId: activeItem.artisanId,
                        artisanName: activeItem.artisanName,
                        reelId: 'reel-0',
                        productTitle: activeItem.productTitle,
                        price: activeItem.price,
                        category: isCommission ? 'custom_commission' : activeItem.craftCategory,
                        avatarUrl: activeItem.avatarUrl,
                        status: 'IN_DISCUSSION',
                        startedAt: new Date().toISOString(),
                        projectId: activeItem.projectId,
                        proposalText: activeItem.proposalText,
                    });
                }
            }
        };
        initChat();
    }, [paramArtisanId]);

    // 2. Manage 1-Product-at-a-Time Discussion Constraint & Conversation List
    useEffect(() => {
        if (!paramArtisanId || !paramProductTitle) {
            // Default active discussion to first item if not set
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
            projectId: paramProjectId || undefined,
            proposalText: paramProposalText || undefined,
        };

        const targetConvId = paramProjectId ? `conv-${paramArtisanId}-${paramProjectId}` : `conv-${paramArtisanId}`;
        setActiveConversationId(targetConvId);

        const newItem: ConversationItem = {
            id: targetConvId,
            artisanId: paramArtisanId,
            artisanName: incomingDiscussion.artisanName,
            craftCategory: incomingDiscussion.category === 'custom_commission' ? `Commission: ${paramProductTitle}` : incomingDiscussion.category,
            avatarUrl: incomingDiscussion.avatarUrl!,
            productTitle: paramProductTitle,
            price: incomingDiscussion.price,
            unread: false,
            lastMessage: paramProposalText ? `Proposal note: "${paramProposalText}"` : `Inquiry for ${paramProductTitle}`,
            lastTimestamp: 'Just now',
            projectId: paramProjectId || undefined,
            proposalText: paramProposalText || undefined,
        };

        // Add or update in conversations list and persistent registry
        setConversationsList((prev) => {
            const exists = prev.find((c) => c.id === targetConvId || (paramCategory === 'custom_commission' && c.projectId && c.projectId === paramProjectId));
            const updated = exists
                ? prev.map((c) =>
                      c.id === exists.id
                          ? { ...c, productTitle: paramProductTitle, price: incomingDiscussion.price, lastMessage: newItem.lastMessage }
                          : c
                  )
                : [newItem, ...prev.filter((c) => c.id !== targetConvId)];

            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem('karigar_conversations_registry', JSON.stringify(updated.slice(0, 10)));
                } catch (e) {}
            }
            return updated;
        });

        // If category is custom_commission OR no conflict exists, activate immediately!
        if (paramCategory === 'custom_commission' || !existing || existing.status !== 'IN_DISCUSSION' || existing.productTitle === incomingDiscussion.productTitle) {
            setActiveDiscussion(incomingDiscussion);
            setShowConflictModal(false);
            setBlockedAttempt(null);
            if (typeof window !== 'undefined') {
                localStorage.setItem(storageKey, JSON.stringify(incomingDiscussion));
            }

            if (!inputText) {
                if (paramCategory === 'custom_commission') {
                    setInputText(
                        `Hi! I reviewed your verified custom commission proposal for "${incomingDiscussion.productTitle}" (₹${incomingDiscussion.price.toLocaleString('en-IN')}). Can we discuss milestones and final delivery details?`
                    );
                } else {
                    setInputText(
                        `Hi! I am interested in ordering this verified handcrafted product: "${incomingDiscussion.productTitle}"${incomingDiscussion.price ? ` (₹${incomingDiscussion.price.toLocaleString('en-IN')})` : ''}. Can you please confirm customization options and delivery schedule?`
                    );
                }
            }
        } else {
            // Standard reel inquiry conflict
            setBlockedAttempt(incomingDiscussion);
            setActiveDiscussion(existing);
            setShowConflictModal(true);
        }
    }, [paramArtisanId, paramProductTitle, paramPrice, paramCategory, paramVendorName, paramProjectId, paramProposalText]);

    const { messages, sendMessage, isConnected, warningBanner } = useWebSockets(activeConversationId);

    // Scroll to bottom on message updates
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Synchronize order finalization across tabs
    useEffect(() => {
        const syncOrderFinalized = () => {
            if (activeDiscussion?.artisanId) {
                const stored = localStorage.getItem(`active_discussion_${activeDiscussion.artisanId}`);
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        if (parsed.status === 'ORDER_FINALIZED' && activeDiscussion.status !== 'ORDER_FINALIZED') {
                            setActiveDiscussion(parsed);
                        }
                    } catch (e) {}
                }
            }
            try {
                const rawReg = localStorage.getItem('karigar_conversations_registry');
                if (rawReg) {
                    setConversationsList(JSON.parse(rawReg));
                }
            } catch (e) {}
        };

        window.addEventListener('storage', syncOrderFinalized);
        window.addEventListener('karigar_order_finalized', syncOrderFinalized);
        return () => {
            window.removeEventListener('storage', syncOrderFinalized);
            window.removeEventListener('karigar_order_finalized', syncOrderFinalized);
        };
    }, [activeDiscussion]);

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

        const projectRef = updated.projectId ? ` [PROJECT_ID: ${updated.projectId}]` : '';
        sendMessage(
            `[COMMAND: ORDER_FINALIZED] ✓ I would like to finalize and confirm my order for "${updated.productTitle}" at ₹${updated.price.toLocaleString('en-IN')}.${projectRef} Please generate the TDS-compliant milestone invoice.`
        );
    };

    // Command: Cancel Discussion & Unlock New Product
    const handleCancelDiscussion = () => {
        if (!activeDiscussion) return;

        const artisanId = activeDiscussion.artisanId;
        const currentTitle = activeDiscussion.productTitle;
        const currentConvId = activeConversationId;

        if (typeof window !== 'undefined') {
            localStorage.removeItem(`active_discussion_${artisanId}`);
            try {
                const currentRegistry = JSON.parse(localStorage.getItem('karigar_conversations_registry') || '[]');
                const filtered = Array.isArray(currentRegistry)
                    ? currentRegistry.filter((c: any) => c.id !== currentConvId && c.productTitle !== currentTitle)
                    : [];
                localStorage.setItem('karigar_conversations_registry', JSON.stringify(filtered));
                setConversationsList(filtered.length > 0 ? filtered : DEFAULT_CONVERSATIONS);
                if (filtered.length > 0) {
                    handleSelectConversation(filtered[0]);
                } else {
                    setActiveDiscussion(null);
                }
            } catch (e) {}
        }

        sendMessage(
            `[COMMAND: DISCUSSION_CLOSED] ✕ I have closed the inquiry for "${currentTitle}". Ready to start a new discussion.`
        );
    };

    // Switch to new product after resolving conflict
    const handleSwitchToNewProduct = () => {
        if (!blockedAttempt) return;
        const targetId = blockedAttempt.projectId
            ? `conv-${blockedAttempt.artisanId}-${blockedAttempt.projectId}`
            : `conv-${blockedAttempt.artisanId}`;
        setActiveConversationId(targetId);
        setActiveDiscussion(blockedAttempt);

        if (typeof window !== 'undefined') {
            localStorage.setItem(`active_discussion_${blockedAttempt.artisanId}`, JSON.stringify(blockedAttempt));
            try {
                const currentRegistry = JSON.parse(localStorage.getItem('karigar_conversations_registry') || '[]');
                const newConv = {
                    id: targetId,
                    artisanId: blockedAttempt.artisanId,
                    artisanName: blockedAttempt.artisanName,
                    craftCategory:
                        blockedAttempt.category === 'custom_commission'
                            ? `Commission: ${blockedAttempt.productTitle}`
                            : blockedAttempt.category,
                    avatarUrl:
                        blockedAttempt.avatarUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                    productTitle: blockedAttempt.productTitle,
                    price: blockedAttempt.price,
                    unread: false,
                    lastMessage: blockedAttempt.proposalText
                        ? `Proposal note: "${blockedAttempt.proposalText}"`
                        : `Inquiry for ${blockedAttempt.productTitle}`,
                    lastTimestamp: 'Just now',
                    projectId: blockedAttempt.projectId,
                    proposalText: blockedAttempt.proposalText,
                };
                const filtered = Array.isArray(currentRegistry)
                    ? currentRegistry.filter(
                          (c: any) =>
                              c.productTitle?.toLowerCase() !== 'case' &&
                              c.id !== 'conv-case-raja' &&
                              c.id !== targetId
                      )
                    : [];
                const updated = [newConv, ...filtered];
                localStorage.setItem('karigar_conversations_registry', JSON.stringify(updated));
                setConversationsList(updated);
            } catch (e) {}
        }
        setShowConflictModal(false);
        setBlockedAttempt(null);
        setInputText(
            `Hi! I have started a new inquiry for "${blockedAttempt.productTitle}" (₹${blockedAttempt.price.toLocaleString(
                'en-IN'
            )}). Could you share the maker details and dispatch timeline?`
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
                    projectId: activeDiscussion?.projectId || null,
                    status: 'HELD_IN_ESCROW',
                }),
            });

            const data = await res.json();
            if (data.orderId) {
                const orderPayload = {
                    id: data.orderId,
                    gross_amount: grossAmount,
                    withheld_tds: tdsAmount,
                    net_payout: netAmount,
                    status: 'HELD_IN_ESCROW',
                    rail: 'WEB2_NODAL',
                    carrier_code: 'DELHIVERY',
                    tracking_id: `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
                    created_at: new Date().toISOString(),
                    project: { title: activeDiscussion?.productTitle || 'Handcrafted Artisan Item' },
                    vendor: { full_name: activeDiscussion?.artisanName || 'Verified Artisan Maker' },
                    productTitle: activeDiscussion?.productTitle || 'Handcrafted Artisan Item',
                    artisanId: activeDiscussion?.artisanId,
                    artisanName: activeDiscussion?.artisanName,
                    projectId: activeDiscussion?.projectId,
                    conversationId: activeConversationId,
                };
                if (typeof window !== 'undefined') {
                    try {
                        localStorage.setItem(`escrow_order_${data.orderId}`, JSON.stringify(orderPayload));
                    } catch (e) {}
                }

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
        const isCommission = conv.craftCategory?.toLowerCase().includes('commission') || !!conv.projectId;
        const newDiscussion: ProductDiscussion = {
            artisanId: conv.artisanId,
            artisanName: conv.artisanName,
            reelId: 'reel-0',
            productTitle: conv.productTitle,
            price: conv.price,
            category: isCommission ? 'custom_commission' : conv.craftCategory,
            avatarUrl: conv.avatarUrl,
            status: 'IN_DISCUSSION',
            startedAt: new Date().toISOString(),
            projectId: conv.projectId,
            proposalText: conv.proposalText,
        };
        setActiveDiscussion(newDiscussion);
        if (typeof window !== 'undefined') {
            localStorage.setItem(`active_discussion_${conv.artisanId}`, JSON.stringify(newDiscussion));
        }
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
                                className="btn-primary text-xs py-2.5 w-full font-semibold cursor-pointer"
                            >
                                Continue Discussing "{activeDiscussion.productTitle}"
                            </button>
                            <button
                                onClick={handleSwitchToNewProduct}
                                className="btn-ghost text-xs py-2.5 w-full font-semibold text-[#D32F2F] hover:bg-[#FDEDED] cursor-pointer"
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
                            const isSelected = activeConversationId === conv.id;

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
                        <div className="bg-[#FAF8F5] border-b border-[#E8E2D9] px-4 py-2.5 flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                <span className="text-[10px] font-bold text-[#6B635B] uppercase tracking-wider shrink-0">
                                    {activeDiscussion.category === 'custom_commission' ? 'Bespoke Commission:' : 'Active Inquiry:'}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                    activeDiscussion.category === 'custom_commission'
                                        ? 'bg-[#EDF7ED] text-[#2E7D32] border border-[#2E7D32]/20'
                                        : 'bg-[#FFF4E5] text-[#ED6C02]'
                                }`}>
                                    ● {activeDiscussion.category === 'custom_commission' ? 'Proposal Discussion' : 'In Discussion'}
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
                                    className="btn-primary text-[11px] py-1 px-3 flex items-center gap-1 font-semibold cursor-pointer"
                                    title="Finalize order and generate quote"
                                >
                                    <Check className="w-3 h-3" />
                                    Finalize Order
                                </button>
                                <button
                                    onClick={handleCancelDiscussion}
                                    className="btn-ghost text-[11px] py-1 px-2 text-[#D32F2F] hover:bg-[#FDEDED] cursor-pointer"
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
                        {activeDiscussion && activeDiscussion.status !== 'ORDER_FINALIZED' && (
                            <div className="w-full max-w-lg my-2">
                                <QuoteCard
                                    title={activeDiscussion?.productTitle || 'Custom Bridal Katan Silk Saree (6.3m)'}
                                    grossPrice={activeDiscussion?.price || 24500}
                                    isVendor={userProfile?.is_vendor || false}
                                    isVerified={userProfile?.vendor_verified || false}
                                    isFinalized={false}
                                    onSendQuoteMessage={(quoteStr) => sendMessage(quoteStr)}
                                    onAcceptAndFund={(gross, tds, net) => handleAcceptAndFundEscrow(gross, tds, net)}
                                />
                            </div>
                        )}

                        {activeDiscussion && activeDiscussion.status === 'ORDER_FINALIZED' && (
                            <div className="w-full max-w-lg my-2 p-4 bg-[#EDF7ED] border border-[#2E7D32]/30 rounded-2xl flex items-center justify-between gap-3 text-[#2E7D32] animate-fade-in shadow-xs">
                                <div className="flex items-center gap-2.5">
                                    <CheckCircle2 className="w-5 h-5 shrink-0 text-[#2E7D32]" />
                                    <div>
                                        <p className="text-xs font-bold font-display">Order Finalized & Escrow Payout Released</p>
                                        <p className="text-[11px] text-[#6B635B]">
                                            Milestone for "{activeDiscussion.productTitle}" (₹{activeDiscussion.price?.toLocaleString('en-IN')}) is complete. Select a new reel to start another inquiry.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

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