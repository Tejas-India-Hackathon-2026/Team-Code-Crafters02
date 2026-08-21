'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '../../lib/supabaseClient';
import { storeKarigarSession, clearKarigarAuth, getKarigarAuthUser } from '../../lib/authHelper';
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
    const [existingUser, setExistingUser] = useState<any>(null);

    useEffect(() => {
        const checkExisting = async () => {
            const user = await getKarigarAuthUser(supabase);
            if (user) {
                setExistingUser(user);
            }
        };
        checkExisting();
    }, []);

    const handleSwitchAccount = async () => {
        clearKarigarAuth();
        await supabase.auth.signOut();
        setExistingUser(null);
        setErrorMsg('');
        setSuccessMsg('');
    };

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
                storeKarigarSession(data.session, data.user);
                await supabase.auth.getSession();

                const { data: prof } = await supabase
                    .from('profiles')
                    .select('is_vendor')
                    .eq('id', data.user.id)
                    .maybeSingle();

                const nextUrl = searchParams?.get('next');
                const dest = (nextUrl && nextUrl.startsWith('/') && !nextUrl.startsWith('/login'))
                    ? nextUrl
                    : (prof?.is_vendor ? '/artisan' : '/profile');
                window.location.href = dest;
                return;
            }

            // 2. Server-assisted login fallback (auto-provisions / updates credentials & confirms email)
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: cleanEmail,
                    password: cleanPassword,
                }),
            });

            const loginData = await res.json();

            if (loginData.success) {
                if (loginData.session) {
                    try {
                        await supabase.auth.setSession({
                            access_token: loginData.session.access_token,
                            refresh_token: loginData.session.refresh_token,
                        });
                    } catch (e) {}
                }
                storeKarigarSession(loginData.session, loginData.user);

                // Retry client signIn to guarantee cookie registration
                const { data: retryData } = await supabase.auth.signInWithPassword({
                    email: cleanEmail,
                    password: cleanPassword,
                });

                if (retryData?.session) {
                    storeKarigarSession(retryData.session, retryData.user);
                }

                const nextUrl = searchParams?.get('next');
                const dest = (nextUrl && nextUrl.startsWith('/') && !nextUrl.startsWith('/login'))
                    ? nextUrl
                    : (loginData.isVendor ? '/artisan' : '/profile');
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
            // 1. Register confirmed account and profile via server API
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

            // 2. Sign in immediately on client
            const { data: signInData } = await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password: cleanPassword,
            });

            if (signInData?.session) {
                storeKarigarSession(signInData.session, signInData.user);
            } else if (regData.userId) {
                storeKarigarSession(null, {
                    id: regData.userId,
                    email: cleanEmail,
                    user_metadata: { full_name: cleanFullName, is_vendor: isArtisan },
                });
            }

            await supabase.auth.getSession();

            const nextUrl = searchParams?.get('next');
            const dest = (nextUrl && nextUrl.startsWith('/') && !nextUrl.startsWith('/login'))
                ? nextUrl
                : (isArtisan ? '/verification/onboarding' : '/profile');
            window.location.href = dest;
        } catch (err: any) {
            console.error('Registration Error:', err);
            setErrorMsg(err.message || 'Registration failed. Please check your details and try again.');
            setLoading(false);
        }
    };

    return (
        <div className="w-full animate-slide-up">
            {/* Active Session Notification */}
            {existingUser && (
                <div className="mb-5 p-3.5 bg-[#FDFBF7] border border-[#C85A32]/30 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#C85A32]">
                            Active Session Detected
                        </span>
                        <button
                            type="button"
                            onClick={handleSwitchAccount}
                            className="text-[11px] font-semibold text-stone-500 hover:text-red-600 underline cursor-pointer"
                        >
                            Sign Out &amp; Switch Account
                        </button>
                    </div>
                    <p className="text-xs text-stone-700">
                        Signed in as <strong>{existingUser.email}</strong>
                    </p>
                    <div className="flex gap-2 mt-1">
                        <button
                            type="button"
                            onClick={() => {
                                const next = searchParams?.get('next');
                                window.location.href = (next && next.startsWith('/') && !next.startsWith('/login')) ? next : '/artisan';
                            }}
                            className="btn-primary py-1.5 px-3 text-xs font-semibold rounded-lg flex-1 flex items-center justify-center gap-1 cursor-pointer"
                        >
                            <span>Go to Artisan Hub</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                window.location.href = '/dashboard';
                            }}
                            className="btn-ghost py-1.5 px-3 text-xs font-semibold rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-100 cursor-pointer"
                        >
                            Dashboard
                        </button>
                    </div>
                </div>
            )}

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
