'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '../../lib/supabaseClient';
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
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

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
            if (session?.user) {
                fetchProfile();
            } else {
                setProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSignOut = async () => {
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

            const { error } = await supabase
                .from('profiles')
                .update({ is_vendor: newIsVendor, vendor_verified: true })
                .eq('id', profile.id);

            if (error) {
                await fetch('/api/auth/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: profile.id,
                        fullName: profile.full_name,
                        isVendor: newIsVendor,
                        vendorVerified: true,
                    }),
                });
            }

            setProfile((prev) => prev ? { ...prev, is_vendor: newIsVendor, vendor_verified: true } : null);

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
        <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[#E8E2D9]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14">
                    {/* Brand / Home Button */}
                    <button
                        onClick={() => router.push(profile?.is_vendor ? '/artisan' : '/')}
                        className="flex items-center gap-2 shrink-0 cursor-pointer group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-[#C85A32] flex items-center justify-center shadow-sm group-hover:bg-[#B04B26] transition-colors">
                            <Home className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-display font-bold text-[#1E1B18] text-sm">
                            Home
                        </span>
                    </button>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {allLinks.map((link) => (
                            <button
                                key={link.href}
                                onClick={() => router.push(link.href)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${isActive(link.href)}`}
                            >
                                <link.icon className="w-3.5 h-3.5" />
                                {link.label}
                            </button>
                        ))}
                    </div>

                    {/* Right Section: Role Switcher, Profile Badge, Avatar & Sign Out */}
                    <div className="flex items-center gap-3">
                        {loading ? (
                            <div className="w-8 h-8 rounded-full bg-[#F3EFEA] animate-pulse" />
                        ) : profile ? (
                            <div className="flex items-center gap-2.5">
                                {/* Role Switcher Button */}
                                <button
                                    onClick={handleToggleRole}
                                    disabled={switchingRole}
                                    title={profile.is_vendor ? 'Switch to Buyer Mode' : 'Switch to Artisan Maker Mode'}
                                    className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                        profile.is_vendor
                                            ? 'bg-[#EDF7ED] border-[#2C4A3E]/30 text-[#2C4A3E] hover:bg-[#E0F2E9]'
                                            : 'bg-[#FFF4E5] border-[#ED6C02]/30 text-[#ED6C02] hover:bg-[#FFE8CC]'
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
                                        className="hidden lg:inline-flex text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#2E7D32] text-white items-center gap-1 shadow-sm"
                                    >
                                        <ShieldCheck className="w-3 h-3" />
                                        <span>✓ Verified Artisan</span>
                                    </span>
                                )}

                                {/* User Avatar & Profile Link */}
                                <button
                                    onClick={() => router.push('/profile')}
                                    className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer p-0.5 rounded-full hover:ring-2 hover:ring-[#C85A32]/20"
                                    title="View & Edit Profile"
                                >
                                    <div
                                        className="w-8 h-8 rounded-full bg-[#C85A32] flex items-center justify-center text-white text-xs font-bold overflow-hidden border border-[#E8E2D9] shadow-sm"
                                    >
                                        {profile.avatar_url && profile.avatar_url.startsWith('http') ? (
                                            <img
                                                src={profile.avatar_url}
                                                alt={profile.full_name || 'Avatar'}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            profile.full_name?.charAt(0)?.toUpperCase() || <User className="w-4 h-4" />
                                        )}
                                    </div>
                                    <span className="hidden md:block text-xs font-semibold text-[#1E1B18] max-w-[90px] truncate text-left">
                                        {profile.full_name || 'Profile'}
                                    </span>
                                </button>

                                {/* Sign Out */}
                                <button
                                    onClick={handleSignOut}
                                    className="hidden sm:flex items-center gap-1 text-xs text-[#6B635B] hover:text-[#D32F2F] transition-colors p-1 cursor-pointer"
                                    title="Sign Out"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => router.push('/login')}
                                className="btn-primary text-xs py-1.5 px-3.5 cursor-pointer"
                            >
                                Sign In
                            </button>
                        )}

                        {/* Mobile Hamburger */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="md:hidden p-1.5 rounded-lg hover:bg-[#F3EFEA] transition-colors"
                        >
                            {mobileOpen
                                ? <X className="w-5 h-5 text-[#1E1B18]" />
                                : <Menu className="w-5 h-5 text-[#1E1B18]" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="md:hidden border-t border-[#E8E2D9] bg-white animate-slide-up">
                    <div className="px-4 py-3 flex flex-col gap-1">
                        {profile ? (
                            <div className="mb-2 pb-2 border-b border-[#E8E2D9] flex items-center justify-between">
                                <button
                                    onClick={() => {
                                        router.push('/profile');
                                        setMobileOpen(false);
                                    }}
                                    className="flex items-center gap-2 text-xs font-bold text-[#1E1B18] text-left"
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
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(link.href)}`}
                            >
                                <link.icon className="w-4 h-4" />
                                {link.label}
                            </button>
                        ))}

                        {profile && (
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-[#D32F2F] hover:bg-[#FDEDED] transition-colors mt-2 border-t border-[#E8E2D9] pt-3 cursor-pointer"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
