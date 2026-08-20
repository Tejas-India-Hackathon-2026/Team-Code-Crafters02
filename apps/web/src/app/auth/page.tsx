'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, UserCheck, ArrowRight, Sparkles, Lock } from 'lucide-react';

/** AuthPage serves as the authentication hub for buyer sign-in and artisan maker onboarding */
export default function AuthPage(): React.ReactNode {
    return (
        <main
            aria-label="Karigar Kart Authentication Hub"
            className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4 sm:p-8"
        >
            <div className="card max-w-lg w-full p-8 bg-white border border-[#E8E2D9] rounded-3xl shadow-card text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#C85A32]/10 text-[#C85A32] flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-6 h-6" />
                </div>

                <h1 className="font-display font-bold text-2xl text-[#1E1B18] mb-2">
                    Welcome to Karigar Kart
                </h1>
                <p className="text-xs text-[#6B635B] max-w-sm mx-auto mb-8 leading-relaxed">
                    AI-verified artisan marketplace with Gemini multimodal vision inspection and statutory escrow protection.
                </p>

                <div className="flex flex-col gap-3">
                    <Link
                        href="/login?role=buyer"
                        className="btn-primary text-sm py-3 px-6 flex items-center justify-center gap-2 font-semibold shadow-xs"
                    >
                        <UserCheck className="w-4 h-4" />
                        <span>Continue as Conscious Buyer</span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>

                    <Link
                        href="/login?role=artisan"
                        className="btn-secondary text-sm py-3 px-6 flex items-center justify-center gap-2 font-semibold"
                    >
                        <Sparkles className="w-4 h-4 text-[#C85A32]" />
                        <span>Enter as Verified Artisan Maker</span>
                    </Link>
                </div>

                <div className="mt-8 pt-6 border-t border-[#F3EFEA] flex items-center justify-center gap-4 text-[11px] text-[#6B635B]">
                    <span className="flex items-center gap-1">
                        <Lock className="w-3 h-3 text-[#2E7D32]" />
                        Dual-Rail Escrow Protected
                    </span>
                    <span>•</span>
                    <span>Section 194-O TDS Compliant</span>
                </div>
            </div>
        </main>
    );
}
