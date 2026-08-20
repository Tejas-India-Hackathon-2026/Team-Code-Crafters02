'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabaseClient';
import {
    ShieldCheck,
    XCircle,
    AlertTriangle,
    Video,
    Package,
    CheckCircle,
    RefreshCw,
} from 'lucide-react';

type TabKey = 'reels' | 'disputes';

interface Reel {
    id: string;
    vendor_id: string;
    confidence_score: number;
    status: string;
    extracted_metadata: { summary?: string } | null;
    vendor: { full_name: string } | null;
}

interface DisputedOrder {
    id: string;
    gross_amount: number;
    status: string;
    dispute_reason: string | null;
    project: { title: string } | null;
    buyer: { full_name: string } | null;
    vendor_profile: { full_name: string } | null;
}

export default function AdminTriagePage() {
    const supabase = createClient();
    const [activeTab, setActiveTab] = useState<TabKey>('reels');
    const [reels, setReels] = useState<Reel[]>([]);
    const [disputes, setDisputes] = useState<DisputedOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQueue();
    }, [activeTab]);

    const fetchQueue = async () => {
        setLoading(true);
        if (activeTab === 'reels') {
            const { data } = await supabase
                .from('verification_reels')
                .select('*, vendor:profiles(full_name)')
                .eq('status', 'NEEDS_REVIEW');
            setReels((data as Reel[]) || []);
        } else {
            const { data } = await supabase
                .from('escrow_orders')
                .select('*, project:custom_projects(title), buyer:profiles!escrow_orders_buyer_id_fkey(full_name), vendor_profile:profiles!escrow_orders_vendor_id_fkey(full_name)')
                .eq('status', 'DISPUTED');
            setDisputes((data as DisputedOrder[]) || []);
        }
        setLoading(false);
    };

    const handleReelAction = async (reelId: string, vendorId: string, action: 'APPROVE' | 'REJECT') => {
        if (action === 'APPROVE') {
            await supabase.from('verification_reels').update({ status: 'AUTO_APPROVED' }).eq('id', reelId);
            await supabase.from('profiles').update({ vendor_verified: true }).eq('id', vendorId);
        } else {
            await supabase.from('verification_reels').update({ status: 'REJECTED' }).eq('id', reelId);
        }
        fetchQueue();
    };

    const handleDisputeAction = async (orderId: string, action: 'RELEASE' | 'REFUND') => {
        const newStatus = action === 'RELEASE' ? 'RELEASED' : 'REFUNDED';
        await supabase.from('escrow_orders').update({ status: newStatus }).eq('id', orderId);
        fetchQueue();
    };

    const tabs: { key: TabKey; label: string; icon: typeof Video; count: number }[] = [
        { key: 'reels', label: 'Reel Reviews', icon: Video, count: reels.length },
        { key: 'disputes', label: 'Order Disputes', icon: Package, count: disputes.length },
    ];

    return (
        <main className="min-h-screen bg-[#FDFBF7] p-6 sm:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-[#C85A32]/10 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-[#C85A32]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-[#1E1B18] font-display">HITL Triage Dashboard</h1>
                        <p className="text-xs text-[#6B635B]">
                            Review artisan reels and order disputes requiring human oversight.
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-[#F3EFEA] rounded-lg p-1 mt-6 mb-6 max-w-md">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all ${
                                activeTab === tab.key
                                    ? 'bg-white text-[#1E1B18] shadow-sm'
                                    : 'text-[#6B635B] hover:text-[#1E1B18]'
                            }`}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <p className="text-sm text-[#6B635B] animate-pulse-subtle">Loading triage queue...</p>
                ) : activeTab === 'reels' ? (
                    /* ── Reel Review Queue ────────────────────── */
                    reels.length === 0 ? (
                        <div className="card p-8 text-center">
                            <CheckCircle className="w-8 h-8 text-[#2E7D32] mx-auto mb-2" />
                            <p className="text-sm text-[#2E7D32] font-medium">All reel review queues are clear!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {reels.map((reel) => (
                                <div key={reel.id} className="card p-5 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold px-2 py-1 bg-[#FFF4E5] text-[#ED6C02] rounded-md flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" /> Needs Review
                                            </span>
                                            <span className="text-xs font-mono text-[#6B635B]">
                                                {(reel.confidence_score * 100).toFixed(1)}% Score
                                            </span>
                                        </div>
                                        <p className="text-sm font-semibold text-[#1E1B18] mt-2 font-display">
                                            Maker: {reel.vendor?.full_name || 'Artisan'}
                                        </p>
                                        <p className="text-xs text-[#6B635B] mt-1 line-clamp-2">
                                            {reel.extracted_metadata?.summary || 'No summary available.'}
                                        </p>
                                    </div>

                                    <div className="flex gap-2 mt-5">
                                        <button
                                            onClick={() => handleReelAction(reel.id, reel.vendor_id, 'APPROVE')}
                                            className="flex-1 btn-secondary text-xs py-2 flex items-center justify-center gap-1"
                                        >
                                            <ShieldCheck className="w-4 h-4" /> Approve
                                        </button>
                                        <button
                                            onClick={() => handleReelAction(reel.id, reel.vendor_id, 'REJECT')}
                                            className="flex-1 bg-[#FDEDED] text-[#D32F2F] hover:bg-[#FADBD8] border border-[#F5C2C7] py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                                        >
                                            <XCircle className="w-4 h-4" /> Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    /* ── Dispute Queue ─────────────────────── */
                    disputes.length === 0 ? (
                        <div className="card p-8 text-center">
                            <CheckCircle className="w-8 h-8 text-[#2E7D32] mx-auto mb-2" />
                            <p className="text-sm text-[#2E7D32] font-medium">No active disputes to review!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {disputes.map((order) => (
                                <div key={order.id} className="card p-5 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold px-2 py-1 bg-[#FDEDED] text-[#D32F2F] rounded-md flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" /> Disputed
                                            </span>
                                            <span className="text-xs font-mono text-[#6B635B]">
                                                #{order.id.slice(0, 8)}
                                            </span>
                                        </div>

                                        <p className="text-sm font-semibold text-[#1E1B18] mt-2 font-display">
                                            {order.project?.title || 'Custom Artisan Item'}
                                        </p>

                                        <div className="flex flex-col gap-1.5 mt-3 text-xs text-[#6B635B]">
                                            <p><strong className="text-[#1E1B18]">Buyer:</strong> {order.buyer?.full_name || 'N/A'}</p>
                                            <p><strong className="text-[#1E1B18]">Artisan:</strong> {order.vendor_profile?.full_name || 'N/A'}</p>
                                            <p><strong className="text-[#1E1B18]">Escrow Amount:</strong> ₹{order.gross_amount?.toLocaleString('en-IN')}</p>
                                        </div>

                                        {order.dispute_reason && (
                                            <div className="mt-3 p-3 bg-[#FDFBF7] border border-[#E8E2D9] rounded-lg">
                                                <p className="text-[11px] font-semibold text-[#1E1B18] mb-1">Dispute Reason:</p>
                                                <p className="text-xs text-[#6B635B] leading-relaxed">{order.dispute_reason}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 mt-5">
                                        <button
                                            onClick={() => handleDisputeAction(order.id, 'RELEASE')}
                                            className="flex-1 btn-secondary text-xs py-2 flex items-center justify-center gap-1"
                                        >
                                            <CheckCircle className="w-4 h-4" /> Release to Artisan
                                        </button>
                                        <button
                                            onClick={() => handleDisputeAction(order.id, 'REFUND')}
                                            className="flex-1 bg-[#FDEDED] text-[#D32F2F] hover:bg-[#FADBD8] border border-[#F5C2C7] py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                                        >
                                            <RefreshCw className="w-4 h-4" /> Refund Buyer
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </main>
    );
}