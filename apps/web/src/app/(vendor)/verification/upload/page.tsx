'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../../lib/supabaseClient';
import ReelUploader from '../../../../components/media/ReelUploader';
import { ShieldCheck, Palette, Edit3, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ReelUploadPage() {
    const supabase = createClient();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchProfile = async () => {
            // 1. Check local session (fast)
            const { data: { session } } = await supabase.auth.getSession();
            let authUser = session?.user;

            // 2. Fallback to getUser()
            if (!authUser) {
                const { data } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
                authUser = data?.user;
            }

            // 3. Grace period for cookie / localStorage hydration
            if (!authUser) {
                await new Promise((r) => setTimeout(r, 600));
                const { data: { session: retrySession } } = await supabase.auth.getSession();
                authUser = retrySession?.user;
            }

            if (!authUser) {
                if (isMounted) {
                    setLoading(false);
                }
                return;
            }

            if (!isMounted) return;
            setUser(authUser);

            // 1. Check database profile
            const { data: prof } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .maybeSingle();

            if (prof && prof.avatar_url) {
                setProfile(prof);
            } else {
                // Fallback to user metadata
                setProfile({
                    full_name: prof?.full_name || authUser.user_metadata?.full_name || 'Maker Workshop',
                    avatar_url: authUser.user_metadata?.avatar_url || prof?.avatar_url || null,
                    is_vendor: true,
                });
            }
            setLoading(false);
        };

        fetchProfile();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user && isMounted) {
                fetchProfile();
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    if (loading) {
        return (
            <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <p className="text-xs text-[#6B635B] animate-pulse-subtle">Loading video verification...</p>
            </main>
        );
    }

    if (!user) {
        return (
            <main className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
                <div className="p-8 max-w-md w-full text-center flex flex-col items-center gap-4 bg-white border border-[#E8E2D9] rounded-2xl shadow-card">
                    <div className="w-14 h-14 rounded-2xl bg-[#C85A32]/10 text-[#C85A32] flex items-center justify-center">
                        <ShieldCheck className="w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-stone-900 font-display">
                            Artisan Sign In Required
                        </h2>
                        <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                            Sign in to your maker account to upload reel videos and verify products with our AI Vision Pipeline.
                        </p>
                    </div>
                    <Link
                        href="/login?next=/verification/upload"
                        className="btn-primary w-full py-3 text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-2 rounded-xl"
                    >
                        <span>Sign In to Upload</span>
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#FDFBF7] flex flex-col items-center py-10 px-4 sm:px-6">
            <div className="max-w-xl w-full flex flex-col items-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EDF7ED] text-[#2C4A3E] rounded-full text-xs font-semibold mb-3">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    AI Multimodal Vision Pipeline
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1B18] mb-2 font-display text-center">
                    Artisan Product Video Verification
                </h1>
                <p className="text-xs sm:text-sm text-[#6B635B] mb-6 text-center max-w-md">
                    Upload a 30–60s video showcasing your workshop process, physical brand stamp, and the specific handmade product.
                </p>

                {/* Registered Logo Badge for AI Matching */}
                <div className="w-full bg-white border border-[#E8E2D9] rounded-2xl p-4 mb-6 flex items-center justify-between shadow-card">
                    <div className="flex items-center gap-3.5 min-w-0">
                        {profile?.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt="Registered Logo"
                                className="w-12 h-12 rounded-xl object-contain bg-[#FDFBF7] border border-[#E8E2D9] p-1 shadow-sm shrink-0"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-xl bg-[#FFF4E5] border border-[#ED6C02]/30 flex items-center justify-center text-[#ED6C02] shrink-0">
                                <Palette className="w-6 h-6" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-[#1E1B18] truncate">
                                {profile?.full_name || 'Maker Workshop'}
                            </p>
                            {profile?.avatar_url ? (
                                <p className="text-[11px] text-[#2E7D32] flex items-center gap-1 mt-0.5 font-medium">
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                    <span>Brand logo active for video matching</span>
                                </p>
                            ) : (
                                <p className="text-[11px] text-[#ED6C02] flex items-center gap-1 mt-0.5 font-medium">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>No logo uploaded yet.</span>
                                </p>
                            )}
                        </div>
                    </div>

                    <Link
                        href="/verification/onboarding"
                        className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1 shrink-0 font-semibold text-[#C85A32]"
                    >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{profile?.avatar_url ? 'Change Logo' : 'Upload Logo'}</span>
                    </Link>
                </div>

                <ReelUploader defaultCategory={profile?.craft_category || 'woodworking'} />
            </div>
        </main>
    );
}