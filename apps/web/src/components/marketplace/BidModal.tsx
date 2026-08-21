'use client';

import React, { useState } from 'react';
import { X, Send, ShieldCheck } from 'lucide-react';

export interface BidModalProps {
    isOpen: boolean;
    projectId: string;
    projectTitle: string;
    onClose: () => void;
    onSubmitBid: (amount: number, proposal: string) => Promise<void>;
}

/** BidModal allows verified artisans to submit formal proposals with statutory TDS breakdown. */
export function BidModal({
    isOpen,
    projectId,
    projectTitle,
    onClose,
    onSubmitBid,
}: BidModalProps): React.ReactNode {
    const [amount, setAmount] = useState<string>('');
    const [proposal, setProposal] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);

    if (!isOpen) return null;

    const numAmount = parseFloat(amount) || 0;
    const tdsDeduction = Math.round(numAmount * 0.01);
    const netPayout = numAmount - tdsDeduction;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (numAmount <= 0 || !proposal.trim()) return;

        setSubmitting(true);
        try {
            await onSubmitBid(numAmount, proposal.trim());
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="bid-modal-title"
                className="bg-white border border-[#E8E2D9] rounded-3xl p-6 shadow-modal max-w-lg w-full relative"
            >
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-[#6B635B] hover:text-[#1E1B18] cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                <h3 id="bid-modal-title" className="font-display font-bold text-lg text-[#1E1B18] mb-1">
                    Submit Maker Proposal
                </h3>
                <p className="text-xs text-[#6B635B] mb-5">
                    For project: <strong className="text-[#1E1B18]">{projectTitle}</strong>
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1B18] mb-1.5">
                            Bid Quote (INR ₹)
                        </label>
                        <div className="relative flex items-center">
                            <span className="absolute left-3.5 text-[#6B635B] font-semibold font-mono text-sm pointer-events-none">₹</span>
                            <input
                                id="bid-quote-input"
                                type="number"
                                required
                                min="100"
                                placeholder="e.g. 4500"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                style={{ paddingLeft: '2.5rem' }}
                                className="input-base"
                            />
                        </div>
                    </div>

                    {/* Statutory TDS Breakdown */}
                    {numAmount > 0 && (
                        <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl p-3 text-xs flex flex-col gap-1">
                            <div className="flex justify-between text-[#6B635B]">
                                <span>Gross Bid Amount:</span>
                                <span className="font-mono">₹{numAmount.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-[#6B635B]">
                                <span>Statutory Section 194-O TDS (1%):</span>
                                <span className="font-mono text-[#D32F2F]">- ₹{tdsDeduction.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between font-bold text-[#1E1B18] pt-1.5 border-t border-[#E8E2D9]">
                                <span>Estimated Net Payout:</span>
                                <span className="font-mono text-[#2E7D32]">₹{netPayout.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1B18] mb-1.5">
                            Artisan Proposal & Craft Timeline
                        </label>
                        <textarea
                            required
                            rows={3}
                            placeholder="Detail your handcrafted technique, raw materials, and estimated delivery timeline..."
                            value={proposal}
                            onChange={(e) => setProposal(e.target.value)}
                            className="input-base text-xs"
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-ghost flex-1 py-2.5 text-xs font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || numAmount <= 0}
                            className="btn-primary flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                            <Send className="w-3.5 h-3.5" />
                            <span>{submitting ? 'Submitting...' : 'Submit Bid'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default BidModal;
