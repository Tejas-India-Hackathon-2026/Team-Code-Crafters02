'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabaseClient';
import {
    User,
    Mail,
    ShieldCheck,
    Palette,
    ShoppingBag,
    UploadCloud,
    CheckCircle2,
    ArrowRight,
    Building2,
    Calendar,
    LogOut,
    Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
    const supabase = createClient();
    const router = useRouter();

    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fullName, setFullName] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [statusMsg, setStatusMsg] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setLoading(true);
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
            router.push('/login?next=/profile');
            return;
        }

        setUser(authUser);

        const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();

        if (prof) {
            setProfile(prof);
            setFullName(prof.full_name || authUser.user_metadata?.full_name || '');
            setAvatarPreview(prof.avatar_url || authUser.user_metadata?.avatar_url || null);
        } else {
            const fallback = {
                id: authUser.id,
                full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
                is_vendor: !!authUser.user_metadata?.is_vendor,
                vendor_verified: false,
                avatar_url: null,
            };
            setProfile(fallback);
            setFullName(fallback.full_name);
        }

        setLoading(false);
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onload = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        setStatusMsg('');

        try {
            let avatarUrl = avatarPreview || '';

            if (avatarFile) {
                const formData = new FormData();
                formData.append('logo', avatarFile);
                formData.append('email', user.email || 'user');

                const uploadRes = await fetch('/api/auth/upload-logo', {
                    method: 'POST',
                    body: formData,
                });

                const uploadData = await uploadRes.json();
                if (uploadRes.ok && uploadData.logoUrl) {
                    avatarUrl = uploadData.logoUrl;
                }
            }

            const res = await fetch('/api/auth/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    fullName: fullName.trim(),
                    avatarUrl,
                    isVendor: profile?.is_vendor,
                }),
            });

            await supabase
                .from('profiles')
                .update({
                    full_name: fullName.trim(),
                    avatar_url: avatarUrl,
                })
                .eq('id', user.id);

            if (!res.ok) {
                console.warn('API sync notice:', await res.text().catch(() => ''));
            }

            setStatusMsg('Profile updated successfully!');
            loadProfile();
        } catch (err: any) {
            setStatusMsg(`Error: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <p className="text-xs text-[#6B635B] animate-pulse-subtle">Loading profile...</p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#FDFBF7] py-10 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#E8E2D9]">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#C85A32] flex items-center justify-center text-white font-bold text-lg font-display shadow-sm overflow-hidden">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                fullName?.charAt(0)?.toUpperCase() || <User className="w-6 h-6" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-[#1E1B18] font-display">
                                {fullName || 'My Account'}
                            </h1>
                            <p className="text-xs text-[#6B635B] flex items-center gap-1.5 mt-0.5">
                                <Mail className="w-3 h-3" />
                                {user?.email}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleSignOut}
                        className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5 text-[#D32F2F] hover:bg-[#FDEDED]"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                    </button>
                </div>

                {/* Role Status Card */}
                <div className="card p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            profile?.is_vendor ? 'bg-[#EDF7ED] text-[#2C4A3E]' : 'bg-[#F3EFEA] text-[#6B635B]'
                        }`}>
                            {profile?.is_vendor ? <Palette className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs uppercase font-bold text-[#1E1B18]">
                                    {profile?.is_vendor ? 'Artisan Maker Account' : 'Buyer / Shopper Account'}
                                </span>
                                {profile?.is_vendor && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        profile?.vendor_verified ? 'bg-[#2E7D32] text-white' : 'bg-[#ED6C02] text-white'
                                    }`}>
                                        {profile?.vendor_verified ? '✓ Verified Maker' : 'Unverified'}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-[#6B635B] mt-0.5">
                                {profile?.is_vendor
                                    ? 'You have access to Maker Dashboard and Video Verification.'
                                    : 'You can commission custom handmade goods and message makers.'}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        {profile?.is_vendor ? (
                            <Link
                                href="/dashboard"
                                className="btn-secondary text-xs py-2 px-4 flex-1 sm:flex-initial text-center"
                            >
                                Maker Dashboard
                            </Link>
                        ) : (
                            <Link
                                href="/verification/onboarding"
                                className="btn-primary text-xs py-2 px-4 flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                Become an Artisan
                            </Link>
                        )}
                    </div>
                </div>

                {/* Edit Profile Form */}
                <div className="card p-6 bg-white">
                    <h2 className="text-sm font-bold text-[#1E1B18] font-display uppercase tracking-wider mb-4">
                        Profile Details
                    </h2>

                    {statusMsg && (
                        <div className={`mb-4 p-3 rounded-lg text-xs font-medium ${
                            statusMsg.startsWith('Error')
                                ? 'bg-[#FDEDED] text-[#D32F2F] border border-[#F5C2C7]'
                                : 'bg-[#EDF7ED] text-[#2E7D32] border border-[#2E7D32]/20'
                        }`}>
                            {statusMsg}
                        </div>
                    )}

                    <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                        {/* Avatar / Logo */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1B18] mb-1.5">
                                {profile?.is_vendor ? 'Workshop Brand Logo' : 'Profile Picture'}
                            </label>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-[#FDFBF7] border border-[#E8E2D9] overflow-hidden flex items-center justify-center shrink-0">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-6 h-6 text-[#6B635B]" />
                                    )}
                                </div>
                                <label className="btn-ghost text-xs py-2 px-3 cursor-pointer">
                                    Upload New Picture
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Full Name */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1B18] mb-1.5">
                                Full Name / Display Name
                            </label>
                            <div className="relative flex items-center">
                                <User className="absolute left-3.5 w-4 h-4 text-[#6B635B] pointer-events-none" />
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    style={{ paddingLeft: '2.5rem' }}
                                    className="input-base"
                                />
                            </div>
                        </div>

                        {/* Email (Readonly) */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1B18] mb-1.5">
                                Email Address
                            </label>
                            <div className="relative flex items-center">
                                <Mail className="absolute left-3.5 w-4 h-4 text-[#6B635B] pointer-events-none" />
                                <input
                                    type="email"
                                    disabled
                                    value={user?.email || ''}
                                    style={{ paddingLeft: '2.5rem' }}
                                    className="input-base bg-[#F3EFEA] text-[#6B635B] cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-primary py-2.5 mt-2"
                        >
                            {saving ? 'Saving Changes...' : 'Save Profile'}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
