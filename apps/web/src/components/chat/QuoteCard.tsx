'use client';

import { useState } from 'react';
import { Receipt, ArrowRight } from 'lucide-react';

interface QuoteCardProps {
    isVendor: boolean;
    isVerified: boolean;
    onAcceptAndFund?: (grossAmount: number, tdsAmount: number, netAmount: number) => void;
    onSendQuoteMessage?: (quoteText: string) => void;
}

export default function QuoteCard({
    isVendor,
    isVerified,
    onAcceptAndFund,
    onSendQuoteMessage,
}: QuoteCardProps) {
    const [milestoneTitle, setMilestoneTitle] = useState('Full Commission Delivery');
    const [grossAmount, setGrossAmount] = useState<number>(10000);
    const [isCreatingQuote, setIsCreatingQuote] = useState(false);

    // Section 194-O TDS calculation (1%)
    const tdsWithheld = grossAmount * 0.01;
    const netPayout = grossAmount - tdsWithheld;

    const handleEmitQuote = () => {
        const quotePayload = `[QUOTE_PROPOSAL] Milestone: "${milestoneTitle}" | Gross: ₹${grossAmount} | TDS (1% Sec 194-O): ₹${tdsWithheld} | Net: ₹${netPayout}`;
        if (onSendQuoteMessage) {
            onSendQuoteMessage(quotePayload);
        }
        setIsCreatingQuote(false);
    };

    return (
        <div className="bg-[#FDFBF7] border-2 border-[#C85A32]/30 rounded-xl p-4 my-3 shadow-sm max-w-md">
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-2 mb-3">
                <div className="flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-[#C85A32]" />
                    <span className="font-semibold text-xs text-[#1E1B18]">Maker Milestone Quote Proposal</span>
                </div>
                <span className="text-[10px] uppercase font-semibold text-[#2C4A3E] bg-[#EDF7ED] px-2 py-0.5 rounded">
                    Dual-Rail Escrow Ready
                </span>
            </div>

            {isCreatingQuote && isVendor && isVerified ? (
                <div className="flex flex-col gap-2.5">
                    <div>
                        <label className="text-[11px] font-medium text-[#6B635B] block mb-1">Milestone Description</label>
                        <input
                            type="text"
                            value={milestoneTitle}
                            onChange={(e) => setMilestoneTitle(e.target.value)}
                            className="w-full h-8 px-2.5 border border-[#E8E2D9] rounded-lg text-xs outline-none focus:border-[#C85A32]"
                        />
                    </div>
                    <div>
                        <label className="text-[11px] font-medium text-[#6B635B] block mb-1">Gross Price (INR)</label>
                        <input
                            type="number"
                            value={grossAmount}
                            onChange={(e) => setGrossAmount(Number(e.target.value))}
                            className="w-full h-8 px-2.5 border border-[#E8E2D9] rounded-lg text-xs outline-none focus:border-[#C85A32]"
                        />
                    </div>
                    <button
                        onClick={handleEmitQuote}
                        className="w-full bg-[#C85A32] text-white hover:bg-[#B04B26] py-1.5 rounded-lg text-xs font-medium transition-all"
                    >
                        Post Quote to Chat
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs text-[#1E1B18]">
                        <span>Gross Commission Amount:</span>
                        <span className="font-semibold">₹{grossAmount.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between text-xs text-[#ED6C02]">
                        <span>Section 194-O TDS (1%):</span>
                        <span>- ₹{tdsWithheld.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between text-xs font-bold text-[#2C4A3E] pt-2 border-t border-[#E8E2D9]">
                        <span>Net Artisan Payout:</span>
                        <span>₹{netPayout.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="mt-3 flex gap-2">
                        {isVendor && isVerified ? (
                            <button
                                onClick={() => setIsCreatingQuote(true)}
                                className="w-full border border-[#E8E2D9] bg-white hover:bg-[#F3EFEA] text-xs font-medium py-2 rounded-lg transition-all"
                            >
                                Modify Milestone Quote
                            </button>
                        ) : (
                            <button
                                onClick={() => onAcceptAndFund && onAcceptAndFund(grossAmount, tdsWithheld, netPayout)}
                                className="w-full bg-[#C85A32] text-white hover:bg-[#B04B26] py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98]"
                            >
                                <span>Accept & Fund Escrow</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}