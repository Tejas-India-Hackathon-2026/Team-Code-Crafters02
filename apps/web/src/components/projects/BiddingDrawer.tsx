'use client';

import React, { useState } from 'react';
import { createClient } from '../../lib/supabaseClient';
import { ShieldCheck, Lock, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export interface BidTdsBreakdown {
    grossAmount: number;
    tdsWithholding: number;
    makerNetPayout: number;
    effectiveRate: string;
}

export interface BidFormState {
    bidAmount: string;
    proposalText: string;
    estimatedDays: string;
    loading: boolean;
    statusMsg: string | null;
    statusType: 'success' | 'error' | 'info' | null;
}

export interface BiddingDrawerProps {
    projectId: string;
    isVendor: boolean;
    isVerified: boolean;
    projectTitle?: string;
    minBudget?: number;
    maxBudget?: number;
    onBidSubmitted?: () => void;
}

/**
 * Calculates Section 194-O compliant TDS deductions and net maker earnings.
 * @param amountNum Gross bid amount proposed by the artisan.
 */
export function calculateBidBreakdown(amountNum: number): BidTdsBreakdown {
    const gross = Math.max(0, isNaN(amountNum) ? 0 : amountNum);
    const tds = Math.round(gross * 0.01);
    const net = Math.max(0, gross - tds);
    return {
        grossAmount: gross,
        tdsWithholding: tds,
        makerNetPayout: net,
        effectiveRate: '1% Section 194-O TDS',
    };
}

/**
 * BiddingDrawer enables verified artisans to submit confidential, milestone-backed
 * proposals with live Section 194-O TDS calculations on bespoke commission briefs.
 */
export function BiddingDrawer({
    projectId,
    isVendor,
    isVerified,
    projectTitle,
    minBudget,
    maxBudget,
    onBidSubmitted,
}: BiddingDrawerProps): React.ReactNode {
    const supabase = createClient();
    const [existingBid, setExistingBid] = useState<any>(null);
    const [bidAmount, setBidAmount] = useState('');
    const [proposalText, setProposalText] = useState('');
    const [estimatedDays, setEstimatedDays] = useState('7');
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState<string | null>(null);
    const [statusType, setStatusType] = useState<'success' | 'error' | 'info' | null>(null);

    const breakdown = calculateBidBreakdown(parseFloat(bidAmount));

    // Load existing bid if previously submitted
    React.useEffect(() => {
        const checkExistingBid = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: bid } = await supabase
                    .from('project_bids')
                    .select('*')
                    .eq('project_id', projectId)
                    .eq('vendor_id', user.id)
                    .maybeSingle();

                let foundBid = bid;
                if (!foundBid && typeof window !== 'undefined') {
                    try {
                        const cached = JSON.parse(localStorage.getItem('karigar_project_bids_cache') || '[]');
                        foundBid = cached.find((b: any) => (b.projectId === projectId || b.project_id === projectId) && (b.vendorId === user.id || b.vendor_id === user.id));
                    } catch (e) {}
                }

                if (foundBid) {
                    setExistingBid(foundBid);
                    setBidAmount(foundBid.bid_amount?.toString() || foundBid.amount?.toString() || '');
                    
                    const rawText = foundBid.proposal_text || foundBid.proposalText || '';
                    const turnaroundMatch = rawText.match(/\[ESTIMATED_TURNAROUND:\s*(\d+)\s*Days\]/);
                    if (turnaroundMatch) {
                        setEstimatedDays(turnaroundMatch[1]);
                    }
                    setProposalText(rawText.replace(/\[ESTIMATED_TURNAROUND:\s*\d+\s*Days\]/, '').trim());
                }
            } catch (err) {
                console.error('Error fetching existing bid:', err);
            }
        };

        if (projectId && isVendor) {
            checkExistingBid();
        }
    }, [projectId, isVendor]);

    const handleBidSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatusMsg('');

        if (!isVendor || !isVerified) {
            setStatusMsg('Only AI-verified artisans can place bids on projects.');
            setStatusType('error');
            return;
        }

        const amountNum = parseFloat(bidAmount);
        if (isNaN(amountNum) || amountNum < 100) {
            setStatusMsg('Proposed price must be at least ₹100.');
            setStatusType('error');
            return;
        }

        const cleanProposal = proposalText.trim();
        if (cleanProposal.length < 15) {
            setStatusMsg('Please provide a detailed proposal of at least 15 characters.');
            setStatusType('error');
            return;
        }

        if (cleanProposal.length > 5000) {
            setStatusMsg('Proposal text must not exceed 5000 characters.');
            setStatusType('error');
            return;
        }

        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('You must be signed in as a verified maker.');

            const isUpdate = !!existingBid;
            const fullProposal = `${cleanProposal}\n\n[ESTIMATED_TURNAROUND: ${estimatedDays} Days]`;

            const res = await fetch('/api/vendor/bids/manage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: isUpdate ? 'UPDATE' : 'SUBMIT',
                    projectId: projectId,
                    vendorId: user.id,
                    bidId: existingBid?.id,
                    bidAmount: amountNum,
                    proposalText: fullProposal,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to submit proposal');
            }

            const updatedBidRecord = {
                id: data.bid?.id || existingBid?.id || `bid-${Date.now()}`,
                project_id: projectId,
                projectId: projectId,
                vendor_id: user.id,
                vendorId: user.id,
                bid_amount: amountNum,
                amount: amountNum,
                proposal_text: fullProposal,
                proposalText: fullProposal,
                status: 'PENDING',
                vendor: {
                    full_name: 'Verified Artisan',
                    vendor_verified: true,
                },
            };

            setExistingBid(updatedBidRecord);

            if (typeof window !== 'undefined') {
                try {
                    const currentCache = JSON.parse(localStorage.getItem('karigar_project_bids_cache') || '[]');
                    const filtered = currentCache.filter(
                        (b: any) => !((b.projectId === projectId || b.project_id === projectId) && (b.vendorId === user.id || b.vendor_id === user.id))
                    );
                    localStorage.setItem('karigar_project_bids_cache', JSON.stringify([...filtered, updatedBidRecord]));
                } catch (e) {}
            }

            setStatusMsg(isUpdate ? '✓ Proposal terms successfully updated.' : '✓ Confidential proposal successfully submitted.');
            setStatusType('success');
            if (onBidSubmitted) onBidSubmitted();
        } catch (err: any) {
            setStatusMsg(err.message || 'Failed to submit proposal.');
            setStatusType('error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBid = async () => {
        if (!window.confirm('Are you sure you want to withdraw your proposal from this project?')) {
            return;
        }

        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const res = await fetch('/api/vendor/bids/manage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'DELETE',
                    projectId: projectId,
                    vendorId: user.id,
                    bidId: existingBid?.id,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to withdraw proposal');
            }

            if (typeof window !== 'undefined') {
                try {
                    const currentCache = JSON.parse(localStorage.getItem('karigar_project_bids_cache') || '[]');
                    const filtered = currentCache.filter(
                        (b: any) => !((b.projectId === projectId || b.project_id === projectId) && (b.vendorId === user.id || b.vendor_id === user.id))
                    );
                    localStorage.setItem('karigar_project_bids_cache', JSON.stringify(filtered));
                } catch (e) {}
            }

            setExistingBid(null);
            setBidAmount('');
            setProposalText('');
            setStatusMsg('✓ Your proposal has been withdrawn. You can submit a new bid anytime.');
            setStatusType('info');
            if (onBidSubmitted) onBidSubmitted();
        } catch (err: any) {
            setStatusMsg(err.message || 'Failed to withdraw proposal.');
            setStatusType('error');
        } finally {
            setLoading(false);
        }
    };

    if (!isVendor) {
        return (
            <div className="p-4 bg-[#FDFBF7] border border-[#E8E2D9] rounded-xl text-center">
                <p className="text-xs text-[#6B635B]">
                    You are currently viewing this project as a buyer. Switch to an artisan profile to submit a bid.
                </p>
            </div>
        );
    }

    if (!isVerified) {
        return (
            <div className="p-4 bg-[#FFF4E5] border border-[#ED6C02]/20 rounded-xl text-center flex flex-col items-center">
                <Lock className="w-5 h-5 text-[#ED6C02] mb-1" />
                <p className="text-xs font-medium text-[#ED6C02]">Artisan Verification Required</p>
                <p className="text-[11px] text-[#6B635B] mt-1">
                    You must complete the video reel verification before submitting bids on custom projects.
                </p>
            </div>
        );
    }

    return (
        <div className="p-5 bg-white border border-[#E8E2D9] rounded-xl shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#2C4A3E]" />
                    <h3 className="font-semibold text-sm text-[#1E1B18]">
                        {existingBid ? 'Update Artisan Commission Proposal' : 'Submit Artisan Commission Proposal'}
                    </h3>
                </div>
                {existingBid && (
                    <span className="text-[10px] font-bold bg-[#EDF7ED] text-[#2E7D32] px-2.5 py-0.5 rounded-full uppercase border border-[#2E7D32]/20">
                        Bid Active
                    </span>
                )}
            </div>

            {statusMsg && (
                <div
                    role="alert"
                    aria-live="polite"
                    className={`text-xs p-2.5 rounded-lg mb-3 flex items-center gap-1.5 ${
                        statusType === 'error'
                            ? 'bg-[#FDEDED] text-[#D32F2F] border border-[#D32F2F]/20 font-medium'
                            : statusType === 'success'
                            ? 'bg-[#EDF7ED] text-[#2E7D32] border border-[#2E7D32]/20 font-semibold'
                            : 'bg-[#FFF4E5] text-[#ED6C02] border border-[#ED6C02]/20 font-medium'
                    }`}
                >
                    {statusType === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    <span>{statusMsg}</span>
                </div>
            )}

            <form onSubmit={handleBidSubmit} className="flex flex-col gap-3">
                <div>
                    <label className="block text-[11px] font-semibold uppercase text-[#1E1B18] mb-1">
                        Your Proposed Price (INR)
                    </label>
                    <input
                        type="number"
                        required
                        min="100"
                        placeholder="e.g., 12000"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="w-full h-9 px-3 border border-[#E8E2D9] rounded-lg text-xs outline-none focus:border-[#C85A32]"
                    />
                </div>

                {/* Section 194-O TDS Payout Breakdown */}
                {breakdown.grossAmount > 0 && (
                    <div className="p-3 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs flex flex-col gap-1.5 animate-fade-in">
                        <div className="flex justify-between text-[#6B635B] text-[11px]">
                            <span>Gross Proposal Amount:</span>
                            <span className="font-mono font-medium text-[#1E1B18]">₹{breakdown.grossAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-[#D32F2F] text-[11px]">
                            <span>1% TDS Withholding (Sec 194-O):</span>
                            <span className="font-mono font-medium">-₹{breakdown.tdsWithholding.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="pt-1.5 border-t border-[#E8E2D9] flex justify-between font-bold text-[#2E7D32] text-xs">
                            <span>Net Maker Escrow Payout:</span>
                            <span className="font-mono">₹{breakdown.makerNetPayout.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                        <label className="block text-[11px] font-semibold uppercase text-[#1E1B18] mb-1">
                            Estimated Completion (Days)
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="180"
                            value={estimatedDays}
                            onChange={(e) => setEstimatedDays(e.target.value)}
                            className="w-full h-9 px-3 border border-[#E8E2D9] rounded-lg text-xs outline-none focus:border-[#C85A32]"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-semibold uppercase text-[#1E1B18] mb-1">
                            Target Budget Reference
                        </label>
                        <div className="h-9 px-3 bg-[#F3EFEA] border border-[#E8E2D9] rounded-lg text-xs flex items-center text-[#6B635B] font-mono">
                            {minBudget && maxBudget ? `₹${minBudget.toLocaleString('en-IN')} – ₹${maxBudget.toLocaleString('en-IN')}` : 'Flexible'}
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-[11px] font-semibold uppercase text-[#1E1B18] mb-1">
                        Crafting Proposal & Timeline Details
                    </label>
                    <textarea
                        required
                        rows={3}
                        placeholder="Detail your production process, timber selection, and expected dispatch timeline..."
                        value={proposalText}
                        onChange={(e) => setProposalText(e.target.value)}
                        className="w-full p-2.5 border border-[#E8E2D9] rounded-lg text-xs outline-none focus:border-[#C85A32]"
                    />
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F3EFEA]">
                    {existingBid ? (
                        <button
                            type="button"
                            onClick={handleDeleteBid}
                            disabled={loading}
                            className="text-xs text-[#D32F2F] hover:text-[#B71C1C] font-semibold py-2 px-3 rounded-lg border border-[#D32F2F]/20 hover:bg-[#FDEDED] transition-all cursor-pointer flex items-center gap-1"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Withdraw Bid</span>
                        </button>
                    ) : (
                        <div></div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-[#2C4A3E] text-white hover:bg-[#223B31] py-2 px-4 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                    >
                        <Send className="w-3.5 h-3.5" />
                        {loading
                            ? (existingBid ? 'Updating...' : 'Submitting Bid...')
                            : (existingBid ? 'Update Proposal' : 'Submit Confidential Bid')}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default BiddingDrawer;