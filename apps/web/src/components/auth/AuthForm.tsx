'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '../../lib/supabaseClient';
import { Mail, Lock, User, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';

export default function AuthForm() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [mode, setMode] = useState<'signin' | 'register'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState<'buyer' | 'artisan'>('buyer');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        const cleanEmail = email.trim().toLowerCase();
        const cleanPassword = password;

        if (!cleanEmail || !cleanPassword) {
            setErrorMsg('Please enter both your email address and password.');
            return;
        }

        setLoading(true);

        try {
            // 1. Try client-side Supabase signIn
            const { data, error } = await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password: cleanPassword,
            });

            if (!error && data?.user) {
                // Ensure session is populated
                await supabase.auth.getSession();

                const { data: prof } = await supabase
                    .from('profiles')
                    .select('is_vendor')
                    .eq('id', data.user.id)
                    .maybeSingle();

                const nextUrl = searchParams?.get('next');
                const dest = nextUrl || (prof?.is_vendor ? '/artisan' : '/profile');
                window.location.href = dest;
                return;
            }

            // 2. Server-assisted login fallback (auto-confirms unverified emails, syncs sessions)
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: cleanEmail,
                    password: cleanPassword,
                }),
            });

            const loginData = await res.json();

            if (loginData.success && loginData.session) {
                await supabase.auth.setSession({
                    access_token: loginData.session.access_token,
                    refresh_token: loginData.session.refresh_token,
                });

                await supabase.auth.getSession();

                const nextUrl = searchParams?.get('next');
                const dest = nextUrl || (loginData.isVendor ? '/artisan' : '/profile');
                window.location.href = dest;
                return;
            }

            if (loginData.notFound) {
                setErrorMsg('No account found with this email. Click "Create Account" above to register.');
            } else {
                setErrorMsg(loginData.error || (error?.message ?? 'Sign in failed. Please check your credentials.'));
            }
            setLoading(false);
        } catch (err: any) {
            console.error('Sign In Error:', err);
            setErrorMsg(err.message || 'An error occurred during sign in.');
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        const cleanEmail = email.trim().toLowerCase();
        const cleanPassword = password;
        const cleanFullName = fullName.trim();
        const isArtisan = role === 'artisan';

        if (!cleanFullName) {
            setErrorMsg('Please enter your full name or workshop brand name.');
            return;
        }

        if (!cleanEmail) {
            setErrorMsg('Please enter a valid email address.');
            return;
        }

        if (cleanPassword.length < 6) {
            setErrorMsg('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);

        try {
            // 1. Register and establish session via server API
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: cleanEmail,
                    password: cleanPassword,
                    fullName: cleanFullName,
                    isVendor: isArtisan,
                }),
            });

            const regData = await res.json();

            if (!res.ok || !regData.success) {
                setErrorMsg(regData.error || 'Registration could not be completed. Please try again.');
                setLoading(false);
                return;
            }

            if (regData.session) {
                await supabase.auth.setSession({
                    access_token: regData.session.access_token,
                    refresh_token: regData.session.refresh_token,
                });
            }

            await supabase.auth.getSession();

            const nextUrl = searchParams?.get('next');
            const dest = nextUrl || (isArtisan ? '/verification/onboarding' : '/profile');
            window.location.href = dest;
        } catch (err: any) {
            console.error('Registration Error:', err);
            setErrorMsg(err.message || 'Registration failed. Please check your details and try again.');
            setLoading(false);
        }
    };

    return (
        <div className="w-full animate-slide-up">
            {/* Mode Switcher Tabs */}
            <div className="flex mb-6 bg-[#F3EFEA] rounded-lg p-1">
                <button
                    type="button"
                    onClick={() => { setMode('signin'); setErrorMsg(''); setSuccessMsg(''); }}
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all cursor-pointer ${
                        mode === 'signin'
                            ? 'bg-white text-[#1E1B18] shadow-sm'
                            : 'text-[#6B635B] hover:text-[#1E1B18]'
                    }`}
                >
                    Sign In
                </button>
                <button
                    type="button"
                    onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all cursor-pointer ${
                        mode === 'register'
                            ? 'bg-white text-[#1E1B18] shadow-sm'
                            : 'text-[#6B635B] hover:text-[#1E1B18]'
                    }`}
                >
                    Create Account
                </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
                <div className="mb-4 p-3 bg-[#FDEDED] border border-[#F5C2C7] text-[#D32F2F] rounded-lg text-xs font-medium animate-fade-in leading-relaxed">
                    {errorMsg}
                </div>
            )}

            {/* Success Message */}
            {successMsg && (
                <div className="mb-4 p-3 bg-[#EDF7ED] border border-[#C3E6CB] text-[#2E7D32] rounded-lg text-xs font-medium flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{successMsg}</span>
                </div>
            )}

            <form onSubmit={mode === 'signin' ? handleSignIn : handleRegister} className="flex flex-col gap-4">
                {/* Full Name (Register Only) */}
                {mode === 'register' && (
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1B18] mb-1.5">
                            Full Name / Workshop Name
                        </label>
                        <div className="relative flex items-center">
                            <User className="absolute left-3.5 w-4 h-4 text-[#6B635B] pointer-events-none" />
                            <input
                                type="text"
                                required
                                placeholder="e.g. Ramesh Chandra / Heritage Crafts"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                style={{ paddingLeft: '2.5rem' }}
                                className="input-base"
                            />
                        </div>
                    </div>
                )}

                {/* Email Address */}
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1B18] mb-1.5">
                        Email Address
                    </label>
                    <div className="relative flex items-center">
                        <Mail className="absolute left-3.5 w-4 h-4 text-[#6B635B] pointer-events-none" />
                        <input
                            type="email"
                            required
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ paddingLeft: '2.5rem' }}
                            className="input-base"
                        />
                    </div>
                </div>

                {/* Password */}
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1B18] mb-1.5">
                        Password
                    </label>
                    <div className="relative flex items-center">
                        <Lock className="absolute left-3.5 w-4 h-4 text-[#6B635B] pointer-events-none" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            minLength={6}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                            className="input-base"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 text-[#6B635B] hover:text-[#1E1B18] cursor-pointer"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Role Selector (Register Only) */}
                {mode === 'register' && (
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1B18] mb-2">
                            I am joining Karigar Kart as:
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setRole('buyer')}
                                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                                    role === 'buyer'
                                        ? 'border-[#C85A32] bg-[#FDFBF7] shadow-xs'
                                        : 'border-[#E8E2D9] bg-white hover:border-[#C85A32]/40'
                                }`}
                            >
                                <span className={`text-xs font-bold ${role === 'buyer' ? 'text-[#C85A32]' : 'text-[#1E1B18]'}`}>
                                    🛍️ Buyer / Shopper
                                </span>
                                <span className="text-[10px] text-[#6B635B] leading-tight">
                                    Discover verified artisan reels & commission custom crafts
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setRole('artisan')}
                                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                                    role === 'artisan'
                                        ? 'border-[#C85A32] bg-[#FDFBF7] shadow-xs'
                                        : 'border-[#E8E2D9] bg-white hover:border-[#C85A32]/40'
                                }`}
                            >
                                <span className={`text-xs font-bold ${role === 'artisan' ? 'text-[#C85A32]' : 'text-[#1E1B18]'}`}>
                                    🪵 Artisan / Maker
                                </span>
                                <span className="text-[10px] text-[#6B635B] leading-tight">
                                    Upload AI-verified process videos & sell handcrafted products
                                </span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-3 font-semibold text-sm mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            <span>{mode === 'signin' ? 'Sign In to Karigar Kart' : 'Create Account'}</span>
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
