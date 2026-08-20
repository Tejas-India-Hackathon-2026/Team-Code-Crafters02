'use client';

import { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useWebSockets } from '../../../hooks/useWebSockets';
import { createClient } from '../../../lib/supabaseClient';
import QuoteCard from '../../../components/chat/QuoteCard';
import {
    ShieldCheck,
    Send,
    MessageSquare,
    ShoppingBag,
    CheckCircle2,
    ArrowLeft,
    Shield,
    Sparkles,
    Check,
    X,
    Filter,
} from 'lucide-react';
import Link from 'next/link';

interface Message {
    id: string;
    sender: 'buyer' | 'artisan';
    text: string;
    timestamp: string;
    isQuote?: boolean;
    quoteData?: {
        title: string;
        gross: number;
        tds: number;
        net: number;
    };
}

interface Conversation {
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
    messages: Message[];
}

const INITIAL_CONVERSATIONS: Conversation[] = [
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
        lastTimestamp: '2h',
        messages: [
            {
                id: 'm1',
                sender: 'buyer',
                text: 'Namaste Kavita ji! I saw your AI-verified process reel for Banarasi weaving. Can you customize a bridal Katan silk saree in royal crimson with silver zari Shikargah motifs?',
                timestamp: '3 hours ago',
            },
            {
                id: 'm2',
                sender: 'artisan',
                text: 'Namaste! Yes, absolutely. We use pure mulberry unbleached silk and hand-punched Jacquard graph cards. The total weaving timeline will be 21 days on our pit loom.',
                timestamp: '2 hours ago',
            },
            {
                id: 'm3',
                sender: 'artisan',
                text: '',
                timestamp: '2 hours ago',
                isQuote: true,
                quoteData: {
                    title: 'Custom Bridal Katan Silk Saree (6.3m)',
                    gross: 24500,
                    tds: 245,
                    net: 24255,
                },
            },
        ],
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
        lastTimestamp: '1d',
        messages: [
            {
                id: 'r1',
                sender: 'buyer',
                text: 'Hello Rajesh ji! Is the cobalt glaze completely lead-free and microwave safe?',
                timestamp: '1 day ago',
            },
            {
                id: 'r2',
                sender: 'artisan',
                text: 'Yes, the cobalt glaze will be 100% food and microwave safe. We fire each piece at 850°C in our traditional wood kiln with natural quartz stone powder.',
                timestamp: '1 day ago',
            },
            {
                id: 'r3',
                sender: 'artisan',
                text: '',
                timestamp: '1 day ago',
                isQuote: true,
                quoteData: {
                    title: 'Custom 24-Piece Quartz Blue Pottery Dinner Set',
                    gross: 14800,
                    tds: 148,
                    net: 14652,
                },
            },
        ],
    },
];

function MessagesContent() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
    const [selectedConvId, setSelectedConvId] = useState<string>('conv-kavita');
    const [inputText, setInputText] = useState('');
    const [userProfile, setUserProfile] = useState<any>(null);

    // Ingest URL params for product inquiry from Reel feed
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
            }
        };
        initChat();
    }, []);

    // If navigated from a specific product reel
    useEffect(() => {
        if (!paramArtisanId || !paramProductTitle) return;

        const dynamicId = `conv-${paramArtisanId}`;
        const priceNum = paramPrice ? parseFloat(paramPrice) : 2499;
        const tdsVal = Math.round(priceNum * 0.01);
        const netVal = priceNum - tdsVal;

        setConversations((prev) => {
            const exists = prev.find((c) => c.id === dynamicId || c.artisanId === paramArtisanId);
            if (exists) {
                return prev.map((c) =>
                    c.id === exists.id
                        ? {
                              ...c,
                              productTitle: paramProductTitle,
                              price: priceNum,
                          }
                        : c
                );
            }

            const newConv: Conversation = {
                id: dynamicId,
                artisanId: paramArtisanId,
                artisanName: paramVendorName || 'Verified Master Artisan',
                craftCategory: paramCategory || 'Handcrafted Heritage',
                avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                productTitle: paramProductTitle,
                price: priceNum,
                unread: true,
                lastMessage: `Inquiry for ${paramProductTitle}`,
                lastTimestamp: 'Just now',
                messages: [
                    {
                        id: `m-init-${Date.now()}`,
                        sender: 'buyer',
                        text: `Hi! I am interested in ordering this verified handcrafted product: "${paramProductTitle}" (₹${priceNum.toLocaleString('en-IN')}). Can you please confirm customization options and delivery schedule?`,
                        timestamp: 'Just now',
                    },
                    {
                        id: `m-rep-${Date.now()}`,
                        sender: 'artisan',
                        text: `Namaste! Thank you for appreciating our handmade craft. I would be honored to craft "${paramProductTitle}" for you. I have generated a formal escrow-ready milestone proposal below.`,
                        timestamp: 'Just now',
                    },
                    {
                        id: `m-q-${Date.now()}`,
                        sender: 'artisan',
                        text: '',
                        timestamp: 'Just now',
                        isQuote: true,
                        quoteData: {
                            title: paramProductTitle,
                            gross: priceNum,
                            tds: tdsVal,
                            net: netVal,
                        },
                    },
                ],
            };

            return [newConv, ...prev];
        });

        setSelectedConvId(dynamicId);
    }, [paramArtisanId, paramProductTitle, paramPrice, paramCategory, paramVendorName]);

    const activeConv = useMemo(() => {
        return conversations.find((c) => c.id === selectedConvId) || conversations[0];
    }, [conversations, selectedConvId]);

    const { sendMessage } = useWebSockets(selectedConvId);

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeConv?.messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !activeConv) return;

        const newMsg: Message = {
            id: `msg-${Date.now()}`,
            sender: 'buyer',
            text: inputText.trim(),
            timestamp: 'Just now',
        };

        const updatedMessages = [...activeConv.messages, newMsg];

        setConversations((prev) =>
            prev.map((c) =>
                c.id === activeConv.id
                    ? {
                          ...c,
                          messages: updatedMessages,
                          lastMessage: inputText.trim(),
                          lastTimestamp: 'Just now',
                      }
                    : c
            )
        );

        sendMessage(inputText.trim());
        setInputText('');

        // If this was the first custom query, simulate artisan confirmation after 800ms
        if (activeConv.messages.length <= 1) {
            setTimeout(() => {
                const artisanReply: Message = {
                    id: `msg-artisan-${Date.now()}`,
                    sender: 'artisan',
                    text: 'Namaste! Yes, absolutely. We use pure natural materials and traditional hand tools. The custom piece will be ready for dispatch within our agreed timeline.',
                    timestamp: 'Just now',
                };
                const quoteMsg: Message = {
                    id: `msg-quote-${Date.now()}`,
                    sender: 'artisan',
                    text: '',
                    timestamp: 'Just now',
                    isQuote: true,
                    quoteData: {
                        title: activeConv.productTitle,
                        gross: activeConv.price || 24500,
                        tds: Math.round((activeConv.price || 24500) * 0.01),
                        net: (activeConv.price || 24500) - Math.round((activeConv.price || 24500) * 0.01),
                    },
                };

                setConversations((prev) =>
                    prev.map((c) =>
                        c.id === activeConv.id
                            ? {
                                  ...c,
                                  messages: [...c.messages, artisanReply, quoteMsg],
                                  lastMessage: 'I have prepared the formal milestone quote...',
                              }
                            : c
                    )
                );
            }, 800);
        }
    };

    const handleAcceptAndFundEscrow = async (grossAmount: number, tdsAmount: number, netAmount: number) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const res = await fetch('/api/escrow/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    buyerId: user?.id,
                    vendorId: activeConv?.artisanId || null,
                    grossAmount,
                    productTitle: activeConv?.productTitle || 'Handcrafted Artisan Item',
                    status: 'HELD_IN_ESCROW',
                }),
            });

            const data = await res.json();
            if (data.orderId) {
                router.push(`/orders/${data.orderId}`);
            }
        } catch (err: any) {
            console.error('Escrow funding error:', err);
        }
    };

    return (
        <main className="min-h-screen bg-[#F7F4EE] px-4 py-6 sm:px-6 lg:px-8 flex flex-col justify-between">
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
                        {conversations.map((conv) => {
                            const isSelected = conv.id === selectedConvId;
                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => {
                                        setSelectedConvId(conv.id);
                                        setConversations((prev) =>
                                            prev.map((c) => (c.id === conv.id ? { ...c, unread: false } : c))
                                        );
                                    }}
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
                    {activeConv && (
                        <div className="p-4 sm:px-6 border-b border-[#E8E2D9] flex items-center justify-between bg-white shrink-0">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-[#C85A32] overflow-hidden shrink-0 border border-[#E8E2D9]">
                                    <img
                                        src={activeConv.avatarUrl}
                                        alt={activeConv.artisanName}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="font-display font-bold text-sm sm:text-base text-[#1E1B18] truncate">
                                        {activeConv.artisanName}
                                    </h2>
                                    <p className="text-xs text-[#6B635B] truncate mt-0.5 font-medium">
                                        {activeConv.productTitle}
                                    </p>
                                </div>
                            </div>

                            {/* Verified Maker Badge */}
                            <div className="shrink-0">
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border border-[#2E7D32]/30 bg-[#EDF7ED] text-[#2E7D32]">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>VERIFIED MAKER</span>
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Chat Messages Stream */}
                    <div className="flex-1 p-5 sm:p-6 overflow-y-auto flex flex-col gap-4 bg-[#FDFBF7]/40">
                        {activeConv?.messages.map((msg) => {
                            if (msg.isQuote && msg.quoteData) {
                                return (
                                    <div key={msg.id} className="w-full max-w-lg my-1">
                                        <QuoteCard
                                            title={msg.quoteData.title}
                                            grossPrice={msg.quoteData.gross}
                                            isVendor={userProfile?.is_vendor || false}
                                            isVerified={userProfile?.vendor_verified || false}
                                            onAcceptAndFund={(gross, tds, net) =>
                                                handleAcceptAndFundEscrow(gross, tds, net)
                                            }
                                        />
                                    </div>
                                );
                            }

                            const isBuyer = msg.sender === 'buyer';

                            return (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col ${isBuyer ? 'items-end' : 'items-start'} max-w-2xl`}
                                >
                                    <div
                                        className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                                            isBuyer
                                                ? 'bg-[#C85A32] text-white rounded-tr-xs'
                                                : 'bg-white border border-[#E8E2D9] text-[#1E1B18] rounded-tl-xs'
                                        }`}
                                    >
                                        <p className="whitespace-pre-wrap">{msg.text}</p>
                                        <div
                                            className={`text-[10px] mt-2 text-right ${
                                                isBuyer ? 'text-white/70' : 'text-[#6B635B]'
                                            }`}
                                        >
                                            {msg.timestamp}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Bar */}
                    <div className="p-4 border-t border-[#E8E2D9] bg-white">
                        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
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