'use client';

import { useState } from 'react';
import { Receipt, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface QuoteCardProps {
    isVendor?: boolean;
    isVerified?: boolean;
    title?: string;
    grossPrice?: number;
    onAcceptAndFund?: (grossAmount: number, tdsAmount: number, netAmount: number) => void;
    onSendQuoteMessage?: (quoteText: string) => void;
}

export default function QuoteCard({
    isVendor = false,
    isVerified = false,
    title = 'Custom Bridal Katan Silk Saree (6.3m)',
    grossPrice = 24500,
    onAcceptAndFund,
    onSendQuoteMessage,
}: QuoteCardProps) {
    const [milestoneTitle, setMilestoneTitle] = useState(title);
    const [grossAmount, setGrossAmount] = useState<number>(grossPrice);
    const [isCreatingQuote, setIsCreatingQuote] = useState(false);

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
                <span className="text-[10px] uppercase font-bold text-white bg-[#2C4A3E] px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1 shadow-xs">
                    <ShieldCheck className="w-3 h-3" />
                    ESCROW READY
                </span>
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
                            <span className="font-bold text-[#1E1B18] font-mono">₹{grossAmount.toLocaleString('en-IN')}</span>
                        </div>

                        <div className="flex justify-between items-center text-xs text-[#D32F2F]">
                            <span>1% TDS (Section 194-O)</span>
                            <span className="font-bold font-mono">-₹{tdsWithheld.toLocaleString('en-IN')}</span>
                        </div>

                        <div className="flex justify-between items-center text-xs font-bold text-[#1E1B18] pt-2 border-t border-[#E8E2D9]">
                            <span>Maker Net Payout</span>
                            <span className="font-mono text-[#2E7D32]">₹{netPayout.toLocaleString('en-IN')}</span>
                        </div>
                    </div>

                    <div className="mt-1">
                        {isVendor && isVerified ? (
                            <button
                                onClick={() => setIsCreatingQuote(true)}
                                className="w-full border border-[#E8E2D9] bg-white hover:bg-[#F3EFEA] text-xs font-semibold py-2.5 rounded-xl transition-all"
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