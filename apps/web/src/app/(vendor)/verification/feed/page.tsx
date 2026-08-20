'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '../../../../lib/supabaseClient';
import {
    Video,
    ShieldCheck,
    AlertTriangle,
    Eye,
    ChevronLeft,
    ChevronRight,
    Search,
    Tag,
    ShoppingBag,
    MessageSquare,
    Sparkles,
    LayoutGrid,
    Play,
    CheckCircle2,
    X,
    Filter,
} from 'lucide-react';
import Link from 'next/link';

const CRAFT_CATEGORIES = [
    { id: 'all', label: 'All Crafts', icon: '✨' },
    { id: 'woodworking', label: 'Woodworking & Carving', icon: '🪵' },
    { id: 'pottery', label: 'Pottery & Ceramics', icon: '🏺' },
    { id: 'handloom', label: 'Handloom & Textiles', icon: '🧵' },
    { id: 'metalcraft', label: 'Metalcraft & Brassware', icon: '🪚' },
    { id: 'leathercraft', label: 'Leathercraft', icon: '👜' },
    { id: 'jewelry', label: 'Handmade Jewelry', icon: '💍' },
    { id: 'stonecraft', label: 'Stone & Marble Craft', icon: '🗿' },
    { id: 'painting', label: 'Traditional Painting & Folk Art', icon: '🎨' },
    { id: 'bamboo', label: 'Bamboo & Cane Craft', icon: '🎋' },
    { id: 'terracotta', label: 'Terracotta & Clay Art', icon: '🪴' },
    { id: 'embroidery', label: 'Embroidery & Zardozi', icon: '🪡' },
    { id: 'glasscraft', label: 'Glass & Mosaic Craft', icon: '✨' },
];

// Fallback demo reels to ensure every category has high-quality content out-of-the-box
const MOCK_REELS = [
    {
        id: 'mock-1',
        vendor_id: 'v1',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-potter-working-on-a-clay-vase-41712-large.mp4',
        status: 'AUTO_APPROVED',
        confidence_score: 0.94,
        extracted_metadata: {
            productTitle: 'Hand-Thrown Terracotta Urli & Vase',
            category: 'pottery',
            price: 2499,
            description: 'Traditional wheel-thrown pottery with natural burnished glaze and studio stamp.',
            summary: 'Artisan wheel-thrown ceramic process detected with high confidence.',
            batch_marking: '#12/50',
            logo_detected: true,
            logo_matched: true,
            liveness_verified: true,
        },
        created_at: new Date(Date.now() - 3600000).toISOString(),
        vendor: {
            full_name: 'Mitti Studio Pottery',
            avatar_url: null,
            vendor_verified: true,
        },
    },
    {
        id: 'mock-2',
        vendor_id: 'v2',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-carpenter-measuring-a-piece-of-wood-41716-large.mp4',
        status: 'AUTO_APPROVED',
        confidence_score: 0.91,
        extracted_metadata: {
            productTitle: 'Royal Sheesham Carved Armchair',
            category: 'woodworking',
            price: 18500,
            description: 'Hand-chiseled floral relief in seasoned Rajasthan Sheesham wood.',
            summary: 'Precision wood chisel carving and workshop branding verified.',
            batch_marking: '#04/20',
            logo_detected: true,
            logo_matched: true,
            liveness_verified: true,
        },
        created_at: new Date(Date.now() - 7200000).toISOString(),
        vendor: {
            full_name: 'Jaipur Heritage Woodcraft',
            avatar_url: null,
            vendor_verified: true,
        },
    },
    {
        id: 'mock-3',
        vendor_id: 'v3',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-woman-weaving-on-a-loom-41713-large.mp4',
        status: 'AUTO_APPROVED',
        confidence_score: 0.96,
        extracted_metadata: {
            productTitle: 'Pure Mulberry Silk Handloom Saree',
            category: 'handloom',
            price: 12800,
            description: 'Intricate pit-loom weaving with genuine gold zari motifs.',
            summary: 'Traditional shuttle loom motion and maker presence verified.',
            batch_marking: '#08/15',
            logo_detected: true,
            logo_matched: true,
            liveness_verified: true,
        },
        created_at: new Date(Date.now() - 14400000).toISOString(),
        vendor: {
            full_name: 'Varanasi Weavers Guild',
            avatar_url: null,
            vendor_verified: true,
        },
    },
    {
        id: 'mock-4',
        vendor_id: 'v4',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-blacksmith-hammering-glowing-iron-41717-large.mp4',
        status: 'AUTO_APPROVED',
        confidence_score: 0.89,
        extracted_metadata: {
            productTitle: 'Hand-Beaten Brass Temple Urli',
            category: 'metalcraft',
            price: 6200,
            description: 'Traditional Moradabad hand-beaten bell metal brass with engraved border.',
            summary: 'Hammered hot metal work and maker brand seal authenticated.',
            batch_marking: '#02/30',
            logo_detected: true,
            logo_matched: true,
            liveness_verified: true,
        },
        created_at: new Date(Date.now() - 28800000).toISOString(),
        vendor: {
            full_name: 'Moradabad Brass Masters',
            avatar_url: null,
            vendor_verified: true,
        },
    },
    {
        id: 'mock-5',
        vendor_id: 'v5',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-jeweler-working-with-gems-41718-large.mp4',
        status: 'AUTO_APPROVED',
        confidence_score: 0.93,
        extracted_metadata: {
            productTitle: 'Kundan Meenakari Silver Choker',
            category: 'jewelry',
            price: 9400,
            description: 'Enamel foil inlay with natural uncut gemstones handcrafted in 92.5 silver.',
            summary: 'Intricate gemstone setting and hallmarking verified.',
            batch_marking: '#01/10',
            logo_detected: true,
            logo_matched: true,
            liveness_verified: true,
        },
        created_at: new Date(Date.now() - 43200000).toISOString(),
        vendor: {
            full_name: 'Johari Bazaar Artisans',
            avatar_url: null,
            vendor_verified: true,
        },
    },
];

interface Reel {
    id: string;
    vendor_id: string;
    video_url: string;
    status: string;
    confidence_score: number | null;
    extracted_metadata: {
        productTitle?: string;
        category?: string;
        price?: number;
        description?: string;
        summary?: string;
        batch_marking?: string;
        logo_detected?: boolean;
        logo_matched?: boolean;
        liveness_verified?: boolean;
    } | null;
    created_at: string;
    vendor: {
        full_name: string;
        avatar_url?: string | null;
        vendor_verified: boolean;
    } | null;
}

export default function ReelFeedPage() {
    const supabase = createClient();
    const [reels, setReels] = useState<Reel[]>([]);
    const [loading, setLoading] = useState(true);
    const [isVendor, setIsVendor] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [viewMode, setViewMode] = useState<'grid' | 'reel'>('grid');
    const [activeReelIndex, setActiveReelIndex] = useState(0);

    useEffect(() => {
        fetchReels();

        const checkUserRole = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('is_vendor')
                    .eq('id', user.id)
                    .maybeSingle();

                if (data) {
                    setIsVendor(!!data.is_vendor);
                } else if (user.user_metadata?.is_vendor !== undefined) {
                    setIsVendor(!!user.user_metadata.is_vendor);
                }
            } else {
                setIsVendor(false);
            }
        };

        checkUserRole();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                checkUserRole();
            } else {
                setIsVendor(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchReels = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('verification_reels')
                .select('*, vendor:profiles(full_name, avatar_url, vendor_verified)')
                .in('status', ['AUTO_APPROVED', 'NEEDS_REVIEW', 'PENDING'])
                .order('created_at', { ascending: false })
                .limit(50);

            if (data && data.length > 0) {
                // Combine DB reels with curated demo reels
                const combined = [...(data as Reel[]), ...MOCK_REELS];
                setReels(combined);
            } else {
                setReels(MOCK_REELS as Reel[]);
            }
        } catch {
            setReels(MOCK_REELS as Reel[]);
        } finally {
            setLoading(false);
        }
    };

    // Filter reels by Category and Search Query
    const filteredReels = useMemo(() => {
        return reels.filter((reel) => {
            const meta = reel.extracted_metadata || {};
            const itemCat = (meta.category || 'other').toLowerCase();
            const itemTitle = (meta.productTitle || '').toLowerCase();
            const itemDesc = (meta.description || '').toLowerCase();
            const vendorName = (reel.vendor?.full_name || '').toLowerCase();
            const query = searchQuery.trim().toLowerCase();

            // Category match
            const matchesCategory = activeCategory === 'all' || itemCat === activeCategory.toLowerCase();

            // Search query match
            const matchesSearch =
                !query ||
                itemTitle.includes(query) ||
                itemDesc.includes(query) ||
                vendorName.includes(query) ||
                itemCat.includes(query);

            return matchesCategory && matchesSearch;
        });
    }, [reels, activeCategory, searchQuery]);

    // Live search suggestions based on product titles & categories
    const searchSuggestions = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const query = searchQuery.toLowerCase();
        const suggestions = new Set<string>();

        reels.forEach((r) => {
            const title = r.extracted_metadata?.productTitle;
            const cat = r.extracted_metadata?.category;
            const vendor = r.vendor?.full_name;

            if (title && title.toLowerCase().includes(query)) suggestions.add(title);
            if (vendor && vendor.toLowerCase().includes(query)) suggestions.add(vendor);
            if (cat && cat.toLowerCase().includes(query)) {
                const found = CRAFT_CATEGORIES.find((c) => c.id === cat);
                if (found) suggestions.add(found.label);
            }
        });

        return Array.from(suggestions).slice(0, 5);
    }, [reels, searchQuery]);

    const getConfidencePill = (score: number | null) => {
        if (score === null || score === undefined) {
            return { label: 'AI Reviewing', color: 'bg-[#FFF4E5] text-[#ED6C02]' };
        }
        const pct = Math.round(score * 100);
        if (pct >= 85) {
            return { label: `✓ ${pct}% AI Verified`, color: 'bg-[#EDF7ED] text-[#2E7D32]' };
        }
        return { label: `${pct}% AI Review`, color: 'bg-[#FFF4E5] text-[#ED6C02]' };
    };

    return (
        <main className="min-h-screen bg-[#FDFBF7] pb-16">
            {/* Top Navigation & Search Bar */}
            <div className="sticky top-14 z-40 bg-white/90 backdrop-blur-xl border-b border-[#E8E2D9] px-4 py-4 shadow-sm">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Header Title */}
                    <div className="flex items-center gap-3 w-full md:w-auto justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-[#C85A32]/10 text-[#C85A32] flex items-center justify-center">
                                <Video className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="font-display font-bold text-base sm:text-lg text-[#1E1B18]">
                                    Artisan Product Reels
                                </h1>
                                <p className="text-[11px] text-[#6B635B]">
                                    Browse AI-verified handmade process videos by craft category
                                </p>
                            </div>
                        </div>

                        {/* View Switcher (Mobile) */}
                        <div className="flex md:hidden items-center bg-[#F3EFEA] rounded-lg p-0.5">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#C85A32]' : 'text-[#6B635B]'}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('reel')}
                                className={`p-1.5 rounded-md ${viewMode === 'reel' ? 'bg-white shadow-sm text-[#C85A32]' : 'text-[#6B635B]'}`}
                            >
                                <Play className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Search Bar with Live Suggestions */}
                    <div className="relative w-full md:max-w-md">
                        <div className="relative flex items-center">
                            <Search className="absolute left-3.5 w-4 h-4 text-[#6B635B] pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search products, crafts (e.g. pottery, teakwood, saree)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ paddingLeft: '2.5rem', paddingRight: searchQuery ? '2.5rem' : '1rem' }}
                                className="input-base shadow-sm"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 text-[#6B635B] hover:text-[#1E1B18]"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Search Suggestions Dropdown */}
                        {searchSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E8E2D9] rounded-xl shadow-elevated overflow-hidden z-50 animate-fade-in">
                                {searchSuggestions.map((sugg, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSearchQuery(sugg)}
                                        className="w-full px-4 py-2.5 text-left text-xs font-medium text-[#1E1B18] hover:bg-[#FDFBF7] flex items-center justify-between border-b border-[#F3EFEA] last:border-0 cursor-pointer"
                                    >
                                        <span>{sugg}</span>
                                        <span className="text-[10px] text-[#6B635B]">Filter →</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* View Switcher (Desktop) */}
                    <div className="hidden md:flex items-center gap-2">
                        <div className="flex items-center bg-[#F3EFEA] rounded-lg p-0.5">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                    viewMode === 'grid' ? 'bg-white shadow-sm text-[#C85A32]' : 'text-[#6B635B] hover:text-[#1E1B18]'
                                }`}
                            >
                                <LayoutGrid className="w-3.5 h-3.5" />
                                Grid View
                            </button>
                            <button
                                onClick={() => setViewMode('reel')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                    viewMode === 'reel' ? 'bg-white shadow-sm text-[#C85A32]' : 'text-[#6B635B] hover:text-[#1E1B18]'
                                }`}
                            >
                                <Play className="w-3.5 h-3.5" />
                                Reel Player
                            </button>
                        </div>

                        {isVendor && (
                            <Link
                                href="/verification/upload"
                                className="btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5"
                            >
                                <Video className="w-3.5 h-3.5" />
                                Upload Product Reel
                            </Link>
                        )}
                    </div>
                </div>

                {/* Horizontal Category Filter Pills */}
                <div className="max-w-7xl mx-auto mt-3 overflow-x-auto pb-1 flex items-center gap-2 no-scrollbar">
                    {CRAFT_CATEGORIES.map((cat) => {
                        const isSelected = activeCategory === cat.id;
                        const count =
                            cat.id === 'all'
                                ? reels.length
                                : reels.filter((r) => r.extracted_metadata?.category === cat.id).length;

                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                                    isSelected
                                        ? 'bg-[#C85A32] text-white border-[#C85A32] shadow-sm'
                                        : 'bg-white text-[#6B635B] border-[#E8E2D9] hover:border-[#C85A32]/50 hover:text-[#1E1B18]'
                                }`}
                            >
                                <span>{cat.icon}</span>
                                <span>{cat.label}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                    isSelected ? 'bg-white/20 text-white' : 'bg-[#F3EFEA] text-[#6B635B]'
                                }`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <p className="text-xs text-[#6B635B] animate-pulse-subtle">Loading verified reels...</p>
                    </div>
                ) : filteredReels.length === 0 ? (
                    <div className="card p-12 text-center max-w-md mx-auto my-12 bg-white">
                        <div className="w-12 h-12 rounded-2xl bg-[#F3EFEA] flex items-center justify-center mx-auto mb-3 text-[#6B635B]">
                            <Filter className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-[#1E1B18] font-display">
                            No reels found in this category
                        </h3>
                        <p className="text-xs text-[#6B635B] mt-1 mb-4">
                            {searchQuery ? `No matches for "${searchQuery}".` : 'Be the first artisan to upload a verification reel in this category!'}
                        </p>
                        <button
                            onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
                            className="btn-primary text-xs py-2 px-4"
                        >
                            Reset Category Filter
                        </button>
                    </div>
                ) : viewMode === 'grid' ? (
                    /* ─── GRID VIEW: 9:16 Video Cards ───────────────────────── */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredReels.map((reel) => {
                            const meta = reel.extracted_metadata || {};
                            const confidence = getConfidencePill(reel.confidence_score);
                            const categoryLabel = CRAFT_CATEGORIES.find((c) => c.id === meta.category)?.label || 'Bespoke Craft';

                            return (
                                <div
                                    key={reel.id}
                                    className="card bg-white overflow-hidden group hover:shadow-elevated transition-all flex flex-col border border-[#E8E2D9]"
                                >
                                    {/* 9:16 Video Player Box */}
                                    <div className="relative aspect-[9/16] bg-black overflow-hidden">
                                        <video
                                            src={reel.video_url}
                                            controls
                                            playsInline
                                            preload="metadata"
                                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                                        />

                                        {/* AI Verified Badge Overlay */}
                                        <div className="absolute top-3 left-3 z-10">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${confidence.color}`}>
                                                {confidence.label}
                                            </span>
                                        </div>

                                        {/* Batch Stamp Overlay */}
                                        {meta.batch_marking && (
                                            <div className="absolute top-3 right-3 z-10">
                                                <span className="text-[10px] font-mono font-bold bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-full border border-white/20">
                                                    {meta.batch_marking}
                                                </span>
                                            </div>
                                        )}

                                        {/* Category Pill Tag */}
                                        <div className="absolute bottom-3 left-3 z-10">
                                            <span className="text-[10px] font-semibold bg-white/90 backdrop-blur-md text-[#1E1B18] px-2 py-0.5 rounded-md shadow-sm">
                                                {categoryLabel}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Product Details & Action Footer */}
                                    <div className="p-4 flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <h3 className="font-display font-bold text-sm text-[#1E1B18] truncate" title={meta.productTitle}>
                                                    {meta.productTitle || 'Handcrafted Item'}
                                                </h3>
                                                {meta.price ? (
                                                    <span className="text-xs font-bold text-[#C85A32] font-mono shrink-0">
                                                        ₹{meta.price.toLocaleString('en-IN')}
                                                    </span>
                                                ) : null}
                                            </div>

                                            {/* Maker Info */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-5 h-5 rounded-full bg-[#C85A32] text-white flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0">
                                                    {reel.vendor?.avatar_url ? (
                                                        <img src={reel.vendor.avatar_url} alt="Logo" className="w-full h-full object-cover" />
                                                    ) : (
                                                        reel.vendor?.full_name?.charAt(0) || 'M'
                                                    )}
                                                </div>
                                                <span className="text-xs text-[#6B635B] truncate font-medium">
                                                    {reel.vendor?.full_name || 'Verified Maker'}
                                                </span>
                                                {reel.vendor?.vendor_verified && (
                                                    <CheckCircle2 className="w-3 h-3 text-[#2E7D32] shrink-0" />
                                                )}
                                            </div>

                                            <p className="text-xs text-[#6B635B] line-clamp-2 leading-relaxed mb-3">
                                                {meta.description || meta.summary || 'Handmade by verified artisan.'}
                                            </p>
                                        </div>

                                        <div className="flex gap-2 pt-2 border-t border-[#F3EFEA]">
                                            <Link
                                                href={`/messages?artisanId=${reel.vendor_id}&reelId=${reel.id}&productTitle=${encodeURIComponent(meta.productTitle || 'Handmade Item')}&price=${meta.price || 0}&category=${encodeURIComponent(meta.category || 'craft')}&videoUrl=${encodeURIComponent(reel.video_url)}&vendorName=${encodeURIComponent(reel.vendor?.full_name || 'Artisan')}`}
                                                className="btn-primary text-xs py-2 flex-1 text-center font-semibold flex items-center justify-center gap-1.5"
                                            >
                                                <ShoppingBag className="w-3.5 h-3.5" />
                                                <span>Order & Discuss</span>
                                            </Link>
                                            <Link
                                                href="/projects/new"
                                                className="btn-ghost text-xs p-2 flex items-center justify-center text-[#6B635B] hover:text-[#1E1B18]"
                                                title="Custom Commission"
                                            >
                                                <Sparkles className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* ─── IMMERSIVE REEL PLAYER MODE ────────────────────────── */
                    <div className="max-w-md mx-auto flex flex-col items-center">
                        {filteredReels[activeReelIndex] && (
                            <div className="w-full aspect-[9/16] bg-black rounded-2xl overflow-hidden border border-[#E8E2D9] shadow-modal relative">
                                <video
                                    key={filteredReels[activeReelIndex].id}
                                    src={filteredReels[activeReelIndex].video_url}
                                    controls
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover"
                                />

                                {/* Bottom Info Overlay */}
                                <div className="absolute bottom-12 left-4 right-4 bg-black/60 backdrop-blur-md p-4 rounded-xl text-white border border-white/10 pointer-events-auto">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-bold text-sm font-display">
                                            {filteredReels[activeReelIndex].extracted_metadata?.productTitle || 'Handmade Craft'}
                                        </h3>
                                        {filteredReels[activeReelIndex].extracted_metadata?.price && (
                                            <span className="text-xs font-bold text-[#E08E45]">
                                                ₹{filteredReels[activeReelIndex].extracted_metadata?.price?.toLocaleString('en-IN')}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-white/80 line-clamp-2 mb-3">
                                        {filteredReels[activeReelIndex].extracted_metadata?.description || filteredReels[activeReelIndex].extracted_metadata?.summary}
                                    </p>
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/messages?artisanId=${filteredReels[activeReelIndex].vendor_id}&reelId=${filteredReels[activeReelIndex].id}&productTitle=${encodeURIComponent(filteredReels[activeReelIndex].extracted_metadata?.productTitle || 'Handmade Item')}&price=${filteredReels[activeReelIndex].extracted_metadata?.price || 0}&category=${encodeURIComponent(filteredReels[activeReelIndex].extracted_metadata?.category || 'craft')}&videoUrl=${encodeURIComponent(filteredReels[activeReelIndex].video_url)}&vendorName=${encodeURIComponent(filteredReels[activeReelIndex].vendor?.full_name || 'Artisan')}`}
                                            className="btn-primary text-xs py-2 px-3 flex-1 text-center font-semibold flex items-center justify-center gap-1.5"
                                        >
                                            <ShoppingBag className="w-3.5 h-3.5" />
                                            <span>Order & Inquire This Product</span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between w-full mt-4 px-4">
                            <button
                                onClick={() => setActiveReelIndex(Math.max(0, activeReelIndex - 1))}
                                disabled={activeReelIndex === 0}
                                className="btn-ghost text-xs py-2 px-4 flex items-center gap-1 disabled:opacity-40"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </button>
                            <span className="text-xs font-mono text-[#6B635B]">
                                {activeReelIndex + 1} / {filteredReels.length}
                            </span>
                            <button
                                onClick={() => setActiveReelIndex(Math.min(filteredReels.length - 1, activeReelIndex + 1))}
                                disabled={activeReelIndex === filteredReels.length - 1}
                                className="btn-ghost text-xs py-2 px-4 flex items-center gap-1 disabled:opacity-40"
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
