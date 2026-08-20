'use client';

import { useState } from 'react';
import { CreditCard, Coins, CheckCircle, ShieldCheck } from 'lucide-react';

interface CheckoutModalProps {
    projectId: string;
    vendorId: string;
    grossAmount: number;
    onClose: () => void;
}

export default function DualRailCheckoutModal({
    projectId,
    vendorId,
    grossAmount,
    onClose,
}: CheckoutModalProps) {
    const [selectedRail, setSelectedRail] = useState<'WEB2_NODAL' | 'WEB3_CONTRACT'>('WEB2_NODAL');
    const [loading, setLoading] = useState(false);
    const [successInfo, setSuccessInfo] = useState<string | null>(null);

    const handlePay = async () => {
        try {
            setLoading(true);
            if (selectedRail === 'WEB2_NODAL') {
                const res = await fetch('/api/escrow/web2/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ projectId, vendorId, grossAmount }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Nodal initialization failed');
                setSuccessInfo(`Order initialized. Redirecting to payment: ${data.nodalPaymentUrl}`);
            } else {
                setSuccessInfo('Web3 Escrow created on-chain via Wagmi. Funds held in USDC contract.');
            }
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-[#E8E2D9] rounded-2xl max-w-md w-full p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-6 h-6 text-[#C85A32]" />
                    <h2 className="text-lg font-bold text-[#1E1B18]">Dual-Rail Escrow Funding</h2>
                </div>

                <p className="text-xs text-[#6B635B] mb-4">
                    Choose your payment method. Funds are held safely in escrow until you confirm delivery or 48 hours pass post-delivery.
                </p>

                {/* Rail Selection */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                    <button
                        onClick={() => setSelectedRail('WEB2_NODAL')}
                        className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedRail === 'WEB2_NODAL'
                                ? 'border-[#C85A32] bg-[#FDFBF7] text-[#C85A32] font-semibold'
                                : 'border-[#E8E2D9] bg-white text-[#1E1B18]'
                            }`}
                    >
                        <CreditCard className="w-5 h-5" />
                        <span className="text-xs">UPI / Bank (Nodal)</span>
                    </button>

                    <button
                        onClick={() => setSelectedRail('WEB3_CONTRACT')}
                        className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedRail === 'WEB3_CONTRACT'
                                ? 'border-[#C85A32] bg-[#FDFBF7] text-[#C85A32] font-semibold'
                                : 'border-[#E8E2D9] bg-white text-[#1E1B18]'
                            }`}
                    >
                        <Coins className="w-5 h-5" />
                        <span className="text-xs">Crypto USDC (Web3)</span>
                    </button>
                </div>

                <div className="bg-[#F3EFEA] p-3 rounded-lg text-xs flex justify-between mb-5 font-mono">
                    <span>Amount to lock in escrow:</span>
                    <span className="font-bold text-[#1E1B18]">₹{grossAmount.toLocaleString('en-IN')}</span>
                </div>

                {successInfo ? (
                    <div className="p-3 bg-[#EDF7ED] border border-[#2E7D32]/20 rounded-lg text-xs text-[#2E7D32] flex items-center gap-2 mb-4">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{successInfo}</span>
                    </div>
                ) : (
                    <button
                        onClick={handlePay}
                        disabled={loading}
                        className="w-full bg-[#C85A32] hover:bg-[#B04B26] text-white py-2.5 rounded-lg text-xs font-medium transition-all shadow-sm active:scale-[0.98] disabled:opacity-60"
                    >
                        {loading ? 'Locking Escrow...' : 'Confirm & Deposit Funds'}
                    </button>
                )}

                <button
                    onClick={onClose}
                    className="w-full mt-2 text-xs text-[#6B635B] hover:text-[#1E1B18] py-1.5 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}