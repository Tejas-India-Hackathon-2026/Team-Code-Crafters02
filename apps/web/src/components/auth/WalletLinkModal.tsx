'use client';

import { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';

export default function WalletLinkModal() {
    const { address, isConnected } = useAccount();
    const { signMessageAsync } = useSignMessage();
    const [status, setStatus] = useState<string>('');

    const linkWallet = async () => {
        if (!isConnected || !address) return;

        try {
            setStatus('Requesting signature challenge...');
            const res = await fetch('/api/auth/wallet/nonce');
            const { nonce } = await res.json();

            const message = `Sign in with Ethereum to Handmade Marketplace: Nonce ${nonce}`;
            const signature = await signMessageAsync({ account: address, message });

            setStatus('Verifying on-chain identity...');
            const verifyRes = await fetch('/api/auth/wallet/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address, signature, message }),
            });

            if (!verifyRes.ok) throw new Error('Wallet binding failed');

            setStatus('Wallet successfully linked to your profile!');
        } catch (err: any) {
            setStatus(`Error: ${err.message}`);
        }
    };

    return (
        <div className="p-5 border border-[#E8E2D9] rounded-xl bg-white flex flex-col gap-3">
            <h3 className="font-semibold text-lg text-[#1E1B18]">Web3 Wallet Linkage (Opt-In)</h3>
            <p className="text-sm text-[#6B635B]">
                Connect your EVM wallet to enable smart contract escrow rails.
            </p>
            {isConnected ? (
                <button
                    onClick={linkWallet}
                    className="bg-[#2C4A3E] text-white hover:bg-[#223B31] px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                >
                    Sign Challenge to Bind {address?.slice(0, 6)}...{address?.slice(-4)}
                </button>
            ) : (
                <p className="text-xs text-[#E08E45]">Please connect your browser wallet via RainbowKit first.</p>
            )}
            {status && <p className="text-xs text-[#6B635B] mt-1">{status}</p>}
        </div>
    );
}