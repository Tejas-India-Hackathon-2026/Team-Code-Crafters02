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
} from 'lucide-react';
import Link from 'next/link';

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

            setProfile(prof || {
                full_name: authUser.email?.split('@')[0] || 'Artisan Maker',
                is_vendor: true,
                vendor_verified: true,
                avatar_url: authUser.user_metadata?.avatar_url || null,
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
        <main className="min-h-screen bg-[#FDFBF7] py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto flex flex-col gap-8">
                {/* ─── LEVEL 1: WELCOME HERO & DASHBOARD CTA ────────────────────── */}
                <div className="bg-white border border-[#E8E2D9] rounded-3xl p-6 sm:p-8 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="flex flex-col gap-2 max-w-xl z-10">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EDF7ED] text-[#2E7D32] rounded-full text-xs font-bold w-fit">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>✓ Verified Artisan Mode</span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1B18] font-display">
                            Welcome to Artisan Mode, {artisanName}!
                        </h1>

                        <p className="text-xs sm:text-sm text-[#6B635B] leading-relaxed">
                            This is your dedicated maker portal. Here you can upload authentic craft videos, receive buyer inquiries, submit bids for custom regional commissions, and manage your workshop catalog.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto shrink-0 z-10">
                        <Link
                            href="/dashboard"
                            className="btn-primary py-3 px-6 text-sm font-semibold flex items-center justify-center gap-2 shadow-sm"
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            <span>Go to Maker Dashboard</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            href="/dashboard?tab=upload"
                            className="btn-ghost py-2 px-4 text-xs font-semibold flex items-center justify-center gap-1.5 text-[#C85A32]"
                        >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Upload New Product Reel</span>
                        </Link>
                    </div>

                    {/* Subtle decorative background pattern */}
                    <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-5 pointer-events-none">
                        <Palette className="w-64 h-64 text-[#C85A32]" />
                    </div>
                </div>

                {/* ─── LEVEL 2: WHAT YOU CAN DO IN ARTISAN MODE ─────────────────── */}
                <div>
                    <div className="mb-4">
                        <h2 className="text-sm font-bold text-[#1E1B18] font-display uppercase tracking-wider">
                            What You Can Do in Artisan Mode
                        </h2>
                        <p className="text-xs text-[#6B635B]">
                            Explore the core tools and workflows built specifically for handmade makers:
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* 1. AI Video Reels */}
                        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between">
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-[#FFF4E5] text-[#C85A32] flex items-center justify-center mb-3">
                                    <UploadCloud className="w-5 h-5" />
                                </div>
                                <h3 className="font-display font-bold text-sm text-[#1E1B18] mb-1">
                                    AI-Verified Product Reels
                                </h3>
                                <p className="text-xs text-[#6B635B] leading-relaxed mb-4">
                                    Upload 30–60s vertical videos of your handcrafting process. Gemini AI inspects the video against your registered workshop logo and assigns limited-edition batch markings.
                                </p>
                            </div>
                            <Link
                                href="/dashboard?tab=upload"
                                className="text-xs text-[#C85A32] font-semibold hover:underline flex items-center gap-1 pt-3 border-t border-[#F3EFEA]"
                            >
                                <span>Upload Product Reel</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        {/* 2. Buyer Chats & Orders */}
                        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between">
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-[#EDF7ED] text-[#2E7D32] flex items-center justify-center mb-3">
                                    <MessageSquare className="w-5 h-5" />
                                </div>
                                <h3 className="font-display font-bold text-sm text-[#1E1B18] mb-1">
                                    Buyer Chats & 1-on-1 Orders
                                </h3>
                                <p className="text-xs text-[#6B635B] leading-relaxed mb-4">
                                    Connect directly with buyers interested in specific handcrafted products. Discuss custom modifications, generate TDS-compliant in-chat quotes, and receive escrow payments.
                                </p>
                            </div>
                            <Link
                                href="/dashboard?tab=orders"
                                className="text-xs text-[#2E7D32] font-semibold hover:underline flex items-center gap-1 pt-3 border-t border-[#F3EFEA]"
                            >
                                <span>View Buyer Inquiries</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        {/* 3. Regional Custom Commissions */}
                        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between">
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-[#FFF4E5] text-[#ED6C02] flex items-center justify-center mb-3">
                                    <FolderOpen className="w-5 h-5" />
                                </div>
                                <h3 className="font-display font-bold text-sm text-[#1E1B18] mb-1">
                                    Custom Project Commissions
                                </h3>
                                <p className="text-xs text-[#6B635B] leading-relaxed mb-4">
                                    Browse bespoke project requests posted by buyers in your geographic region. Submit custom pricing and delivery timelines as a verified maker.
                                </p>
                            </div>
                            <Link
                                href="/dashboard?tab=commissions"
                                className="text-xs text-[#ED6C02] font-semibold hover:underline flex items-center gap-1 pt-3 border-t border-[#F3EFEA]"
                            >
                                <span>Browse Open Commissions</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        {/* 4. Workshop Profile & Brand */}
                        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between">
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-[#F3EFEA] text-[#1E1B18] flex items-center justify-center mb-3">
                                    <Settings className="w-5 h-5" />
                                </div>
                                <h3 className="font-display font-bold text-sm text-[#1E1B18] mb-1">
                                    Workshop Brand & Settings
                                </h3>
                                <p className="text-xs text-[#6B635B] leading-relaxed mb-4">
                                    Update your workshop brand logo, craft specializations (Woodworking, Pottery, Handloom, etc.), workshop location, and business tax details.
                                </p>
                            </div>
                            <Link
                                href="/dashboard?tab=settings"
                                className="text-xs text-[#1E1B18] font-semibold hover:underline flex items-center gap-1 pt-3 border-t border-[#F3EFEA]"
                            >
                                <span>Manage Workshop Settings</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
