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
    Clock,
    Sparkles,
    User,
    Check,
    X,
    Filter,
    FileText,
} from 'lucide-react';

type TabKey = 'pending_reels' | 'verified_reels' | 'rejected_reels' | 'disputes';

interface Reel {
    id: string;
    vendor_id: string;
    video_url: string;
    confidence_score: number;
    ai_confidence_score?: number;
    status: string;
    review_notes?: string | null;
    reviewed_at?: string | null;
    extracted_metadata: {
        productTitle?: string;
        category?: string;
        price?: number;
        description?: string;
        summary?: string;
        batch_marking?: string;
        tier?: string;
    } | null;
    created_at: string;
    vendor: {
        id?: string;
        full_name: string;
        avatar_url?: string | null;
        vendor_verified?: boolean;
    } | null;
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
    const [activeTab, setActiveTab] = useState<TabKey>('pending_reels');
    const [pendingReels, setPendingReels] = useState<Reel[]>([]);
    const [verifiedReels, setVerifiedReels] = useState<Reel[]>([]);
    const [rejectedReels, setRejectedReels] = useState<Reel[]>([]);
    const [disputes, setDisputes] = useState<DisputedOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [notesMap, setNotesMap] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchQueue();
    }, [activeTab]);

    const fetchQueue = async () => {
        setLoading(true);
        try {
            if (activeTab === 'pending_reels') {
                const res = await fetch('/api/admin/verifications/pending');
                const data = await res.json();
                setPendingReels(data.reels || []);
            } else if (activeTab === 'verified_reels') {
                const { data } = await supabase
                    .from('verification_reels')
                    .select('*, vendor:profiles!verification_reels_vendor_id_fkey(id, full_name, avatar_url, vendor_verified)')
                    .in('status', ['VERIFIED', 'AUTO_APPROVED'])
                    .order('created_at', { ascending: false })
                    .limit(30);
                setVerifiedReels((data as Reel[]) || []);
            } else if (activeTab === 'rejected_reels') {
                const { data } = await supabase
                    .from('verification_reels')
                    .select('*, vendor:profiles!verification_reels_vendor_id_fkey(id, full_name, avatar_url, vendor_verified)')
                    .eq('status', 'REJECTED')
                    .order('created_at', { ascending: false })
                    .limit(30);
                setRejectedReels((data as Reel[]) || []);
            } else if (activeTab === 'disputes') {
                const { data } = await supabase
                    .from('escrow_orders')
                    .select('*, project:custom_projects(title), buyer:profiles!escrow_orders_buyer_id_fkey(full_name), vendor_profile:profiles!escrow_orders_vendor_id_fkey(full_name)')
                    .eq('status', 'DISPUTED');
                setDisputes((data as DisputedOrder[]) || []);
            }
        } catch (err) {
            console.error('Error fetching admin triage queue:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReelDecision = async (reelId: string, decision: 'APPROVE' | 'REJECT') => {
        try {
            setProcessingId(reelId);
            const notes = notesMap[reelId] || '';
            const newStatus = decision === 'APPROVE' ? 'VERIFIED' : 'REJECTED';

            let success = false;

            try {
                const res = await fetch(`/api/admin/verifications/${reelId}/decision`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        decision,
                        notes,
                    }),
                });
                if (res.ok) {
                    success = true;
                }
            } catch {
                // Network failure, will fallback to client-side supabase
            }

            if (!success) {
                // Client-side fallback update
                const { data: updatedReel, error: reelErr } = await supabase
                    .from('verification_reels')
                    .update({
                        status: newStatus,
                        review_notes: notes || (decision === 'APPROVE' ? 'Manually verified by marketplace administrator.' : 'Rejected during manual HITL triage.'),
                        reviewed_at: new Date().toISOString(),
                    })
                    .eq('id', reelId)
                    .select('vendor_id')
                    .maybeSingle();

                if (!reelErr) {
                    success = true;
                    if (decision === 'APPROVE' && updatedReel?.vendor_id) {
                        await supabase
                            .from('profiles')
                            .update({ vendor_verified: true, kyc_status: 'PASSED' })
                            .eq('id', updatedReel.vendor_id);
                    }
                }
            }

            // Refresh queue
            await fetchQueue();
        } catch (err: any) {
            console.error('Decision error:', err);
            await fetchQueue();
        } finally {
            setProcessingId(null);
        }
    };

    const handleDisputeAction = async (orderId: string, action: 'RELEASE' | 'REFUND') => {
        const newStatus = action === 'RELEASE' ? 'RELEASED' : 'REFUNDED';
        await supabase.from('escrow_orders').update({ status: newStatus }).eq('id', orderId);
        fetchQueue();
    };

    const tabs = [
        { key: 'pending_reels' as TabKey, label: 'Pending Review (85%–90%)', icon: Clock, count: pendingReels.length },
        { key: 'verified_reels' as TabKey, label: 'Verified Reels (≥90%)', icon: CheckCircle, count: verifiedReels.length },
        { key: 'rejected_reels' as TabKey, label: 'Rejected Logs (<85%)', icon: XCircle, count: rejectedReels.length },
        { key: 'disputes' as TabKey, label: 'Escrow Disputes', icon: Package, count: disputes.length },
    ];

    return (
        <main className="min-h-screen bg-[#FDFBF7] p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#C85A32]/10 flex items-center justify-center text-[#C85A32]">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#1E1B18] font-display">
                                AI Verification & Triage Dashboard
                            </h1>
                            <p className="text-xs text-[#6B635B] mt-0.5">
                                Tiered Multimodal AI verification review panel for craft authenticity and escrow triage.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={fetchQueue}
                        className="btn-ghost text-xs py-2 px-3.5 flex items-center gap-1.5 self-start sm:self-auto"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span>Refresh Queue</span>
                    </button>
                </div>

                {/* Tier Explanation Banner */}
                <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 mb-6 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#FDEDED]/60 border border-[#F5C2C7]/50">
                        <div className="w-7 h-7 rounded-lg bg-[#FDEDED] text-[#D32F2F] flex items-center justify-center shrink-0 font-bold font-mono text-[11px]">
                            &lt;85%
                        </div>
                        <div>
                            <p className="font-bold text-[#D32F2F]">Low Confidence / Auto-Rejected</p>
                            <p className="text-[10px] text-[#6B635B]">Withheld from public feeds; actionable feedback sent to artisan.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#FFF4E5]/60 border border-[#ED6C02]/20">
                        <div className="w-7 h-7 rounded-lg bg-[#FFF4E5] text-[#ED6C02] flex items-center justify-center shrink-0 font-bold font-mono text-[11px]">
                            85-90%
                        </div>
                        <div>
                            <p className="font-bold text-[#ED6C02]">Medium Confidence / Admin Queue</p>
                            <p className="text-[10px] text-[#6B635B]">Queued below for human review before marketplace publishing.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#EDF7ED]/60 border border-[#2E7D32]/20">
                        <div className="w-7 h-7 rounded-lg bg-[#EDF7ED] text-[#2E7D32] flex items-center justify-center shrink-0 font-bold font-mono text-[11px]">
                            ≥90%
                        </div>
                        <div>
                            <p className="font-bold text-[#2E7D32]">High Confidence / Auto-Verified</p>
                            <p className="text-[10px] text-[#6B635B]">Instantly published to marketplace with verified badge.</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto gap-1 bg-[#F3EFEA] rounded-xl p-1 mb-6 max-w-2xl no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                activeTab === tab.key
                                    ? 'bg-white text-[#1E1B18] shadow-sm'
                                    : 'text-[#6B635B] hover:text-[#1E1B18]'
                            }`}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            <span>{tab.label}</span>
                            {tab.count > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                    activeTab === tab.key
                                        ? 'bg-[#C85A32] text-white'
                                        : 'bg-[#E8E2D9] text-[#6B635B]'
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ─── TAB 1: PENDING AI REVIEW QUEUE (85% - 90%) ──────────────────────── */}
                {activeTab === 'pending_reels' && (
                    <div>
                        {loading ? (
                            <p className="text-xs text-[#6B635B] animate-pulse-subtle py-8 text-center">Loading pending review queue...</p>
                        ) : pendingReels.length === 0 ? (
                            <div className="card p-12 text-center bg-white border border-[#E8E2D9] max-w-md mx-auto">
                                <CheckCircle className="w-10 h-10 text-[#2E7D32] mx-auto mb-3" />
                                <h3 className="font-bold text-[#1E1B18] font-display text-base">All Review Queues Clear</h3>
                                <p className="text-xs text-[#6B635B] mt-1">
                                    No artisan videos currently require manual triage. High-confidence videos (≥90%) are automatically verified.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {pendingReels.map((reel) => {
                                    const meta = reel.extracted_metadata || {};
                                    const scorePct = reel.confidence_score ? Math.round(reel.confidence_score * 100) : 87;

                                    return (
                                        <div
                                            key={reel.id}
                                            className="card bg-white border border-[#E8E2D9] p-5 shadow-card flex flex-col md:flex-row gap-5"
                                        >
                                            {/* 9:16 Video Player */}
                                            <div className="w-full md:w-48 aspect-[9/16] bg-black rounded-xl overflow-hidden shrink-0 relative border border-[#E8E2D9]">
                                                <video
                                                    src={reel.video_url}
                                                    controls
                                                    playsInline
                                                    preload="metadata"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute top-2 left-2 z-10">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FFF4E5] text-[#ED6C02] shadow-xs">
                                                        {scorePct}% AI Score
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Review Details & Controls */}
                                            <div className="flex-1 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#ED6C02] bg-[#FFF4E5] px-2 py-0.5 rounded-full flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            Pending Admin Review
                                                        </span>
                                                        <span className="text-[10px] font-mono text-[#6B635B]">
                                                            {new Date(reel.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>

                                                    <h3 className="font-display font-bold text-base text-[#1E1B18] mt-1">
                                                        {meta.productTitle || 'Handcrafted Item'}
                                                    </h3>

                                                    {/* Maker Info */}
                                                    <div className="flex items-center gap-2 mt-1.5 mb-2.5">
                                                        <div className="w-6 h-6 rounded-full bg-[#C85A32] text-white flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                                                            {reel.vendor?.avatar_url ? (
                                                                <img src={reel.vendor.avatar_url} alt="Logo" className="w-full h-full object-cover" />
                                                            ) : (
                                                                reel.vendor?.full_name?.charAt(0) || <User className="w-3 h-3" />
                                                            )}
                                                        </div>
                                                        <span className="text-xs font-semibold text-[#1E1B18]">
                                                            {reel.vendor?.full_name || 'Artisan Maker'}
                                                        </span>
                                                        <span className="text-[10px] font-medium text-[#6B635B] bg-[#F3EFEA] px-2 py-0.5 rounded">
                                                            {meta.category || 'Craft'}
                                                        </span>
                                                    </div>

                                                    {/* AI Summary Box */}
                                                    <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl p-3 mb-3">
                                                        <p className="text-[11px] font-semibold text-[#1E1B18] mb-0.5 flex items-center gap-1">
                                                            <Sparkles className="w-3 h-3 text-[#C85A32]" />
                                                            Gemini Multimodal AI Breakdown:
                                                        </p>
                                                        <p className="text-xs text-[#6B635B] leading-relaxed">
                                                            {meta.summary || reel.review_notes || 'Workshop process analyzed by AI vision inspector.'}
                                                        </p>
                                                        {meta.batch_marking && (
                                                            <p className="text-[10px] font-mono font-bold text-[#C85A32] mt-1">
                                                                Batch Marker: {meta.batch_marking}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Optional Admin Notes */}
                                                    <div className="mb-3">
                                                        <input
                                                            type="text"
                                                            placeholder="Add optional triage notes..."
                                                            value={notesMap[reel.id] || ''}
                                                            onChange={(e) =>
                                                                setNotesMap((prev) => ({ ...prev, [reel.id]: e.target.value }))
                                                            }
                                                            className="w-full h-8 px-2.5 text-xs border border-[#E8E2D9] rounded-lg outline-none focus:border-[#C85A32] bg-[#FDFBF7]"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex gap-2 pt-2 border-t border-[#F3EFEA]">
                                                    <button
                                                        onClick={() => handleReelDecision(reel.id, 'APPROVE')}
                                                        disabled={processingId === reel.id}
                                                        className="flex-1 btn-primary text-xs py-2 flex items-center justify-center gap-1.5 font-semibold cursor-pointer disabled:opacity-50"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                        <span>Approve & Verify</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleReelDecision(reel.id, 'REJECT')}
                                                        disabled={processingId === reel.id}
                                                        className="btn-ghost text-xs py-2 px-3 text-[#D32F2F] hover:bg-[#FDEDED] flex items-center justify-center gap-1 font-semibold cursor-pointer disabled:opacity-50"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                        <span>Reject</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ─── TAB 2: VERIFIED REELS (≥90%) ──────────────────────────────────── */}
                {activeTab === 'verified_reels' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {verifiedReels.map((reel) => (
                            <div key={reel.id} className="card bg-white border border-[#E8E2D9] p-4 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EDF7ED] text-[#2E7D32] flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            {Math.round((reel.confidence_score || 0.92) * 100)}% Verified
                                        </span>
                                        <span className="text-[10px] font-mono text-[#6B635B]">
                                            {new Date(reel.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h4 className="font-display font-bold text-sm text-[#1E1B18] mt-1">
                                        {reel.extracted_metadata?.productTitle || 'Handmade Item'}
                                    </h4>
                                    <p className="text-xs text-[#6B635B] mt-1">
                                        Maker: <strong className="text-[#1E1B18]">{reel.vendor?.full_name || 'Artisan'}</strong>
                                    </p>
                                    <p className="text-xs text-[#6B635B] mt-2 line-clamp-2 leading-relaxed bg-[#FAF8F5] p-2 rounded-lg border border-[#F3EFEA]">
                                        {reel.extracted_metadata?.summary || reel.review_notes || 'Verified by Gemini Multimodal Vision.'}
                                    </p>
                                </div>
                                <div className="mt-3 pt-2 border-t border-[#F3EFEA] flex justify-between items-center text-[10px] text-[#2E7D32] font-semibold">
                                    <span>Status: Live on Marketplace</span>
                                    <span className="font-mono">{reel.extracted_metadata?.batch_marking || '#01/50'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ─── TAB 3: REJECTED LOGS (<85%) ───────────────────────────────────── */}
                {activeTab === 'rejected_reels' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {rejectedReels.length === 0 ? (
                            <div className="card p-8 text-center bg-white col-span-3">
                                <p className="text-xs text-[#6B635B]">No rejected reels found.</p>
                            </div>
                        ) : (
                            rejectedReels.map((reel) => (
                                <div key={reel.id} className="card bg-white border border-[#E8E2D9] p-4 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FDEDED] text-[#D32F2F] flex items-center gap-1">
                                                <XCircle className="w-3 h-3" />
                                                Rejected
                                            </span>
                                            <span className="text-[10px] font-mono text-[#6B635B]">
                                                {new Date(reel.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h4 className="font-display font-bold text-sm text-[#1E1B18] mt-1">
                                            {reel.extracted_metadata?.productTitle || 'Handmade Item'}
                                        </h4>
                                        <p className="text-xs text-[#6B635B] mt-1">
                                            Maker: <strong className="text-[#1E1B18]">{reel.vendor?.full_name || 'Artisan'}</strong>
                                        </p>
                                        <p className="text-xs text-[#D32F2F] mt-2 line-clamp-2 leading-relaxed bg-[#FDEDED]/40 p-2 rounded-lg border border-[#F5C2C7]/50">
                                            {reel.review_notes || reel.extracted_metadata?.summary || 'Rejected due to low craft confidence score (<85%).'}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* ─── TAB 4: ESCROW DISPUTES ─────────────────────────────────────────── */}
                {activeTab === 'disputes' && (
                    <div>
                        {disputes.length === 0 ? (
                            <div className="card p-8 text-center bg-white border border-[#E8E2D9] max-w-md mx-auto">
                                <CheckCircle className="w-8 h-8 text-[#2E7D32] mx-auto mb-2" />
                                <p className="text-sm text-[#2E7D32] font-semibold">No active escrow disputes!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {disputes.map((order) => (
                                    <div key={order.id} className="card p-5 flex flex-col justify-between bg-white border border-[#E8E2D9]">
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
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}