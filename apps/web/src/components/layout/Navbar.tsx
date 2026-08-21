'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '../../lib/supabaseClient';
import { getKarigarAuthUser, clearKarigarAuth } from '../../lib/authHelper';
import {
    Home,
    FolderOpen,
    MessageSquare,
    Package,
    ShieldCheck,
    UploadCloud,
    LayoutDashboard,
    LogOut,
    Menu,
    X,
    User,
    ArrowLeftRight,
    Sparkles,
} from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
    id: string;
    full_name: string | null;
    is_vendor: boolean;
    vendor_verified: boolean;
    role?: string;
    avatar_url?: string | null;
}

export default function Navbar() {
    const supabase = createClient();
    const router = useRouter();
    const pathname = usePathname();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [switchingRole, setSwitchingRole] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const user = await getKarigarAuthUser(supabase);

            if (user) {
                const defaultProfile: UserProfile = {
                    id: user.id,
                    full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                    is_vendor: !!user.user_metadata?.is_vendor,
                    vendor_verified: false,
                    avatar_url: user.user_metadata?.avatar_url || null,
                };
                setProfile(defaultProfile);

                const { data } = await supabase
                    .from('profiles')
                    .select('id, full_name, is_vendor, vendor_verified, role, avatar_url')
                    .eq('id', user.id)
                    .maybeSingle();

                if (data) {
                    setProfile(data as UserProfile);
                }
            } else {
                setProfile(null);
            }
            setLoading(false);
        };

        fetchProfile();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            fetchProfile();
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSignOut = async () => {
        clearKarigarAuth();
        await supabase.auth.signOut();
        setProfile(null);
        window.location.href = '/login';
    };

    // Toggle role between Buyer and Artisan Maker anytime
    const handleToggleRole = async () => {
        if (!profile) return;
        try {
            setSwitchingRole(true);
            const newIsVendor = !profile.is_vendor;

            // Strict verification check: only verified if both logo and location exist
            let hasLocation = false;
            if (typeof window !== 'undefined') {
                try {
                    const savedRaw = localStorage.getItem(`karigar_workshop_profile_${profile.id}`);
                    if (savedRaw) {
                        const saved = JSON.parse(savedRaw);
                        if (saved.location && saved.location.trim().length > 0) {
                            hasLocation = true;
                        }
                    }
                } catch (e) {}
            }

            const hasLogo = !!(profile.avatar_url);
            const isVerified = newIsVendor ? (hasLogo && hasLocation) : false;

            const { error } = await supabase
                .from('profiles')
                .update({ is_vendor: newIsVendor, vendor_verified: isVerified })
                .eq('id', profile.id);

            if (error) {
                await fetch('/api/auth/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: profile.id,
                        fullName: profile.full_name,
                        isVendor: newIsVendor,
                        vendorVerified: isVerified,
                    }),
                });
            }

            setProfile((prev) => prev ? { ...prev, is_vendor: newIsVendor, vendor_verified: isVerified } : null);

            if (newIsVendor) {
                router.push('/artisan');
            } else {
                router.push('/');
            }
        } catch (err) {
            console.error('Role switch error:', err);
        } finally {
            setSwitchingRole(false);
        }
    };

    // Don't render navbar on auth pages
    if (pathname?.startsWith('/login')) return null;

    const isActive = (path: string) =>
        pathname === path
            ? 'text-[#C85A32] font-semibold bg-[#FDFBF7]'
            : 'text-[#6B635B] hover:text-[#1E1B18]';

    // Buyer Navigation Links
    const buyerLinks = [
        { href: '/verification/feed', label: 'Reel Feed', icon: ShieldCheck },
        { href: '/projects', label: 'Commissions', icon: FolderOpen },
        { href: '/projects/new', label: 'Post Project', icon: FolderOpen },
        { href: '/messages', label: 'Messages', icon: MessageSquare },
    ];

    // Artisan Maker Navigation Links (Commissions, Post Project & Feed hidden)
    const artisanLinks = [
        { href: '/dashboard', label: 'Maker Dashboard', icon: LayoutDashboard },
        { href: '/dashboard?tab=orders', label: 'Buyer Chats & Orders', icon: MessageSquare },
        { href: '/dashboard?tab=upload', label: 'Upload Product Reel', icon: UploadCloud },
    ];

    const adminLinks = profile?.role === 'admin'
        ? [{ href: '/triage', label: 'Admin Triage', icon: ShieldCheck }]
        : [];

    const allLinks = [
        ...(profile?.is_vendor ? artisanLinks : buyerLinks),
        ...adminLinks,
    ];

    return (
        <header className="sticky top-3 z-50 px-4 sm:px-6 max-w-6xl mx-auto w-full transition-all">
            <nav className="bg-white/85 border border-stone-200/90 rounded-full px-3.5 sm:px-4 py-1.5 shadow-xs hover:shadow-md transition-all backdrop-blur-2xl flex items-center justify-between gap-2">
                {/* Brand / Home Pill */}
                <button
                    onClick={() => router.push(profile?.is_vendor ? '/artisan' : '/')}
                    className="flex items-center gap-2 shrink-0 cursor-pointer group rounded-full py-1 pr-2.5 pl-1 hover:bg-stone-100/80 transition-all"
                >
                    <div className="w-7 h-7 rounded-full bg-[#C85A32] flex items-center justify-center shadow-2xs group-hover:bg-[#B04B26] transition-colors text-white">
                        <Home className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-display font-bold text-stone-900 text-sm tracking-tight">
                        Karigar<span className="text-[#C85A32]">Kart</span>
                    </span>
                </button>

                {/* Desktop Nav Links */}
                <div className="hidden md:flex items-center gap-1 bg-stone-50/80 p-0.5 rounded-full border border-stone-200/60">
                    {allLinks.map((link) => (
                        <button
                            key={link.href}
                            onClick={() => router.push(link.href)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                                pathname === link.href
                                    ? 'text-[#C85A32] font-semibold bg-white shadow-2xs'
                                    : 'text-stone-600 hover:text-stone-950 hover:bg-white/60'
                            }`}
                        >
                            <link.icon className="w-3.5 h-3.5" />
                            <span>{link.label}</span>
                        </button>
                    ))}
                </div>

                {/* Right Section: Role Switcher, Profile Badge, Avatar & Sign Out */}
                <div className="flex items-center gap-2">
                    {loading ? (
                        <div className="w-7 h-7 rounded-full bg-stone-200/60 animate-pulse" />
                    ) : profile ? (
                        <div className="flex items-center gap-2">
                            {/* Role Switcher Button */}
                            <button
                                onClick={handleToggleRole}
                                disabled={switchingRole}
                                title={profile.is_vendor ? 'Switch to Buyer Mode' : 'Switch to Artisan Maker Mode'}
                                className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border transition-all cursor-pointer shadow-2xs ${
                                    profile.is_vendor
                                        ? 'bg-[#EDF7ED]/90 border-[#2E7D32]/25 text-[#2E7D32] hover:bg-[#EDF7ED]'
                                        : 'bg-[#FFF4E5]/90 border-[#ED6C02]/25 text-[#ED6C02] hover:bg-[#FFF4E5]'
                                }`}
                            >
                                <ArrowLeftRight className={`w-3 h-3 ${switchingRole ? 'animate-spin' : ''}`} />
                                <span>
                                    {switchingRole
                                        ? 'Switching...'
                                        : profile.is_vendor
                                            ? 'Artisan Mode'
                                            : 'Switch to Artisan'}
                                </span>
                            </button>

                            {/* Verification Status Badge */}
                            {profile.is_vendor && (
                                <span
                                    className="hidden lg:inline-flex text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#EDF7ED] text-[#2E7D32] border border-[#2E7D32]/20 items-center gap-1 shadow-2xs"
                                >
                                    <ShieldCheck className="w-3 h-3" />
                                    <span>Verified</span>
                                </span>
                            )}

                            {/* User Avatar & Profile Link */}
                            <button
                                onClick={() => router.push('/profile')}
                                className="flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer p-0.5 pr-2 rounded-full hover:bg-stone-100/80 border border-transparent hover:border-stone-200/80"
                                title="View & Edit Profile"
                            >
                                <div
                                    className="w-7 h-7 rounded-full bg-[#C85A32] flex items-center justify-center text-white text-xs font-bold overflow-hidden border border-stone-200 shadow-2xs"
                                >
                                    {profile.avatar_url && profile.avatar_url.startsWith('http') ? (
                                        <img
                                            src={profile.avatar_url}
                                            alt={profile.full_name || 'Avatar'}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        profile.full_name?.charAt(0)?.toUpperCase() || <User className="w-3.5 h-3.5" />
                                    )}
                                </div>
                                <span className="hidden md:block text-xs font-medium text-stone-800 max-w-[85px] truncate text-left">
                                    {profile.full_name || 'Profile'}
                                </span>
                            </button>

                            {/* Sign Out */}
                            <button
                                onClick={handleSignOut}
                                className="hidden sm:flex items-center justify-center w-7 h-7 rounded-full text-stone-500 hover:text-[#D32F2F] hover:bg-stone-100 transition-colors cursor-pointer"
                                title="Sign Out"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => router.push('/login')}
                            className="btn-primary text-xs py-1 px-3.5 rounded-full cursor-pointer shadow-xs"
                        >
                            Sign In
                        </button>
                    )}

                    {/* Mobile Hamburger */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden p-1.5 rounded-full hover:bg-stone-100 transition-colors"
                    >
                        {mobileOpen
                            ? <X className="w-4 h-4 text-stone-900" />
                            : <Menu className="w-4 h-4 text-stone-900" />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="md:hidden mt-2 border border-stone-200/90 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl overflow-hidden animate-slide-up">
                    <div className="px-4 py-3 flex flex-col gap-1">
                        {profile ? (
                            <div className="mb-2 pb-2 border-b border-stone-100 flex items-center justify-between">
                                <button
                                    onClick={() => {
                                        router.push('/profile');
                                        setMobileOpen(false);
                                    }}
                                    className="flex items-center gap-2 text-xs font-bold text-stone-900 text-left"
                                >
                                    <User className="w-4 h-4 text-[#C85A32]" />
                                    {profile.full_name || 'My Profile'} ({profile.is_vendor ? 'Artisan' : 'Buyer'})
                                </button>
                                <button
                                    onClick={handleToggleRole}
                                    disabled={switchingRole}
                                    className="text-xs font-semibold text-[#C85A32] flex items-center gap-1 underline"
                                >
                                    <ArrowLeftRight className="w-3 h-3" />
                                    {profile.is_vendor ? 'Switch to Buyer' : 'Become an Artisan'}
                                </button>
                            </div>
                        ) : null}

                        {allLinks.map((link) => (
                            <button
                                key={link.href}
                                onClick={() => {
                                    router.push(link.href);
                                    setMobileOpen(false);
                                }}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive(link.href)}`}
                            >
                                <link.icon className="w-4 h-4" />
                                {link.label}
                            </button>
                        ))}

                        {profile && (
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-[#D32F2F] hover:bg-[#FDEDED] transition-colors mt-2 border-t border-stone-100 pt-3 cursor-pointer"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
