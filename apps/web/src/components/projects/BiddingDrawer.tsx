'use client';

import { useState } from 'react';
import { createClient } from '../../lib/supabaseClient';
import { ShieldCheck, Lock, Send } from 'lucide-react';

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

export default function BiddingDrawer({
    projectId,
    isVendor,
    isVerified,
    projectTitle,
    minBudget,
    maxBudget,
    onBidSubmitted,
}: BiddingDrawerProps) {
    const supabase = createClient();
    const [bidAmount, setBidAmount] = useState('');
    const [proposalText, setProposalText] = useState('');
    const [estimatedDays, setEstimatedDays] = useState('7');
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState<string | null>(null);
    const [statusType, setStatusType] = useState<'success' | 'error' | 'info' | null>(null);

    const breakdown = calculateBidBreakdown(parseFloat(bidAmount));

    const handleBidSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatusMsg('');

        if (!isVendor || !isVerified) {
            setStatusMsg('Only AI-verified artisans can place bids on projects.');
            return;
        }

        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Unauthorized');

            const { error } = await supabase.from('project_bids').insert({
                project_id: projectId,
                vendor_id: user.id,
                bid_amount: parseFloat(bidAmount),
                proposal_text: proposalText,
                status: 'PENDING',
            });

            if (error) throw error;

            setStatusMsg('Bid proposal submitted successfully!');
            setBidAmount('');
            setProposalText('');
            if (onBidSubmitted) onBidSubmitted();
        } catch (err: any) {
            setStatusMsg(`Error: ${err.message}`);
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
            <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-[#2C4A3E]" />
                <h3 className="font-semibold text-sm text-[#1E1B18]">Submit Artisan Commission Proposal</h3>
            </div>

            {statusMsg && (
                <p className="text-xs mb-3 text-[#C85A32] font-medium">{statusMsg}</p>
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

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#2C4A3E] text-white hover:bg-[#223B31] py-2 px-4 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                >
                    <Send className="w-3.5 h-3.5" />
                    {loading ? 'Submitting Bid...' : 'Submit Confidential Bid'}
                </button>
            </form>
        </div>
    );
}