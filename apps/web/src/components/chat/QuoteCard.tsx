'use client';

import { useState, useEffect } from 'react';
import { Receipt, ArrowRight, ShieldCheck, CheckCircle2, Truck, Clock } from 'lucide-react';
import Link from 'next/link';
import { AnimatedNumber } from '../ui/animated-number';

interface QuoteCardProps {
    isVendor?: boolean;
    isVerified?: boolean;
    isFinalized?: boolean;
    escrowStatus?: 'AWAITING_PAYMENT' | 'HELD_IN_ESCROW' | 'DELIVERED_PENDING_BUFFER' | 'RELEASED' | 'DISPUTED' | string | null;
    orderId?: string | null;
    title?: string;
    grossPrice?: number;
    onAcceptAndFund?: (grossAmount: number, tdsAmount: number, netAmount: number) => void;
    onSendQuoteMessage?: (quoteText: string) => void;
    onFinalizeOrder?: () => void;
}

export default function QuoteCard({
    isVendor = false,
    isVerified = false,
    isFinalized = false,
    escrowStatus = null,
    orderId = null,
    title = 'Custom Bridal Katan Silk Saree (6.3m)',
    grossPrice = 24500,
    onAcceptAndFund,
    onSendQuoteMessage,
    onFinalizeOrder,
}: QuoteCardProps) {
    const [milestoneTitle, setMilestoneTitle] = useState(title);
    const [grossAmount, setGrossAmount] = useState<number>(grossPrice);
    const [isCreatingQuote, setIsCreatingQuote] = useState(false);

    useEffect(() => {
        if (title) setMilestoneTitle(title);
        if (grossPrice) setGrossAmount(grossPrice);
    }, [title, grossPrice]);

    // Section 194-O TDS calculation (1%)
    const tdsWithheld = Math.round(grossAmount * 0.01);
    const netPayout = grossAmount - tdsWithheld;

    const handleEmitQuote = () => {
        const quotePayload = `[QUOTE_PROPOSAL] Milestone: "${milestoneTitle}" | Gross: ₹${grossAmount.toLocaleString('en-IN')} | TDS (1% Sec 194-O): ₹${tdsWithheld.toLocaleString('en-IN')} | Net: ₹${netPayout.toLocaleString('en-IN')}`;
        if (onSendQuoteMessage) {
            onSendQuoteMessage(quotePayload);
        }
        setIsCreatingQuote(false);
    };

    return (
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 shadow-sm w-full max-w-lg animate-fade-in text-[#1E1B18]">
            {/* Header with badges */}
            <div className="flex items-center justify-between pb-2 mb-3">
                <span className="text-[11px] font-bold tracking-wider text-[#6B635B] uppercase font-mono">
                    FORMAL MAKER QUOTE
                </span>
                {isFinalized ? (
                    <span className="text-[10px] uppercase font-bold text-[#2E7D32] bg-[#EDF7ED] border border-[#2E7D32]/30 px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1 shadow-xs">
                        <CheckCircle2 className="w-3 h-3" />
                        ORDER FINALIZED
                    </span>
                ) : escrowStatus === 'RELEASED' ? (
                    <span className="text-[10px] uppercase font-bold text-[#2E7D32] bg-[#EDF7ED] border border-[#2E7D32]/30 px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1 shadow-xs">
                        <CheckCircle2 className="w-3 h-3" />
                        PAYOUT RELEASED
                    </span>
                ) : escrowStatus === 'DELIVERED_PENDING_BUFFER' ? (
                    <span className="text-[10px] uppercase font-bold text-[#ED6C02] bg-[#FFF4E5] border border-[#ED6C02]/30 px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1 shadow-xs">
                        <Truck className="w-3 h-3" />
                        48H BUFFER ACTIVE
                    </span>
                ) : escrowStatus === 'HELD_IN_ESCROW' ? (
                    <span className="text-[10px] uppercase font-bold text-[#C85A32] bg-[#FAF8F5] border border-[#C85A32]/30 px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1 shadow-xs">
                        <ShieldCheck className="w-3 h-3" />
                        FUNDS IN ESCROW
                    </span>
                ) : (
                    <span className="text-[10px] uppercase font-bold text-white bg-[#2C4A3E] px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1 shadow-xs">
                        <ShieldCheck className="w-3 h-3" />
                        ESCROW READY
                    </span>
                )}
            </div>

            {isCreatingQuote && isVendor && isVerified ? (
                <div className="flex flex-col gap-3">
                    <div>
                        <label className="text-[11px] font-semibold text-[#6B635B] block mb-1">Custom Craft Title & Specs</label>
                        <input
                            type="text"
                            value={milestoneTitle}
                            onChange={(e) => setMilestoneTitle(e.target.value)}
                            className="w-full h-9 px-3 border border-[#E8E2D9] rounded-xl text-xs outline-none focus:border-[#C85A32]"
                            placeholder="e.g. Custom Bridal Katan Silk Saree (6.3m)"
                        />
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-[#6B635B] block mb-1">Gross Price (INR)</label>
                        <input
                            type="number"
                            value={grossAmount}
                            onChange={(e) => setGrossAmount(Number(e.target.value))}
                            className="w-full h-9 px-3 border border-[#E8E2D9] rounded-xl text-xs outline-none focus:border-[#C85A32]"
                        />
                    </div>
                    <button
                        onClick={handleEmitQuote}
                        className="w-full bg-[#C85A32] text-white hover:bg-[#B04B26] py-2 rounded-xl text-xs font-semibold transition-all shadow-sm"
                    >
                        Post Quote to Chat
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    <h3 className="font-display font-bold text-sm sm:text-base text-[#1E1B18]">
                        {milestoneTitle}
                    </h3>

                    {/* Breakdown Box */}
                    <div className="bg-[#FAF8F5] rounded-xl p-3.5 flex flex-col gap-2 border border-[#F3EFEA]">
                        <div className="flex justify-between items-center text-xs text-[#6B635B]">
                            <span>Gross Amount</span>
                            <span className="font-bold text-[#1E1B18] font-mono">
                                <AnimatedNumber value={grossAmount} prefix="₹" />
                            </span>
                        </div>

                        <div className="flex justify-between items-center text-xs text-[#D32F2F]">
                            <span>1% TDS (Section 194-O)</span>
                            <span className="font-bold font-mono">
                                -<AnimatedNumber value={tdsWithheld} prefix="₹" />
                            </span>
                        </div>

                        <div className="flex justify-between items-center text-xs font-bold text-[#1E1B18] pt-2 border-t border-[#E8E2D9]">
                            <span>Maker Net Payout</span>
                            <span className="font-mono text-[#2E7D32]">
                                <AnimatedNumber value={netPayout} prefix="₹" />
                            </span>
                        </div>
                    </div>

                    {/* Live Escrow Payment Status Details */}
                    {escrowStatus === 'RELEASED' && (
                        <div className="bg-[#EDF7ED] border border-[#2E7D32]/30 p-3 rounded-xl flex flex-col gap-2 animate-fade-in">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-[#2E7D32] flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Escrow Payout Complete
                                </span>
                                <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-[#2E7D32]/20 text-[#2E7D32] font-semibold">
                                    ₹{netPayout.toLocaleString('en-IN')} Disbursed
                                </span>
                            </div>
                            <p className="text-[11px] text-[#6B635B]">
                                Net funds have been disbursed to the artisan. Please click below to finalize and close this order discussion.
                            </p>
                        </div>
                    )}

                    {escrowStatus === 'HELD_IN_ESCROW' && (
                        <div className="bg-[#FAF8F5] border border-[#C85A32]/30 p-3 rounded-xl flex flex-col gap-2 animate-fade-in">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-[#C85A32] flex items-center gap-1.5">
                                    <ShieldCheck className="w-4 h-4" />
                                    Funds Protected in Escrow
                                </span>
                                <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-[#E8E2D9] text-[#1E1B18] font-semibold">
                                    ₹{grossAmount.toLocaleString('en-IN')} Locked
                                </span>
                            </div>
                            <p className="text-[11px] text-[#6B635B]">
                                Payment is secured in dual-rail buffer. Payout will be released after delivery inspection.
                            </p>
                        </div>
                    )}

                    {escrowStatus === 'DELIVERED_PENDING_BUFFER' && (
                        <div className="bg-[#FFF4E5] border border-[#ED6C02]/30 p-3 rounded-xl flex flex-col gap-2 animate-fade-in">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-[#ED6C02] flex items-center gap-1.5">
                                    <Truck className="w-4 h-4" />
                                    Courier Delivered (48h Buffer)
                                </span>
                            </div>
                            <p className="text-[11px] text-[#6B635B]">
                                Carrier confirmed delivery. You can inspect the item and release payout.
                            </p>
                        </div>
                    )}

                    <div className="mt-1">
                        {isFinalized ? (
                            <div className="w-full bg-[#EDF7ED] border border-[#2E7D32]/20 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold text-[#2E7D32]">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Order Finalized & Discussion Closed</span>
                            </div>
                        ) : escrowStatus === 'RELEASED' ? (
                            <div className="flex flex-col gap-2">
                                {onFinalizeOrder && (
                                    <button
                                        onClick={onFinalizeOrder}
                                        className="w-full bg-[#2E7D32] hover:bg-[#256628] text-white py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] cursor-pointer"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>✓ Finalize Order & Close Discussion</span>
                                    </button>
                                )}
                                {orderId && (
                                    <Link
                                        href={`/orders/${orderId}`}
                                        className="w-full text-center text-xs text-[#6B635B] hover:text-[#1E1B18] py-1 underline font-medium"
                                    >
                                        View Escrow Receipt & Breakdown →
                                    </Link>
                                )}
                            </div>
                        ) : escrowStatus === 'HELD_IN_ESCROW' || escrowStatus === 'DELIVERED_PENDING_BUFFER' ? (
                            <div className="flex flex-col gap-2">
                                {orderId && (
                                    <Link
                                        href={`/orders/${orderId}`}
                                        className="w-full bg-[#C85A32] hover:bg-[#B04B26] text-white py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] cursor-pointer text-center"
                                    >
                                        <Truck className="w-4 h-4" />
                                        <span>View Logistics & Escrow Pipeline →</span>
                                    </Link>
                                )}
                            </div>
                        ) : isVendor && isVerified ? (
                            <button
                                onClick={() => setIsCreatingQuote(true)}
                                className="w-full border border-[#E8E2D9] bg-white hover:bg-[#F3EFEA] text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer"
                            >
                                Modify Milestone Quote
                            </button>
                        ) : (
                            <button
                                onClick={() => onAcceptAndFund && onAcceptAndFund(grossAmount, tdsWithheld, netPayout)}
                                className="w-full bg-[#C85A32] hover:bg-[#B04B26] text-white py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] cursor-pointer"
                            >
                                <span>₹ Accept & Lock ₹{grossAmount.toLocaleString('en-IN')} in Escrow</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}