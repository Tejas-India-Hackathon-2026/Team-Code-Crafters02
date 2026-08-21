'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../../lib/supabaseClient';
import { getKarigarAuthUser } from '../../../../lib/authHelper';
import {
    UploadCloud,
    CheckCircle2,
    ShieldCheck,
    Palette,
    Building2,
    MapPin,
    FileText,
    Sparkles,
    ArrowRight,
    Crosshair,
    Check,
} from 'lucide-react';
import Link from 'next/link';

const CRAFT_CATEGORIES = [
    { id: 'sketches', label: 'Custom Sketches & Portraits', icon: '✏️' },
    { id: 'wood_painting', label: 'Wood Painting & Pyrography', icon: '🪵' },
    { id: 'resin_floral', label: 'Resin & Floral Art', icon: '🧪' },
    { id: 'crochet_macrame', label: 'Crochet & Macramé Decor', icon: '🧶' },
    { id: 'candles_wax', label: 'Handmade Candles & Wax Art', icon: '🕯️' },
    { id: 'calligraphy', label: 'Calligraphy & Hand Lettering', icon: '📜' },
    { id: 'papercraft', label: 'Papercraft & Origami Art', icon: '📄' },
    { id: 'folk_toys', label: 'Folk Toys & Puppetry', icon: '🪆' },
    { id: 'lippan_art', label: 'Lippan & Mud Mirror Art', icon: '🪞' },
    { id: 'pottery', label: 'Pottery & Ceramics', icon: '🏺' },
    { id: 'woodworking', label: 'Woodworking & Carving', icon: '🪵' },
    { id: 'handloom', label: 'Handloom & Textiles', icon: '🧵' },
    { id: 'metalcraft', label: 'Metalcraft & Brassware', icon: '🪚' },
    { id: 'leathercraft', label: 'Leathercraft & Footwear', icon: '👜' },
    { id: 'jewelry', label: 'Handmade Jewelry & Beadwork', icon: '💍' },
    { id: 'stonecraft', label: 'Stone & Marble Inlay Craft', icon: '🗿' },
    { id: 'painting', label: 'Traditional Painting & Folk Art', icon: '🎨' },
    { id: 'bamboo', label: 'Bamboo & Cane Craft', icon: '🎋' },
    { id: 'terracotta', label: 'Terracotta & Clay Art', icon: '🪴' },
    { id: 'embroidery', label: 'Embroidery & Zardozi', icon: '🪡' },
    { id: 'glasscraft', label: 'Glass & Mosaic Craft', icon: '✨' },
    { id: 'jute_fiber', label: 'Natural Fiber & Jute Craft', icon: '🌿' },
];

export default function ArtisanOnboardingPage() {
    const supabase = createClient();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [detectingLoc, setDetectingLoc] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);

    // Form fields
    const [workshopName, setWorkshopName] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>(['woodworking']);
    const [location, setLocation] = useState('');
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [taxId, setTaxId] = useState('');
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        let isMounted = true;

        const checkUser = async () => {
            const authUser = await getKarigarAuthUser(supabase);

            if (!authUser) {
                if (isMounted) {
                    setPageLoading(false);
                }
                return;
            }

            if (!isMounted) return;
            setUser(authUser);

            const { data: prof } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .maybeSingle();

            if (prof) {
                setProfile(prof);
                if (prof.full_name) setWorkshopName(prof.full_name);
                if (prof.avatar_url) setLogoPreview(prof.avatar_url);

                if (authUser.user_metadata?.craft_categories) {
                    setSelectedCategories(authUser.user_metadata.craft_categories);
                }
                if (authUser.user_metadata?.location) {
                    setLocation(authUser.user_metadata.location);
                }
                if (authUser.user_metadata?.tax_id) {
                    setTaxId(authUser.user_metadata.tax_id);
                }

                // If artisan is already registered & verified, route straight to dashboard
                const isExplicitEdit = typeof window !== 'undefined' && window.location.search.includes('edit=true');
                if (prof.is_vendor && prof.avatar_url && !isExplicitEdit) {
                    router.push('/dashboard');
                    return;
                }
            }
            setPageLoading(false);
        };

        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user && isMounted) {
                checkUser();
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const toggleCategory = (catId: string) => {
        setSelectedCategories((prev) =>
            prev.includes(catId)
                ? prev.length > 1
                    ? prev.filter((c) => c !== catId)
                    : prev
                : [...prev, catId]
        );
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setErrorMsg('Logo file size must be less than 5 MB.');
                return;
            }
            setLogoFile(file);
            const reader = new FileReader();
            reader.onload = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            setErrorMsg('');
        }
    };

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            setErrorMsg('Geolocation is not supported by your browser.');
            return;
        }

        setDetectingLoc(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                setCoords({ lat: latitude, lng: longitude });

                // Reverse geocode via free OpenStreetMap Nominatim API
                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await res.json();
                    if (data && data.address) {
                        const city = data.address.city || data.address.town || data.address.village || data.address.state_district || '';
                        const state = data.address.state || '';
                        const country = data.address.country || 'India';
                        setLocation(`${city ? city + ', ' : ''}${state ? state + ', ' : ''}${country} (${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E)`);
                    } else {
                        setLocation(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
                    }
                } catch {
                    setLocation(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
                } finally {
                    setDetectingLoc(false);
                }
            },
            (err) => {
                console.error('Location error:', err);
                setErrorMsg('Could not detect location. Please type your city/workshop location manually.');
                setDetectingLoc(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (!logoFile && !logoPreview) {
            setErrorMsg('Mandatory: Please upload your workshop or brand logo for AI verification.');
            return;
        }

        if (selectedCategories.length === 0) {
            setErrorMsg('Please select at least one craft category.');
            return;
        }

        setLoading(true);

        try {
            // 1. Upload Logo if new file selected
            let logoUrl = logoPreview || '';
            if (logoFile && user) {
                const formData = new FormData();
                formData.append('logo', logoFile);
                formData.append('email', user.email || 'artisan');

                const uploadRes = await fetch('/api/auth/upload-logo', {
                    method: 'POST',
                    body: formData,
                });

                const uploadData = await uploadRes.json();
                if (!uploadRes.ok || !uploadData.logoUrl) {
                    throw new Error(uploadData.error || 'Failed to upload logo.');
                }
                logoUrl = uploadData.logoUrl;
                setLogoPreview(logoUrl);
            }

            // 2. Persist profile via server API endpoint with all fields
            const updatePayload = {
                userId: user.id,
                fullName: workshopName.trim() || profile?.full_name || 'Artisan Workshop',
                avatarUrl: logoUrl,
                isVendor: true,
                vendorVerified: true,
                kycStatus: 'PASSED',
                craftCategories: selectedCategories,
                location: location.trim(),
                taxId: taxId.trim(),
                latitude: coords?.lat || null,
                longitude: coords?.lng || null,
            };

            const profileRes = await fetch('/api/auth/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload),
            });

            if (!profileRes.ok) {
                const errData = await profileRes.json();
                throw new Error(errData.error || 'Failed to save artisan profile.');
            }

            setSuccessMsg('🎉 Artisan registered successfully! Taking you to your Maker Dashboard...');

            // Direct forward to Artisan Dashboard
            setTimeout(() => {
                router.push('/dashboard');
            }, 900);
        } catch (err: any) {
            console.error('Artisan onboarding error:', err);
            setErrorMsg(err.message || 'Onboarding submission failed.');
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <p className="text-xs text-[#6B635B] animate-pulse-subtle">Loading artisan setup...</p>
            </main>
        );
    }

    if (!user) {
        return (
            <main className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
                <div className="p-8 max-w-md w-full text-center flex flex-col items-center gap-4 bg-white border border-[#E8E2D9] rounded-2xl shadow-card">
                    <div className="w-14 h-14 rounded-2xl bg-[#C85A32]/10 text-[#C85A32] flex items-center justify-center">
                        <Sparkles className="w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-stone-900 font-display">
                            Artisan Registration Required
                        </h2>
                        <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                            Sign in or register an account before setting up your maker profile and craft specializations.
                        </p>
                    </div>
                    <Link
                        href="/login?next=/verification/onboarding"
                        className="btn-primary w-full py-3 text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-2 rounded-xl"
                    >
                        <span>Sign In to Continue</span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#FDFBF7] py-10 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#EDF7ED] text-[#2C4A3E] rounded-full text-xs font-semibold mb-3">
                        <Sparkles className="w-3.5 h-3.5" />
                        Artisan Maker Onboarding & KYC
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1B18] font-display">
                        Set Up Your Maker Profile
                    </h1>
                    <p className="text-xs sm:text-sm text-[#6B635B] mt-2 max-w-md mx-auto">
                        Upload your brand logo, choose your craft specializations, and set your location. Our AI matches your video with this registered logo.
                    </p>
                </div>

                {/* Card Form */}
                <div className="card p-6 sm:p-8 bg-white shadow-card">
                    {errorMsg && (
                        <div className="mb-5 p-3.5 bg-[#FDEDED] border border-[#F5C2C7] text-[#D32F2F] text-xs rounded-lg animate-fade-in">
                            {errorMsg}
                        </div>
                    )}
                    {successMsg && (
                        <div className="mb-5 p-3.5 bg-[#EDF7ED] border border-[#2E7D32]/20 text-[#2E7D32] text-xs rounded-lg animate-fade-in flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        {/* 1. Mandatory Brand / Company Logo Upload */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1B18]">
                                    1. Brand / Workshop Logo <span className="text-[#D32F2F]">*</span>
                                </label>
                                <span className="text-[10px] text-[#2C4A3E] font-medium flex items-center gap-1 bg-[#EDF7ED] px-2.5 py-0.5 rounded-full">
                                    <ShieldCheck className="w-3 h-3" />
                                    AI Vision Matching Target
                                </span>
                            </div>

                            <div className="border-2 border-dashed border-[#E8E2D9] hover:border-[#C85A32]/60 bg-[#FDFBF7] rounded-xl p-5 transition-colors">
                                {logoPreview ? (
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={logoPreview}
                                            alt="Workshop Logo"
                                            className="w-16 h-16 rounded-xl object-contain bg-white border border-[#E8E2D9] p-1.5 shadow-sm shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-[#1E1B18] truncate">
                                                {logoFile?.name || 'Registered Brand Logo'}
                                            </p>
                                            <p className="text-[11px] text-[#2E7D32] flex items-center gap-1 mt-0.5 font-medium">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Ready for video watermark comparison
                                            </p>
                                            <label className="text-xs text-[#C85A32] hover:underline cursor-pointer inline-block mt-1 font-semibold">
                                                Change Logo
                                                <input
                                                    type="file"
                                                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                                    onChange={handleLogoChange}
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center cursor-pointer text-center py-4">
                                        <div className="w-12 h-12 rounded-xl bg-[#C85A32]/10 flex items-center justify-center mb-2">
                                            <UploadCloud className="w-6 h-6 text-[#C85A32]" />
                                        </div>
                                        <span className="text-sm font-bold text-[#1E1B18]">
                                            Upload Official Brand / Maker Logo
                                        </span>
                                        <span className="text-xs text-[#6B635B] mt-1">
                                            PNG, JPG, WebP, SVG up to 5 MB
                                        </span>
                                        <p className="text-[10px] text-[#2C4A3E] mt-2 bg-[#EDF7ED] px-3 py-1 rounded-full font-medium max-w-sm">
                                            Gemini 2.5 Flash inspects video frames to match physical stamps with this logo
                                        </p>
                                        <input
                                            type="file"
                                            required
                                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                            onChange={handleLogoChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* 2. Business / Workshop Name */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1B18] mb-1.5">
                                2. Workshop / Studio Name <span className="text-[#D32F2F]">*</span>
                            </label>
                            <div className="relative flex items-center">
                                <Building2 className="absolute left-3.5 w-4 h-4 text-[#6B635B] pointer-events-none" />
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Royal Jaipur Woodworks"
                                    value={workshopName}
                                    onChange={(e) => setWorkshopName(e.target.value)}
                                    style={{ paddingLeft: '2.5rem' }}
                                    className="input-base"
                                />
                            </div>
                        </div>

                        {/* 3. Craft Specialization (Multi-Select Checkboxes) */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1B18]">
                                    3. Craft Specializations <span className="text-[#D32F2F]">*</span>
                                </label>
                                <span className="text-[10px] text-[#6B635B]">
                                    Select all that apply ({selectedCategories.length} selected)
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                {CRAFT_CATEGORIES.map((cat) => {
                                    const isSelected = selectedCategories.includes(cat.id);
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => toggleCategory(cat.id)}
                                            className={`p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'border-[#C85A32] bg-[#FDFBF7] text-[#1E1B18] font-bold ring-1 ring-[#C85A32]'
                                                    : 'border-[#E8E2D9] bg-white text-[#6B635B] hover:border-[#C85A32]/40'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-base shrink-0">{cat.icon}</span>
                                                <span className="text-xs truncate">{cat.label}</span>
                                            </div>
                                            <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                                                isSelected ? 'bg-[#C85A32] border-[#C85A32] text-white' : 'border-[#E8E2D9] bg-white'
                                            }`}>
                                                {isSelected && <Check className="w-3 h-3" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 4. Exact Workshop Location with GPS Detection */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1B18]">
                                    4. Exact Workshop Location <span className="text-[#D32F2F]">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={handleDetectLocation}
                                    disabled={detectingLoc}
                                    className="text-[11px] text-[#C85A32] font-semibold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                    <Crosshair className={`w-3.5 h-3.5 ${detectingLoc ? 'animate-spin' : ''}`} />
                                    <span>{detectingLoc ? 'Detecting GPS...' : 'Detect Exact GPS Location'}</span>
                                </button>
                            </div>
                            <div className="relative flex items-center">
                                <MapPin className="absolute left-3.5 w-4 h-4 text-[#6B635B] pointer-events-none" />
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Jaipur, Rajasthan or click Detect GPS"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    style={{ paddingLeft: '2.5rem' }}
                                    className="input-base"
                                />
                            </div>
                            {coords && (
                                <p className="text-[10px] text-[#2E7D32] flex items-center gap-1 mt-1 font-mono">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Exact coordinates: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)} (PostGIS linked)
                                </p>
                            )}
                        </div>

                        {/* 5. Tax & Compliance ID (Sec 194-O TDS) */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1B18]">
                                    5. Artisan Card / PAN / GSTIN ID (Optional)
                                </label>
                                <span className="text-[10px] text-[#6B635B]">
                                    Sec 194-O TDS Compliance
                                </span>
                            </div>
                            <div className="relative flex items-center">
                                <FileText className="absolute left-3.5 w-4 h-4 text-[#6B635B] pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="e.g. Pehchan Artisan ID / PAN / GSTIN"
                                    value={taxId}
                                    onChange={(e) => setTaxId(e.target.value)}
                                    style={{ paddingLeft: '2.5rem' }}
                                    className="input-base font-mono uppercase"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2 cursor-pointer text-sm font-semibold"
                        >
                            <span>{loading ? 'Saving Profile & Logo...' : 'Complete Artisan Registration & Go to Dashboard'}</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
