'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '../../../../lib/supabaseClient';
import {
    Video,
    ShieldCheck,
    Search,
    ShoppingBag,
    Sparkles,
    Play,
    CheckCircle2,
    X,
    Filter,
    Star,
    MapPin,
    ArrowRight,
    User,
} from 'lucide-react';
import Link from 'next/link';

const CRAFT_CATEGORIES = [
    { id: 'all', label: 'All Crafts', icon: '✨' },
    { id: 'bamboo', label: 'Bamboo & Coconut Craft', icon: '🎋' },
    { id: 'metalcraft', label: 'Metalcraft & Brassware', icon: '🪚' },
    { id: 'jewelry', label: 'Handmade Jewelry', icon: '💍' },
    { id: 'stonecraft', label: 'Stone & Marble Craft', icon: '🗿' },
    { id: 'woodworking', label: 'Woodworking & Carving', icon: '🪵' },
    { id: 'pottery', label: 'Pottery & Ceramics', icon: '🏺' },
    { id: 'handloom', label: 'Handloom & Textiles', icon: '🧵' },
    { id: 'painting', label: 'Traditional Painting & Folk Art', icon: '🎨' },
    { id: 'leathercraft', label: 'Leathercraft', icon: '👜' },
    { id: 'terracotta', label: 'Terracotta & Clay Art', icon: '🪴' },
    { id: 'embroidery', label: 'Embroidery & Zardozi', icon: '🪡' },
];

interface ArtisanProductPill {
    name: string;
    price: number;
}

interface MakerCardItem {
    id: string;
    vendor_id: string;
    vendorName: string;
    avatarUrl: string;
    rating: number;
    reviewCount: number;
    location: string;
    category: string;
    categoryLabel: string;
    videoUrl: string;
    confidenceScore: number;
    story: string;
    productPills: ArtisanProductPill[];
    startingPrice: number;
    batchMarking: string;
}

const FEATURED_MAKERS: MakerCardItem[] = [
    {
        id: 'maker-sukram',
        vendor_id: 'v-sukram-01',
        vendorName: 'Sukram Kashyap',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        rating: 4.95,
        reviewCount: 47,
        location: 'Bastar, Chhattisgarh',
        category: 'metalcraft',
        categoryLabel: 'Metalwork',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-blacksmith-hammering-glowing-iron-41717-large.mp4',
        confidenceScore: 0.988,
        story: 'Creating 4,000-year-old Harappan lost-wax brass and bronze tribal sculptures, lamp stands, and deities using beeswax coils and riverbed clay molds.',
        productPills: [
            { name: 'Bastar Tribal Musician Dhokra Sculpture (Set of 3)', price: 5400 },
            { name: 'Dhokra Ceremonial Nandi Bull Figurine', price: 3600 },
        ],
        startingPrice: 3200,
        batchMarking: '#02/30',
    },
    {
        id: 'maker-meenakshi',
        vendor_id: 'v-meenakshi-02',
        vendorName: 'Meenakshi Sundaram',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        rating: 4.97,
        reviewCount: 73,
        location: 'Thanjavur, Tamil Nadu',
        category: 'jewelry',
        categoryLabel: 'Jewelry',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-jeweler-working-with-gems-41718-large.mp4',
        confidenceScore: 0.969,
        story: 'Crafting authentic 92.5 Hallmarked silver temple jewelry, silver filigree earrings, and gold-dipped bridal waistbands (Oddiyanam) with natural Kemp stones.',
        productPills: [
            { name: 'Tarakasi 92.5 Silver Filigree Peacock Jhumkas', price: 4800 },
            { name: 'Kemp Temple Stone Silver Choker Necklace', price: 13500 },
        ],
        startingPrice: 4800,
        batchMarking: '#01/10',
    },
    {
        id: 'maker-haroon',
        vendor_id: 'v-haroon-03',
        vendorName: 'Mohammad Haroon',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        rating: 4.94,
        reviewCount: 51,
        location: 'Agra, Uttar Pradesh',
        category: 'stonecraft',
        categoryLabel: 'Stone Carving',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-potter-working-on-a-clay-vase-41712-large.mp4',
        confidenceScore: 0.979,
        story: 'Preserving the Taj Mahal Parchin Kari technique. Inlaying semi-precious stones (Lapis Lazuli, Malachite, Jasper, Mother of Pearl) into pure Makrana white marble.',
        productPills: [
            { name: 'Makrana Marble Inlay Octagonal Tabletop (15 inch)', price: 16500 },
            { name: 'Floral Inlaid Marble Jewelry Box with Velvet Tray', price: 6200 },
        ],
        startingPrice: 6200,
        batchMarking: '#05/25',
    },
    {
        id: 'maker-kavita',
        vendor_id: 'v-kavita-04',
        vendorName: 'Kavita Devi (Master Weaver)',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        rating: 4.98,
        reviewCount: 89,
        location: 'Varanasi, Uttar Pradesh',
        category: 'handloom',
        categoryLabel: 'Handloom',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-weaving-on-a-loom-41713-large.mp4',
        confidenceScore: 0.965,
        story: 'Pure mulberry unbleached silk and hand-punched Jacquard graph cards. Pit-loom hand weaving with certified real gold and silver zari threads.',
        productPills: [
            { name: 'Pure Mulberry Silk Katan Banarasi Bridal Saree', price: 24500 },
            { name: 'Kadhwa Weave Tanchoi Silk Stole (Silver Zari)', price: 8200 },
        ],
        startingPrice: 8200,
        batchMarking: '#08/15',
    },
    {
        id: 'maker-jaipur-wood',
        vendor_id: 'v-jaipur-05',
        vendorName: 'Jaipur Heritage Woodcraft',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        rating: 4.91,
        reviewCount: 36,
        location: 'Jaipur, Rajasthan',
        category: 'woodworking',
        categoryLabel: 'Woodworking',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-carpenter-measuring-a-piece-of-wood-41716-large.mp4',
        confidenceScore: 0.942,
        story: 'Hand-chiseled floral relief in seasoned Rajasthan Sheesham and Teak wood. Traditional dovetail joinery with natural beeswax burnish finish.',
        productPills: [
            { name: 'Royal Sheesham Carved Armchair (Teak Polish)', price: 18500 },
            { name: 'Jharokha Carved Wall Mirror with Brass Accents', price: 5400 },
        ],
        startingPrice: 5400,
        batchMarking: '#04/20',
    },
    {
        id: 'maker-mitti',
        vendor_id: 'v-mitti-06',
        vendorName: 'Mitti Studio Pottery',
        avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
        rating: 4.96,
        reviewCount: 64,
        location: 'Khurja, Uttar Pradesh',
        category: 'pottery',
        categoryLabel: 'Pottery',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-potter-working-on-a-clay-vase-41712-large.mp4',
        confidenceScore: 0.954,
        story: 'Wheel-thrown stoneware and terracotta pottery. Naturally glazed with river sediment and wood ash, kiln-fired at 1200°C for food-grade strength.',
        productPills: [
            { name: 'Hand-Thrown Terracotta Urli & Studio Vase', price: 2499 },
            { name: 'Stoneware Hand-Glazed Dinner Set (12 Pcs)', price: 7800 },
        ],
        startingPrice: 2499,
        batchMarking: '#12/50',
    },
];

export default function ReelFeedPage() {
    const supabase = createClient();
    const [makers, setMakers] = useState<MakerCardItem[]>(FEATURED_MAKERS);
    const [loading, setLoading] = useState(true);
    const [isVendor, setIsVendor] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [activeModalVideo, setActiveModalVideo] = useState<MakerCardItem | null>(null);

    useEffect(() => {
        fetchMakersAndReels();

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

    const fetchMakersAndReels = async () => {
        setLoading(true);
        try {
            const { data: dbReels } = await supabase
                .from('verification_reels')
                .select('*, vendor:profiles(id, full_name, avatar_url, vendor_verified)')
                .in('status', ['VERIFIED', 'AUTO_APPROVED'])
                .order('created_at', { ascending: false })
                .limit(20);

            if (dbReels && dbReels.length > 0) {
                const formattedFromDb: MakerCardItem[] = dbReels.map((r: any, idx: number) => {
                    const meta = r.extracted_metadata || {};
                    const score = r.ai_confidence_score || r.confidence_score || 0.94;
                    const catId = (meta.category || 'bamboo').toLowerCase();
                    const catObj = CRAFT_CATEGORIES.find((c) => c.id === catId);

                    const vendorName = r.vendor?.full_name || 'Khushboo Handicrafts';
                    const avatarUrl = r.vendor?.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80';
                    const productTitle = meta.productTitle || 'Hand-Painted Coconut Vase';
                    const price = meta.price ? Number(meta.price) : 300;

                    return {
                        id: r.id || `db-${idx}`,
                        vendor_id: r.vendor_id,
                        vendorName,
                        avatarUrl,
                        rating: 4.96,
                        reviewCount: 24 + idx * 3,
                        location: 'Central India Craft Cluster',
                        category: catId,
                        categoryLabel: catObj ? catObj.label.split(' ')[0] : 'Coconut Craft',
                        videoUrl: r.video_url,
                        confidenceScore: score,
                        story: meta.description || meta.summary || 'Handcrafted coconut peel and natural materials shaped and painted by hand in artisan workshop.',
                        productPills: [
                            {
                                name: productTitle,
                                price: price,
                            },
                        ],
                        startingPrice: price,
                        batchMarking: meta.batch_marking || '#08/50',
                    };
                });

                // Combine real uploaded database reels at the front
                setMakers([...formattedFromDb, ...FEATURED_MAKERS]);
            } else {
                setMakers(FEATURED_MAKERS);
            }
        } catch (err) {
            console.warn('Error fetching reels from DB:', err);
            setMakers(FEATURED_MAKERS);
        } finally {
            setLoading(false);
        }
    };

    // Filter makers by Category and Search Query
    const filteredMakers = useMemo(() => {
        return makers.filter((maker) => {
            const itemCat = (maker.category || 'other').toLowerCase();
            const makerName = (maker.vendorName || '').toLowerCase();
            const location = (maker.location || '').toLowerCase();
            const story = (maker.story || '').toLowerCase();
            const query = searchQuery.trim().toLowerCase();

            const matchesCategory = activeCategory === 'all' || itemCat === activeCategory.toLowerCase();
            const matchesSearch =
                !query ||
                makerName.includes(query) ||
                location.includes(query) ||
                story.includes(query) ||
                itemCat.includes(query);

            return matchesCategory && matchesSearch;
        });
    }, [makers, activeCategory, searchQuery]);

    // Live search suggestions
    const searchSuggestions = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const query = searchQuery.toLowerCase();
        const suggestions = new Set<string>();

        makers.forEach((m) => {
            if (m.vendorName.toLowerCase().includes(query)) suggestions.add(m.vendorName);
            if (m.location.toLowerCase().includes(query)) suggestions.add(m.location);
            if (m.categoryLabel.toLowerCase().includes(query)) suggestions.add(m.categoryLabel);
        });

        return Array.from(suggestions).slice(0, 5);
    }, [makers, searchQuery]);

    return (
        <main className="min-h-screen bg-[#FDFBF7] pb-20">
            {/* ─── Video Modal Player when clicking "AI Reel" ─────────────────── */}
            {activeModalVideo && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-black border border-white/20 rounded-3xl overflow-hidden shadow-modal max-w-sm w-full relative flex flex-col">
                        {/* Close button */}
                        <button
                            onClick={() => setActiveModalVideo(null)}
                            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="relative aspect-[9/16] bg-black">
                            <video
                                src={activeModalVideo.videoUrl}
                                controls
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />

                            {/* Top Badge */}
                            <div className="absolute top-4 left-4 z-10">
                                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#EDF7ED] text-[#2E7D32] border border-[#2E7D32]/30 flex items-center gap-1 shadow-md">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>AI VERIFIED ({(activeModalVideo.confidenceScore * 100).toFixed(1)}%)</span>
                                </span>
                            </div>

                            {/* Bottom Info Overlay */}
                            <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-md p-4 rounded-2xl text-white border border-white/10">
                                <h3 className="font-bold text-sm font-display mb-1">{activeModalVideo.vendorName}</h3>
                                <p className="text-xs text-white/80 line-clamp-2 mb-3 leading-relaxed">{activeModalVideo.story}</p>
                                <Link
                                    href={`/messages?artisanId=${activeModalVideo.vendor_id}&vendorName=${encodeURIComponent(activeModalVideo.vendorName)}&productTitle=${encodeURIComponent(activeModalVideo.productPills[0]?.name || 'Handmade Craft')}&price=${activeModalVideo.startingPrice}&category=${encodeURIComponent(activeModalVideo.category)}`}
                                    className="btn-primary text-xs py-2.5 w-full flex items-center justify-center gap-1.5 font-semibold text-center"
                                >
                                    <ShoppingBag className="w-3.5 h-3.5" />
                                    <span>Commission Custom Order</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Top Header & Search Bar ───────────────────────────────────── */}
            <div className="sticky top-14 z-40 bg-white/95 backdrop-blur-xl border-b border-[#E8E2D9] px-4 py-4 shadow-xs">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Header Title */}
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

                    {/* Search Input */}
                    <div className="w-full md:max-w-md relative">
                        <div className="relative flex items-center">
                            <Search className="absolute left-3.5 w-4 h-4 text-[#6B635B] pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search products, crafts (e.g. pottery, teakwood, saree)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ paddingLeft: '2.5rem' }}
                                className="w-full h-10 pr-4 text-xs bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#C85A32] focus:ring-2 focus:ring-[#C85A32]/10 transition-all placeholder:text-[#6B635B]"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 text-[#6B635B] hover:text-[#1E1B18]"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Search Suggestions Dropdown */}
                        {searchSuggestions.length > 0 && (
                            <div className="absolute top-11 left-0 right-0 bg-white border border-[#E8E2D9] rounded-xl shadow-elevated z-50 overflow-hidden">
                                {searchSuggestions.map((sugg, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSearchQuery(sugg)}
                                        className="w-full px-4 py-2.5 text-left text-xs font-medium text-[#1E1B18] hover:bg-[#FAF8F5] flex items-center justify-between border-b border-[#F3EFEA] last:border-0 cursor-pointer"
                                    >
                                        <span>{sugg}</span>
                                        <span className="text-[10px] text-[#6B635B]">Filter →</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Vendor Upload Button (Only if vendor mode is active) */}
                    {isVendor && (
                        <Link
                            href="/verification/upload"
                            className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shrink-0"
                        >
                            <Video className="w-3.5 h-3.5" />
                            Upload Product Reel
                        </Link>
                    )}
                </div>

                {/* Horizontal Category Filter Pills */}
                <div className="max-w-7xl mx-auto mt-3 overflow-x-auto pb-1 flex items-center gap-2 no-scrollbar">
                    {CRAFT_CATEGORIES.map((cat) => {
                        const isSelected = activeCategory === cat.id;
                        const count =
                            cat.id === 'all'
                                ? makers.length
                                : makers.filter((m) => m.category === cat.id).length;

                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                                    isSelected
                                        ? 'bg-[#C85A32] text-white border-[#C85A32] shadow-xs'
                                        : 'bg-white text-[#6B635B] border-[#E8E2D9] hover:border-[#C85A32]/50 hover:text-[#1E1B18]'
                                }`}
                            >
                                <span>{cat.icon}</span>
                                <span>{cat.label}</span>
                                <span
                                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                        isSelected ? 'bg-white/25 text-white' : 'bg-[#F3EFEA] text-[#6B635B]'
                                    }`}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ─── Main Artisan Discovery Cards Grid ─────────────────────────── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <p className="text-xs text-[#6B635B] animate-pulse-subtle">Loading verified master artisans...</p>
                    </div>
                ) : filteredMakers.length === 0 ? (
                    <div className="card p-12 text-center max-w-md mx-auto my-12 bg-white">
                        <div className="w-12 h-12 rounded-2xl bg-[#F3EFEA] flex items-center justify-center mx-auto mb-3 text-[#6B635B]">
                            <Filter className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-[#1E1B18] font-display">
                            No artisan makers found
                        </h3>
                        <p className="text-xs text-[#6B635B] mt-1 mb-4">
                            {searchQuery ? `No matches for "${searchQuery}".` : 'Try selecting a different craft category.'}
                        </p>
                        <button
                            onClick={() => {
                                setActiveCategory('all');
                                setSearchQuery('');
                            }}
                            className="btn-primary text-xs py-2 px-4"
                        >
                            Reset Category Filter
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMakers.map((maker) => {
                            const scorePct = (maker.confidenceScore * 100).toFixed(1);

                            return (
                                <div
                                    key={maker.id}
                                    className="bg-white border border-[#E8E2D9] rounded-3xl p-5 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between group"
                                >
                                    <div>
                                        {/* Top Media Video Player Box with Overlays */}
                                        <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-black mb-4 group/media border border-[#E8E2D9]">
                                            <video
                                                src={maker.videoUrl}
                                                controls
                                                playsInline
                                                preload="metadata"
                                                className="w-full h-full object-cover"
                                            />

                                            {/* Top Left: AI Verified Badge */}
                                            <div className="absolute top-3 left-3 z-10 pointer-events-none">
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[#2E7D32] border border-[#2E7D32]/40 shadow-xs">
                                                    <CheckCircle2 className="w-3 h-3 text-[#2E7D32]" />
                                                    <span>AI VERIFIED</span>
                                                </span>
                                            </div>

                                            {/* Bottom Left: Craft Category Badge */}
                                            <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
                                                <span className="text-[11px] font-semibold bg-black/75 backdrop-blur-md text-white px-2.5 py-0.5 rounded-md">
                                                    {maker.categoryLabel}
                                                </span>
                                            </div>

                                            {/* Bottom Right: Interactive AI Reel Play Button */}
                                            <div className="absolute bottom-3 right-3 z-10">
                                                <button
                                                    onClick={() => setActiveModalVideo(maker)}
                                                    className="flex items-center gap-1 text-[11px] font-semibold bg-black/80 hover:bg-black text-white px-2.5 py-0.5 rounded-md backdrop-blur-md transition-colors cursor-pointer shadow-sm"
                                                    title="Expand Full Reel"
                                                >
                                                    <Play className="w-3 h-3 text-white fill-white" />
                                                    <span>AI Reel ({scorePct}%)</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Artisan Profile Header */}
                                        <div className="flex items-center gap-3 mb-2.5">
                                            <div className="w-11 h-11 rounded-full overflow-hidden border border-[#E8E2D9] shrink-0 bg-[#C85A32]">
                                                <img
                                                    src={maker.avatarUrl}
                                                    alt={maker.vendorName}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-display font-bold text-base text-[#1E1B18] truncate leading-tight">
                                                    {maker.vendorName}
                                                </h3>
                                                <div className="flex items-center gap-1.5 text-xs text-[#6B635B] mt-0.5">
                                                    <span className="flex items-center gap-1 text-[#E08E45] font-semibold">
                                                        <Star className="w-3.5 h-3.5 fill-[#E08E45]" />
                                                        {maker.rating} ({maker.reviewCount})
                                                    </span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-0.5 truncate">
                                                        <MapPin className="w-3 h-3 shrink-0 text-[#6B635B]" />
                                                        {maker.location}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Artisan Craft Story / Description */}
                                        <p className="text-xs text-[#6B635B] leading-relaxed line-clamp-3 mb-4">
                                            {maker.story}
                                        </p>

                                        {/* Product Offerings Pills */}
                                        <div className="flex flex-col gap-1.5 mb-4">
                                            {maker.productPills.map((pill, pIdx) => (
                                                <div
                                                    key={pIdx}
                                                    className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl px-3 py-1.5 text-[11px] text-[#1E1B18] font-medium flex items-center justify-between gap-2 truncate"
                                                    title={`${pill.name} (₹${pill.price.toLocaleString('en-IN')})`}
                                                >
                                                    <span className="truncate">{pill.name}</span>
                                                    <span className="font-mono font-bold text-[#C85A32] shrink-0">
                                                        ₹{pill.price.toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Card Footer: Starting Price & Action Buttons */}
                                    <div className="flex items-center justify-between pt-3 border-t border-[#F3EFEA] mt-2">
                                        <div>
                                            <span className="text-[10px] font-semibold text-[#6B635B] block uppercase tracking-wider">
                                                From
                                            </span>
                                            <span className="text-base font-bold text-[#C85A32] font-mono leading-none">
                                                ₹{maker.startingPrice.toLocaleString('en-IN')}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={`/artisan?makerId=${maker.vendor_id}`}
                                                className="border border-[#E8E2D9] bg-white hover:bg-[#FAF8F5] text-[#1E1B18] text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors"
                                            >
                                                Profile
                                            </Link>
                                            <Link
                                                href={`/messages?artisanId=${maker.vendor_id}&vendorName=${encodeURIComponent(maker.vendorName)}&productTitle=${encodeURIComponent(maker.productPills[0]?.name || 'Handcrafted Craft')}&price=${maker.startingPrice}&category=${encodeURIComponent(maker.category)}`}
                                                className="bg-[#C85A32] hover:bg-[#B04B26] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
                                            >
                                                Commission
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
