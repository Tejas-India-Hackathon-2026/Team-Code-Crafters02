'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabaseClient';
import {
    ShieldCheck,
    LayoutDashboard,
    UploadCloud,
    MessageSquare,
    FolderOpen,
    Settings,
    ArrowRight,
    Sparkles,
    CheckCircle2,
    Package,
    Palette,
    Award,
    Compass,
    AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { KintoCard, KintoBadge } from '../../../components/ui/kinto-card';

export default function ArtisanWelcomePage() {
    const supabase = createClient();
    const router = useRouter();

    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkArtisan = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) {
                router.push('/login?next=/artisan');
                return;
            }
            setUser(authUser);

            const { data: prof } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .maybeSingle();

            let cachedLoc = '';
            let cachedLogo = null;
            if (typeof window !== 'undefined') {
                try {
                    const savedRaw = localStorage.getItem(`karigar_workshop_profile_${authUser.id}`);
                    if (savedRaw) {
                        const saved = JSON.parse(savedRaw);
                        if (saved.location) cachedLoc = saved.location;
                        if (saved.avatarUrl) cachedLogo = saved.avatarUrl;
                    }
                } catch (e) {}
            }

            const finalLogo = cachedLogo || prof?.avatar_url || authUser.user_metadata?.avatar_url || null;
            const finalLoc = cachedLoc || authUser.user_metadata?.location || '';
            const isVerified = !!(finalLogo && finalLoc && finalLoc.trim().length > 0);

            setProfile({
                id: authUser.id,
                full_name: prof?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Artisan Maker',
                is_vendor: true,
                vendor_verified: isVerified,
                avatar_url: finalLogo,
            });
            setLoading(false);
        };

        checkArtisan();
    }, []);

    if (loading) {
        return (
            <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <p className="text-xs text-[#6B635B] animate-pulse-subtle">Loading Artisan Portal...</p>
            </main>
        );
    }

    const artisanName = profile?.full_name || user?.email?.split('@')[0] || 'Maker';

    return (
        <main className="min-h-screen bg-[#FAF7F2] text-stone-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Dot Matrix Atmosphere */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.14] kinto-dot-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,#000_70%,transparent_100%)]"
            />

            <div className="max-w-5xl mx-auto flex flex-col gap-10 relative">
                {/* ─── LEVEL 1: WELCOME HERO & DASHBOARD CTA ────────────────────── */}
                <KintoCard glow className="p-7 sm:p-9 shadow-lg">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                        <div className="flex flex-col gap-3 max-w-xl">
                            <div className="flex items-center gap-2">
                                {profile?.vendor_verified ? (
                                    <KintoBadge variant="success" dot={true}>
                                        AI-VERIFIED MAKER PORTAL
                                    </KintoBadge>
                                ) : (
                                    <KintoBadge variant="brand" dot={true}>
                                        UNVERIFIED MAKER — SETUP REQUIRED
                                    </KintoBadge>
                                )}
                            </div>

                            <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-950 font-display tracking-tight">
                                Welcome to Artisan Mode,{' '}
                                <span className="text-[#C85A32]">{artisanName}</span>!
                            </h1>

                            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
                                Your maker workspace. Upload craft process reels, manage buyer inquiries, submit bespoke bids for custom commissions, and maintain your workshop identity.
                            </p>

                            {!profile?.vendor_verified && (
                                <div className="p-3 bg-[#FFF9F2] border border-[#ED6C02]/30 rounded-xl text-xs text-[#8A4A00] flex items-center justify-between gap-3 mt-1 shadow-2xs">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-[#ED6C02] shrink-0" />
                                        <span>
                                            <strong>Setup needed:</strong> Upload your Workshop Logo & Location to activate your Verified Maker badge.
                                        </span>
                                    </div>
                                    <Link
                                        href="/dashboard?tab=settings"
                                        className="btn-secondary text-[11px] py-1 px-2.5 font-bold shrink-0 bg-white text-[#ED6C02] border-[#ED6C02]/40 hover:bg-[#FFF4E5]"
                                    >
                                        Setup Now
                                    </Link>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
                            <Link
                                href="/dashboard"
                                className="btn-primary py-3 px-6 text-sm font-semibold rounded-full flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all"
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                <span>Go to Maker Dashboard</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href="/dashboard?tab=upload"
                                className="btn-ghost py-2.5 px-5 text-xs font-semibold rounded-full flex items-center justify-center gap-1.5 bg-white border border-stone-200/90 text-stone-800 hover:bg-stone-100 transition-all shadow-2xs"
                            >
                                <UploadCloud className="w-3.5 h-3.5 text-[#C85A32]" />
                                <span>Upload New Product Reel</span>
                            </Link>
                        </div>
                    </div>
                </KintoCard>

                {/* ─── LEVEL 2: WHAT YOU CAN DO IN ARTISAN MODE ─────────────────── */}
                <div>
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-[#C85A32] uppercase tracking-widest block font-mono mb-1">
                                WORKSHOP WORKFLOWS
                            </span>
                            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-display">
                                Artisan Tools & Capabilities
                            </h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* 1. AI Video Reels */}
                        <KintoCard glow className="p-6 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-stone-100 text-[#C85A32] flex items-center justify-center">
                                        <UploadCloud className="w-5 h-5" />
                                    </div>
                                    <span className="font-mono text-xs font-bold text-[#C85A32]">
                                        01 / REELS
                                    </span>
                                </div>
                                <h3 className="font-display font-bold text-base text-stone-900 mb-2">
                                    AI-Verified Product Reels
                                </h3>
                                <p className="text-xs text-stone-600 leading-relaxed mb-4">
                                    Upload 30–60s vertical videos of your handcrafting process. Gemini AI inspects the video against your registered workshop logo and assigns limited-edition batch markings.
                                </p>
                            </div>
                            <Link
                                href="/dashboard?tab=upload"
                                className="text-xs text-[#C85A32] font-semibold hover:text-[#B04B26] flex items-center gap-1 pt-3.5 border-t border-stone-100 group font-mono"
                            >
                                <span>Upload Product Reel</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </KintoCard>

                        {/* 2. Buyer Chats & Orders */}
                        <KintoCard glow className="p-6 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-[#EDF7ED] text-[#2E7D32] flex items-center justify-center">
                                        <MessageSquare className="w-5 h-5" />
                                    </div>
                                    <span className="font-mono text-xs font-bold text-[#2E7D32]">
                                        02 / ORDERS
                                    </span>
                                </div>
                                <h3 className="font-display font-bold text-base text-stone-900 mb-2">
                                    Buyer Chats & 1-on-1 Orders
                                </h3>
                                <p className="text-xs text-stone-600 leading-relaxed mb-4">
                                    Connect directly with buyers interested in specific handcrafted products. Discuss custom modifications, generate TDS-compliant in-chat quotes, and receive escrow payments.
                                </p>
                            </div>
                            <Link
                                href="/dashboard?tab=orders"
                                className="text-xs text-[#2E7D32] font-semibold hover:text-[#1B5E20] flex items-center gap-1 pt-3.5 border-t border-stone-100 group font-mono"
                            >
                                <span>View Buyer Inquiries</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </KintoCard>

                        {/* 3. Regional Custom Commissions */}
                        <KintoCard glow className="p-6 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-[#FFF4E5] text-[#ED6C02] flex items-center justify-center">
                                        <FolderOpen className="w-5 h-5" />
                                    </div>
                                    <span className="font-mono text-xs font-bold text-[#ED6C02]">
                                        03 / BIDS
                                    </span>
                                </div>
                                <h3 className="font-display font-bold text-base text-stone-900 mb-2">
                                    Custom Project Commissions
                                </h3>
                                <p className="text-xs text-stone-600 leading-relaxed mb-4">
                                    Browse bespoke project requests posted by buyers in your geographic region. Submit custom pricing and delivery timelines as a verified maker.
                                </p>
                            </div>
                            <Link
                                href="/dashboard?tab=commissions"
                                className="text-xs text-[#ED6C02] font-semibold hover:text-[#C45500] flex items-center gap-1 pt-3.5 border-t border-stone-100 group font-mono"
                            >
                                <span>Browse Open Commissions</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </KintoCard>

                        {/* 4. Workshop Profile & Brand */}
                        <KintoCard glow className="p-6 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center">
                                        <Settings className="w-5 h-5" />
                                    </div>
                                    <span className="font-mono text-xs font-bold text-stone-500">
                                        04 / BRAND
                                    </span>
                                </div>
                                <h3 className="font-display font-bold text-base text-stone-900 mb-2">
                                    Workshop Brand & Settings
                                </h3>
                                <p className="text-xs text-stone-600 leading-relaxed mb-4">
                                    Update your workshop brand logo, craft specializations (Woodworking, Pottery, Handloom, etc.), workshop location, and business tax details.
                                </p>
                            </div>
                            <Link
                                href="/dashboard?tab=settings"
                                className="text-xs text-stone-700 font-semibold hover:text-stone-950 flex items-center gap-1 pt-3.5 border-t border-stone-100 group font-mono"
                            >
                                <span>Manage Workshop Profile</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </KintoCard>
                    </div>
                </div>
            </div>
        </main>
    );
}
