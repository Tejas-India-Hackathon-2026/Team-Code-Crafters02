'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '../../../../lib/supabaseClient';
import {
    Package,
    ShieldAlert,
    CheckCircle2,
    Clock,
    CreditCard,
    Truck,
    Shield,
    ImagePlus,
    ArrowLeft,
    Sparkles,
    Check,
    AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

const ESCROW_STATES = [
    { key: 'AWAITING_PAYMENT', label: 'Awaiting Payment', icon: CreditCard },
    { key: 'HELD_IN_ESCROW', label: 'Held in Escrow', icon: Shield },
    { key: 'DELIVERED_PENDING_BUFFER', label: '48h Delivery Buffer', icon: Truck },
    { key: 'RELEASED', label: 'Released to Maker', icon: CheckCircle2 },
];

export default function OrderTrackingPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;
    const supabase = createClient();

    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [disputeReason, setDisputeReason] = useState('');
    const [disputeImage, setDisputeImage] = useState<File | null>(null);
    const [isDisputeOpen, setIsDisputeOpen] = useState(false);
    const [submittingDispute, setSubmittingDispute] = useState(false);
    const [actionMsg, setActionMsg] = useState<string | null>(null);

    useEffect(() => {
        fetchOrder();
    }, [orderId]);

    const fetchOrder = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('escrow_orders')
                .select('*, project:custom_projects(title), vendor:profiles(full_name)')
                .eq('id', orderId)
                .maybeSingle();

            if (data) {
                setOrder(data);
            } else if (typeof window !== 'undefined') {
                const cached = localStorage.getItem(`escrow_order_${orderId}`);
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        setOrder(parsed);
                    } catch (e) {}
                } else {
                    // Try to extract dynamic values from active conversation registry
                    let gross = 300;
                    let title = 'Verified Handcrafted Artisan Milestone';
                    let vendorName = 'Verified Artisan Maker';
                    try {
                        const rawReg = localStorage.getItem('karigar_conversations_registry');
                        if (rawReg) {
                            const list = JSON.parse(rawReg);
                            if (Array.isArray(list) && list.length > 0) {
                                gross = list[0].price || gross;
                                title = list[0].productTitle || title;
                                vendorName = list[0].artisanName || vendorName;
                            }
                        }
                    } catch (e) {}

                    const tds = Math.round(gross * 0.01);
                    const net = gross - tds;
                    const fallbackOrder = {
                        id: orderId,
                        gross_amount: gross,
                        withheld_tds: tds,
                        net_payout: net,
                        status: 'HELD_IN_ESCROW',
                        rail: 'WEB2_NODAL',
                        carrier_code: 'DELHIVERY',
                        tracking_id: `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
                        created_at: new Date().toISOString(),
                        project: { title },
                        vendor: { full_name: vendorName },
                    };
                    setOrder(fallbackOrder);
                    localStorage.setItem(`escrow_order_${orderId}`, JSON.stringify(fallbackOrder));
                }
            }
        } catch (err) {
            console.error('Error fetching order:', err);
        } finally {
            setLoading(false);
        }
    };

    // Transition Order Status (Simulate Logistics & Escrow Lifecycle)
    const handleUpdateStatus = async (newStatus: string) => {
        setActionMsg(`Transitioning order to ${newStatus.replace(/_/g, ' ')}...`);
        try {
            await supabase
                .from('escrow_orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            setOrder((prev: any) => prev ? { ...prev, status: newStatus } : prev);
            setTimeout(() => setActionMsg(null), 4000);
        } catch (err: any) {
            console.error('Update status error:', err);
        }
    };

    const handleRaiseDispute = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmittingDispute(true);
            let proofUrl = null;

            if (disputeImage) {
                const ext = disputeImage.name.split('.').pop();
                const filePath = `disputes/${orderId}/proof_${Date.now()}.${ext}`;

                const { error: uploadError } = await supabase.storage
                    .from('dispute-evidence')
                    .upload(filePath, disputeImage);

                if (!uploadError) {
                    const { data: urlData } = supabase.storage
                        .from('dispute-evidence')
                        .getPublicUrl(filePath);
                    proofUrl = urlData.publicUrl;
                }
            }

            await supabase
                .from('escrow_orders')
                .update({
                    status: 'DISPUTED',
                    dispute_reason: disputeReason,
                    dispute_proof_url: proofUrl,
                })
                .eq('id', orderId);

            setOrder((prev: any) => prev ? {
                ...prev,
                status: 'DISPUTED',
                dispute_reason: disputeReason,
                dispute_proof_url: proofUrl,
            } : prev);

            setIsDisputeOpen(false);
            setDisputeReason('');
            setDisputeImage(null);
            setActionMsg('⚠️ Dispute lodged and escalated to Admin Triage.');
            setTimeout(() => setActionMsg(null), 5000);
        } catch (err: any) {
            alert(`Dispute error: ${err.message}`);
        } finally {
            setSubmittingDispute(false);
        }
    };

    const getCurrentStep = (status: string): number => {
        if (status === 'DISPUTED' || status === 'REFUNDED') return 2;
        const idx = ESCROW_STATES.findIndex((s) => s.key === status);
        return idx >= 0 ? idx : 1;
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <p className="text-xs text-[#6B635B] animate-pulse-subtle">Loading escrow order details...</p>
            </main>
        );
    }

    if (!order) {
        return (
            <main className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
                <p className="text-xs text-[#6B635B] mb-3">Order not found.</p>
                <Link href="/projects" className="btn-primary text-xs py-2 px-4">
                    Back to Commissions
                </Link>
            </main>
        );
    }

    const currentStep = getCurrentStep(order.status);

    return (
        <main className="min-h-screen bg-[#FDFBF7] p-4 sm:p-6 flex flex-col items-center">
            <div className="max-w-xl w-full">
                {/* Back navigation */}
                <div className="mb-4">
                    <Link
                        href="/messages"
                        className="inline-flex items-center gap-1.5 text-xs text-[#6B635B] hover:text-[#1E1B18] font-medium"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Maker Chat</span>
                    </Link>
                </div>

                {/* Status alert message */}
                {actionMsg && (
                    <div className="mb-4 p-3 bg-[#EDF7ED] border border-[#C3E6CB] text-[#2E7D32] rounded-xl text-xs font-semibold animate-fade-in flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        <span>{actionMsg}</span>
                    </div>
                )}

                {/* Order Card */}
                <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-card animate-slide-up">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-4 mb-5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-[#FFF4E5] text-[#C85A32] flex items-center justify-center">
                                <Package className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="font-bold text-sm text-[#1E1B18] font-display">
                                    Escrow Order #{order.id.slice(0, 8)}
                                </h1>
                                <p className="text-[10px] text-[#6B635B]">
                                    Dual-Rail Smart Escrow • Section 194-O TDS Compliant
                                </p>
                            </div>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                            order.status === 'RELEASED' ? 'bg-[#EDF7ED] text-[#2E7D32]' :
                            order.status === 'DISPUTED' ? 'bg-[#FDEDED] text-[#D32F2F]' :
                            order.status === 'DELIVERED_PENDING_BUFFER' ? 'bg-[#FFF4E5] text-[#ED6C02]' :
                            'bg-[#E8F0FE] text-[#1967D2]'
                        }`}>
                            {order.status.replace(/_/g, ' ')}
                        </span>
                    </div>

                    {/* State Machine Visualization */}
                    <div className="mb-6">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-[#6B635B] mb-3">
                            Escrow Milestone Pipeline
                        </p>
                        <div className="flex items-center justify-between relative px-2">
                            {/* Connecting line */}
                            <div className="absolute top-5 left-6 right-6 h-0.5 bg-[#E8E2D9]" />
                            <div
                                className="absolute top-5 left-6 h-0.5 bg-[#C85A32] transition-all duration-500"
                                style={{ width: `${(currentStep / (ESCROW_STATES.length - 1)) * 88}%` }}
                            />

                            {ESCROW_STATES.map((state, idx) => {
                                const StepIcon = state.icon;
                                const isCompleted = idx <= currentStep;
                                const isCurrent = idx === currentStep;

                                return (
                                    <div key={state.key} className="flex flex-col items-center relative z-10">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                                            isCurrent
                                                ? 'border-[#C85A32] bg-[#C85A32] text-white shadow-elevated'
                                                : isCompleted
                                                    ? 'border-[#C85A32] bg-[#FDFBF7] text-[#C85A32]'
                                                    : 'border-[#E8E2D9] bg-white text-[#C2BCB3]'
                                        }`}>
                                            <StepIcon className="w-4 h-4" />
                                        </div>
                                        <span className={`text-[9px] mt-1.5 font-semibold text-center max-w-[65px] leading-tight ${
                                            isCompleted ? 'text-[#1E1B18]' : 'text-[#A0988E]'
                                        }`}>
                                            {state.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Financial & Logistics Summary */}
                    <div className="flex flex-col gap-2.5 text-xs p-4 bg-[#FDFBF7] rounded-xl border border-[#E8E2D9] mb-5">
                        <div className="flex justify-between">
                            <span className="text-[#6B635B]">Product / Commission:</span>
                            <span className="font-bold text-[#1E1B18]">{order.project?.title || 'Handcrafted Artisan Item'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#6B635B]">Maker / Workshop:</span>
                            <span className="font-bold text-[#1E1B18]">{order.vendor?.full_name || 'Verified Maker'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#6B635B]">Gross Locked Escrow:</span>
                            <span className="font-mono font-bold text-[#1E1B18]">₹{order.gross_amount?.toLocaleString('en-IN') || '10,000'}</span>
                        </div>
                        <div className="flex justify-between text-[#ED6C02]">
                            <span>Section 194-O TDS (1%):</span>
                            <span className="font-mono font-semibold">- ₹{order.withheld_tds?.toLocaleString('en-IN') || '100'}</span>
                        </div>
                        <div className="flex justify-between text-[#2E7D32] pt-2 border-t border-[#E8E2D9] font-bold">
                            <span>Net Artisan Payout:</span>
                            <span className="font-mono">₹{order.net_payout?.toLocaleString('en-IN') || '9,900'}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-[#E8E2D9] text-[11px]">
                            <span className="text-[#6B635B]">Carrier & Tracking:</span>
                            <span className="font-mono font-semibold text-[#1E1B18]">{order.carrier_code || 'DELHIVERY'} • {order.tracking_id || 'TRK-849201'}</span>
                        </div>
                    </div>

                    {/* 48-Hour Dispute Buffer Banner */}
                    {order.status === 'DELIVERED_PENDING_BUFFER' && (
                        <div className="bg-[#FFF4E5] border border-[#ED6C02]/30 p-4 rounded-xl mb-4 text-xs animate-fade-in">
                            <div className="flex items-center gap-2 text-[#ED6C02] font-bold mb-1">
                                <Clock className="w-4 h-4 shrink-0" />
                                <span>48-Hour Inspection Buffer Active</span>
                            </div>
                            <p className="text-[#6B635B] leading-relaxed mb-3">
                                Carrier confirmed delivery. You have <strong>48 hours</strong> to inspect your handcrafted item. If no dispute is raised, funds auto-release to the maker.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleUpdateStatus('RELEASED')}
                                    className="btn-primary text-xs py-2 px-3 font-semibold flex items-center gap-1"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Accept Item & Release Funds Now</span>
                                </button>
                                <button
                                    onClick={() => setIsDisputeOpen(true)}
                                    className="btn-ghost text-xs py-2 px-3 text-[#D32F2F] hover:bg-[#FDEDED] font-semibold"
                                >
                                    Raise Dispute
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Disputed Status Banner */}
                    {order.status === 'DISPUTED' && (
                        <div className="bg-[#FDEDED] border border-[#F5C2C7] p-4 rounded-xl text-xs text-[#D32F2F] mb-4 animate-fade-in">
                            <div className="flex items-center gap-2 font-bold mb-1">
                                <ShieldAlert className="w-4 h-4 shrink-0" />
                                <span>Dispute Lodged & Escalated to Admin Triage</span>
                            </div>
                            <p className="text-[#6B635B] leading-relaxed">
                                Automated payout timer is paused. Our compliance team is inspecting evidence.
                            </p>
                            {order.dispute_reason && (
                                <p className="mt-2 text-xs italic bg-white/60 p-2 rounded border border-[#F5C2C7]">
                                    "{order.dispute_reason}"
                                </p>
                            )}
                            <button
                                onClick={() => handleUpdateStatus('RELEASED')}
                                className="mt-3 text-xs bg-white text-[#2E7D32] border border-[#2E7D32]/30 px-3 py-1.5 rounded-lg font-semibold hover:bg-[#EDF7ED]"
                            >
                                Simulate Admin Dispute Resolution (Release Payout)
                            </button>
                        </div>
                    )}

                    {/* Released Status Banner */}
                    {order.status === 'RELEASED' && (
                        <div className="bg-[#EDF7ED] border border-[#2E7D32]/20 p-4 rounded-xl text-xs text-[#2E7D32] flex items-center gap-2.5 mb-4 animate-fade-in">
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                            <div>
                                <p className="font-bold">Escrow Payout Complete</p>
                                <p className="text-[11px] text-[#6B635B]">
                                    Net funds (₹{order.net_payout?.toLocaleString('en-IN')}) have been disbursed to the artisan's registered bank account.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Dispute Modal Form */}
                    {isDisputeOpen && (
                        <form onSubmit={handleRaiseDispute} className="mt-4 p-4 border border-[#E8E2D9] rounded-xl bg-[#FDFBF7] flex flex-col gap-3 animate-slide-up">
                            <h3 className="text-xs font-bold text-[#1E1B18]">Raise Order Dispute</h3>
                            <textarea
                                required
                                rows={3}
                                placeholder="Detail defects, transit damage, or specification mismatch..."
                                value={disputeReason}
                                onChange={(e) => setDisputeReason(e.target.value)}
                                className="input-base h-auto py-2.5"
                            />
                            <div>
                                <label className="text-[11px] font-semibold text-[#1E1B18] mb-1.5 block">
                                    Photo Evidence (Optional)
                                </label>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#E8E2D9] rounded-lg cursor-pointer hover:border-[#C85A32] transition-colors text-xs text-[#6B635B]">
                                        <ImagePlus className="w-4 h-4 text-[#C85A32]" />
                                        <span>{disputeImage ? disputeImage.name : 'Upload Damage Photo'}</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => setDisputeImage(e.target.files?.[0] || null)}
                                        />
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsDisputeOpen(false)}
                                    className="btn-ghost text-xs py-2 px-3"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingDispute}
                                    className="btn-primary text-xs py-2 px-4 bg-[#D32F2F] hover:bg-[#B71C1C]"
                                >
                                    {submittingDispute ? 'Submitting...' : 'Confirm Dispute Submission'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Escrow Testing & Simulation Toolbar */}
                    <div className="mt-6 pt-5 border-t border-[#E8E2D9]">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-[#6B635B] mb-2 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#C85A32]" />
                            <span>Dual-Rail Logistics Simulator (Test Controls)</span>
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <button
                                onClick={() => handleUpdateStatus('HELD_IN_ESCROW')}
                                className="text-[11px] py-2 px-2.5 bg-[#F3EFEA] hover:bg-[#E8E2D9] rounded-lg font-medium text-[#1E1B18] transition-colors"
                            >
                                1. Lock in Escrow
                            </button>
                            <button
                                onClick={() => handleUpdateStatus('DELIVERED_PENDING_BUFFER')}
                                className="text-[11px] py-2 px-2.5 bg-[#FFF4E5] hover:bg-[#FFE8CC] rounded-lg font-medium text-[#ED6C02] transition-colors"
                            >
                                2. Courier Delivered (48h)
                            </button>
                            <button
                                onClick={() => handleUpdateStatus('RELEASED')}
                                className="text-[11px] py-2 px-2.5 bg-[#EDF7ED] hover:bg-[#D4EDDA] rounded-lg font-medium text-[#2E7D32] transition-colors"
                            >
                                3. Release Payout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}