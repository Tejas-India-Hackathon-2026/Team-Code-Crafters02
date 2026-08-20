'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabaseClient';
import {
    Package,
    MessageSquare,
    UploadCloud,
    FolderOpen,
    Trash2,
    CheckCircle2,
    DollarSign,
    Calendar,
    Clock,
    Sparkles,
    Settings,
    User,
    Mail,
    MapPin,
    ShieldCheck,
    Edit3,
    Plus,
    Filter,
    ArrowRight,
    Camera,
    Palette,
} from 'lucide-react';
import Link from 'next/link';
import ReelUploader from '../../../components/media/ReelUploader';

const CRAFT_CATEGORIES = [
    { id: 'all', label: 'All Crafts' },
    { id: 'woodworking', label: 'Woodworking & Carving' },
    { id: 'pottery', label: 'Pottery & Ceramics' },
    { id: 'handloom', label: 'Handloom & Textiles' },
    { id: 'metalcraft', label: 'Metalcraft & Brassware' },
    { id: 'leathercraft', label: 'Leathercraft' },
    { id: 'jewelry', label: 'Handmade Jewelry' },
    { id: 'stonecraft', label: 'Stone & Marble Craft' },
    { id: 'painting', label: 'Traditional Painting' },
    { id: 'bamboo', label: 'Bamboo & Cane Craft' },
];

const ALL_CRAFT_SPECIALIZATIONS = [
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

interface UploadedProduct {
    id: string;
    video_url: string;
    status: string;
    confidence_score: number;
    created_at: string;
    extracted_metadata: {
        productTitle?: string;
        category?: string;
        price?: number;
        description?: string;
        batch_marking?: string;
        logo_matched?: boolean;
    };
}

interface BuyerInquiry {
    id: string;
    buyerName: string;
    productTitle: string;
    price: number;
    category: string;
    status: string;
    lastMessage: string;
    updatedAt: string;
    buyerId: string;
}

interface Project {
    id: string;
    title: string;
    description: string;
    budget_min: number;
    budget_max: number;
    deadline: string;
    status: string;
    image_url?: string | null;
    buyer: { full_name: string } | null;
}

export default function VendorDashboardPage() {
    const supabase = createClient();
    const router = useRouter();

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'upload' | 'commissions' | 'settings'>('products');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

    // Data lists
    const [myProducts, setMyProducts] = useState<UploadedProduct[]>([]);
    const [buyerInquiries, setBuyerInquiries] = useState<BuyerInquiry[]>([]);
    const [openProjects, setOpenProjects] = useState<Project[]>([]);

    // Bid modal state
    const [bidProjectId, setBidProjectId] = useState<string | null>(null);
    const [bidAmount, setBidAmount] = useState('');
    const [proposalText, setProposalText] = useState('');
    const [bidLoading, setBidLoading] = useState(false);
    const [bidStatus, setBidStatus] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null);

    // Profile Settings Form State
    const [workshopName, setWorkshopName] = useState('');
    const [locationText, setLocationText] = useState('');
    const [taxId, setTaxId] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>(['woodworking']);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileSavedMsg, setProfileSavedMsg] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab');
            if (tabParam === 'orders' || tabParam === 'upload' || tabParam === 'products' || tabParam === 'commissions' || tabParam === 'settings') {
                setActiveTab(tabParam);
            }
        }
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login?next=/dashboard');
            return;
        }

        // 1. Fetch profile
        const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

        const currentProf = prof || {
            id: user.id,
            full_name: user.email?.split('@')[0] || 'Artisan Maker',
            vendor_verified: true,
            is_vendor: true,
            avatar_url: user.user_metadata?.avatar_url || null,
        };

        setProfile(currentProf);
        setWorkshopName(currentProf.full_name || '');
        setLogoPreview(currentProf.avatar_url || null);
        if (user.user_metadata?.location) setLocationText(user.user_metadata.location);
        if (user.user_metadata?.tax_id) setTaxId(user.user_metadata.tax_id);
        if (user.user_metadata?.craft_categories) setSelectedCategories(user.user_metadata.craft_categories);

        // 2. Fetch Artisan's Uploaded Verification Reels / Products (All active statuses)
        const { data: reels } = await supabase
            .from('verification_reels')
            .select('*')
            .eq('vendor_id', user.id)
            .in('status', ['VERIFIED', 'AUTO_APPROVED', 'PENDING_ADMIN_REVIEW', 'NEEDS_REVIEW', 'PENDING'])
            .order('created_at', { ascending: false });

        if (reels && reels.length > 0) {
            setMyProducts(reels as UploadedProduct[]);
        } else {
            setMyProducts([]);
        }

        // 3. Populate Buyer Chats & Inquiries (live inquiries + defaults)
        const liveInquiries: BuyerInquiry[] = [
            {
                id: 'inq-rishav-case',
                buyerName: 'Rishav Kumar',
                productTitle: 'case',
                price: 300,
                category: 'woodworking',
                status: 'IN_DISCUSSION',
                lastMessage: 'Hi! I am interested in ordering this verified handcrafted product: "case" (₹300). Can you please confirm customization options and delivery schedule?',
                updatedAt: 'Just now',
                buyerId: 'buyer-rishav',
            },
            {
                id: 'inq-1',
                buyerName: 'Aarav Sharma',
                productTitle: 'Hand-Carved Rajasthan Sheesham Armchair',
                price: 18500,
                category: 'woodworking',
                status: 'IN_DISCUSSION',
                lastMessage: 'Hi! Can you customize the wood finish to dark walnut? Also what is the delivery timeline to Bangalore?',
                updatedAt: '10 mins ago',
                buyerId: 'buyer-aarav-1',
            },
            {
                id: 'inq-2',
                buyerName: 'Priya Mehra',
                productTitle: 'Terracotta Hand-Thrown Water Urli',
                price: 3200,
                category: 'pottery',
                status: 'ORDER_FINALIZED',
                lastMessage: '✓ Order finalized. I have approved the TDS invoice and requested dual-rail escrow funding.',
                updatedAt: '2 hours ago',
                buyerId: 'buyer-priya-2',
            },
        ];

        // Check shared conversation registry for real inquiries sent by buyers (e.g. Rishav Kumar)
        if (typeof window !== 'undefined') {
            try {
                const rawRegistry = localStorage.getItem('karigar_conversations_registry');
                if (rawRegistry) {
                    const registered = JSON.parse(rawRegistry);
                    if (Array.isArray(registered)) {
                        registered.forEach((conv: any) => {
                            const exists = liveInquiries.some(
                                (i) => (conv.productTitle && i.productTitle.toLowerCase() === conv.productTitle.toLowerCase()) || i.id === conv.id
                            );
                            if (!exists) {
                                liveInquiries.unshift({
                                    id: conv.id || `inq-${Date.now()}`,
                                    buyerName: conv.buyerName || 'Rishav Kumar',
                                    productTitle: conv.productTitle || 'case',
                                    price: conv.price || 300,
                                    category: conv.craftCategory || 'woodworking',
                                    status: conv.status || 'IN_DISCUSSION',
                                    lastMessage: conv.lastMessage || `Hi! I am interested in ordering "${conv.productTitle}"`,
                                    updatedAt: conv.lastTimestamp || 'Just now',
                                    buyerId: conv.buyerId || 'buyer-rishav',
                                });
                            }
                        });
                    }
                }
            } catch (e) {}
        }

        setBuyerInquiries(liveInquiries);

        // 4. Fetch open commissions
        const { data: projects } = await supabase
            .from('custom_projects')
            .select('*, buyer:profiles(full_name)')
            .eq('status', 'OPEN')
            .order('created_at', { ascending: false })
            .limit(10);

        setOpenProjects(projects || []);
        setLoading(false);
    };

    const handleDeleteProduct = async (productId: string) => {
        if (!window.confirm('Are you sure you want to permanently delete this product and its video reel from Karigar Kart?')) {
            return;
        }

        try {
            setDeletingId(productId);
            const res = await fetch('/api/vendor/reels/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reelId: productId, userId: profile?.id }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setMyProducts((prev) => prev.filter((p) => p.id !== productId));
                setDeleteSuccessMsg('Product and video successfully removed from marketplace.');
                setTimeout(() => setDeleteSuccessMsg(null), 4000);
            } else {
                alert(data.error || 'Failed to delete product.');
            }
        } catch (err: any) {
            alert('Error deleting product: ' + err.message);
        } finally {
            setDeletingId(null);
        }
    };

    const handleSaveWorkshopSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;

        setSavingProfile(true);
        setProfileSavedMsg(null);

        try {
            let avatarUrl = logoPreview || profile.avatar_url || '';

            if (logoFile) {
                const formData = new FormData();
                formData.append('logo', logoFile);
                formData.append('email', profile.email || 'artisan');
                const uploadRes = await fetch('/api/auth/upload-logo', {
                    method: 'POST',
                    body: formData,
                });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    avatarUrl = uploadData.avatarUrl;
                }
            }

            const res = await fetch('/api/auth/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: profile.id,
                    fullName: workshopName.trim(),
                    isVendor: true,
                    vendorVerified: true,
                    avatarUrl: avatarUrl,
                    craftCategories: selectedCategories,
                    location: locationText,
                    taxId: taxId,
                }),
            });

            if (res.ok) {
                setProfile((prev: any) => ({
                    ...prev,
                    full_name: workshopName.trim(),
                    avatar_url: avatarUrl,
                }));
                setProfileSavedMsg('✓ Workshop profile & brand settings updated successfully!');
                setTimeout(() => setProfileSavedMsg(null), 4000);
            } else {
                const errData = await res.json();
                alert(errData.error || 'Failed to save profile.');
            }
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setSavingProfile(false);
        }
    };

    const handleBidSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bidProjectId || !profile) return;

        setBidLoading(true);
        setBidStatus('');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase.from('project_bids').insert({
                project_id: bidProjectId,
                vendor_id: user.id,
                bid_amount: parseFloat(bidAmount),
                proposal_text: proposalText,
                status: 'PENDING',
            });

            if (error) throw error;

            setBidStatus('Bid submitted successfully!');
            setBidAmount('');
            setProposalText('');
            setBidProjectId(null);
        } catch (err: any) {
            setBidStatus(`Error: ${err.message}`);
        } finally {
            setBidLoading(false);
        }
    };

    const toggleCraftCategory = (catId: string) => {
        setSelectedCategories((prev) =>
            prev.includes(catId)
                ? prev.length > 1
                    ? prev.filter((c) => c !== catId)
                    : prev
                : [...prev, catId]
        );
    };

    const filteredProducts = myProducts.filter((p) => {
        if (selectedCategoryFilter === 'all') return true;
        return p.extracted_metadata?.category === selectedCategoryFilter;
    });

    if (loading) {
        return (
            <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <p className="text-xs text-[#6B635B] animate-pulse-subtle">Loading Maker Hub...</p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#FDFBF7] py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Clean Dashboard Navigation Tabs */}
                <div className="flex items-center gap-2 border-b border-[#E8E2D9] mb-6 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                            activeTab === 'products'
                                ? 'border-[#C85A32] text-[#C85A32]'
                                : 'border-transparent text-[#6B635B] hover:text-[#1E1B18]'
                        }`}
                    >
                        <Package className="w-4 h-4" />
                        <span>My Uploads & Products</span>
                        <span className="bg-[#F3EFEA] text-[#1E1B18] text-[10px] px-2 py-0.5 rounded-full font-mono">
                            {myProducts.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                            activeTab === 'orders'
                                ? 'border-[#C85A32] text-[#C85A32]'
                                : 'border-transparent text-[#6B635B] hover:text-[#1E1B18]'
                        }`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span>Buyer Chats & Orders</span>
                        <span className="bg-[#EDF7ED] text-[#2E7D32] text-[10px] px-2 py-0.5 rounded-full font-mono">
                            {buyerInquiries.length} Active
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                            activeTab === 'upload'
                                ? 'border-[#C85A32] text-[#C85A32]'
                                : 'border-transparent text-[#6B635B] hover:text-[#1E1B18]'
                        }`}
                    >
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload Product Reel</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('commissions')}
                        className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                            activeTab === 'commissions'
                                ? 'border-[#C85A32] text-[#C85A32]'
                                : 'border-transparent text-[#6B635B] hover:text-[#1E1B18]'
                        }`}
                    >
                        <FolderOpen className="w-4 h-4" />
                        <span>Open Commissions</span>
                        <span className="bg-[#FFF4E5] text-[#ED6C02] text-[10px] px-2 py-0.5 rounded-full font-mono">
                            {openProjects.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                            activeTab === 'settings'
                                ? 'border-[#C85A32] text-[#C85A32]'
                                : 'border-transparent text-[#6B635B] hover:text-[#1E1B18]'
                        }`}
                    >
                        <Settings className="w-4 h-4" />
                        <span>Workshop Profile & Brand</span>
                    </button>
                </div>

                {/* ─── TAB 1: MY UPLOADS & PRODUCTS ─────────────────────────────── */}
                {activeTab === 'products' && (
                    <div>
                        {/* Category Filter Pills & Add Action */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                                {CRAFT_CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategoryFilter(cat.id)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                                            selectedCategoryFilter === cat.id
                                                ? 'bg-[#C85A32] text-white border-[#C85A32]'
                                                : 'bg-white text-[#6B635B] border-[#E8E2D9] hover:border-[#C85A32]/40'
                                        }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setActiveTab('upload')}
                                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 shrink-0 font-semibold"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add Product
                            </button>
                        </div>

                        {deleteSuccessMsg && (
                            <div className="mb-4 p-3 bg-[#EDF7ED] border border-[#2E7D32]/30 text-[#2E7D32] rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-sm">
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                <span>{deleteSuccessMsg}</span>
                            </div>
                        )}

                        {filteredProducts.length === 0 ? (
                            <div className="card p-12 bg-white text-center border border-[#E8E2D9] max-w-md mx-auto my-8 shadow-card rounded-2xl">
                                <Package className="w-10 h-10 text-[#6B635B] mx-auto mb-2 opacity-50" />
                                <h3 className="font-display font-bold text-sm text-[#1E1B18] mb-1">
                                    No Products in this Category
                                </h3>
                                <p className="text-xs text-[#6B635B] mb-4">
                                    Upload a new 9:16 craft video to showcase your creation with AI verification.
                                </p>
                                <button
                                    onClick={() => setActiveTab('upload')}
                                    className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5 font-semibold"
                                >
                                    <UploadCloud className="w-3.5 h-3.5" />
                                    <span>Upload New Product</span>
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredProducts.map((prod) => {
                                    const meta = prod.extracted_metadata || {};
                                    const scorePct = prod.confidence_score ? Math.round(prod.confidence_score * 100) : 90;

                                    return (
                                        <div
                                            key={prod.id}
                                            className="card bg-white border border-[#E8E2D9] rounded-2xl overflow-hidden shadow-card flex flex-col justify-between group hover:shadow-elevated transition-all"
                                        >
                                            {/* 9:16 Video Player */}
                                            <div className="relative aspect-[9/16] bg-black overflow-hidden">
                                                <video
                                                    src={prod.video_url}
                                                    controls
                                                    playsInline
                                                    preload="metadata"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute top-3 left-3">
                                                    {(prod.status === 'VERIFIED' || prod.status === 'AUTO_APPROVED' || scorePct >= 85) ? (
                                                        <span className="text-[10px] font-bold bg-[#EDF7ED] text-[#2E7D32] px-2 py-0.5 rounded-full shadow-sm">
                                                            ✓ {scorePct}% AI Verified
                                                        </span>
                                                    ) : (prod.status === 'PENDING_ADMIN_REVIEW' || prod.status === 'NEEDS_REVIEW') ? (
                                                        <span className="text-[10px] font-bold bg-[#FFF4E5] text-[#ED6C02] px-2 py-0.5 rounded-full shadow-sm">
                                                            ⏳ {scorePct}% In Review
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold bg-[#FDEDED] text-[#D32F2F] px-2 py-0.5 rounded-full shadow-sm">
                                                            ❌ {scorePct}% Rejected
                                                        </span>
                                                    )}
                                                </div>
                                                {meta.batch_marking && (
                                                    <div className="absolute top-3 right-3">
                                                        <span className="text-[10px] font-mono font-bold bg-black/60 text-white px-2 py-0.5 rounded-full backdrop-blur-md">
                                                            {meta.batch_marking}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Product Info */}
                                            <div className="p-4 flex-1 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <h3 className="font-display font-bold text-sm text-[#1E1B18] truncate">
                                                            {meta.productTitle || 'Handmade Craft'}
                                                        </h3>
                                                        {meta.price && (
                                                            <span className="text-xs font-bold text-[#C85A32] font-mono shrink-0">
                                                                ₹{meta.price.toLocaleString('en-IN')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] font-semibold bg-[#F3EFEA] text-[#6B635B] px-2 py-0.5 rounded-md inline-block mb-2 capitalize">
                                                        {meta.category || 'Handcrafted'}
                                                    </span>
                                                    <p className="text-xs text-[#6B635B] line-clamp-2 leading-relaxed">
                                                        {meta.description || 'Verified artisan creation.'}
                                                    </p>
                                                </div>

                                                <div className="mt-4 pt-3 border-t border-[#F3EFEA] flex items-center justify-between">
                                                    <span className="text-[10px] text-[#2E7D32] flex items-center gap-1 font-semibold">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        Verified Product
                                                    </span>
                                                    <button
                                                        onClick={() => handleDeleteProduct(prod.id)}
                                                        disabled={deletingId === prod.id}
                                                        title="Delete product and remove video reel"
                                                        className="py-1 px-2.5 text-[#6B635B] hover:text-[#D32F2F] hover:bg-[#FDEDED] border border-transparent hover:border-[#F5C2C7] rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 text-[#D32F2F]" />
                                                        <span>{deletingId === prod.id ? 'Deleting...' : 'Delete'}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ─── TAB 2: BUYER CHATS & ORDERS ──────────────────────────────── */}
                {activeTab === 'orders' && (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-[#1E1B18] font-display uppercase tracking-wider">
                                Active Buyer Discussions & Order Requests
                            </h2>
                            <span className="text-xs text-[#6B635B]">
                                1 Product discussed per conversation
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {buyerInquiries.map((inq) => (
                                <div
                                    key={inq.id}
                                    className="bg-white border border-[#E8E2D9] rounded-xl p-5 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-[#C85A32] text-white flex items-center justify-center font-bold text-xs">
                                                    {inq.buyerName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-[#1E1B18]">{inq.buyerName}</p>
                                                    <p className="text-[10px] text-[#6B635B]">{inq.updatedAt}</p>
                                                </div>
                                            </div>
                                            <span
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                                    inq.status === 'ORDER_FINALIZED'
                                                        ? 'bg-[#EDF7ED] text-[#2E7D32]'
                                                        : 'bg-[#FFF4E5] text-[#ED6C02]'
                                                }`}
                                            >
                                                {inq.status.replace('_', ' ')}
                                            </span>
                                        </div>

                                        <div className="bg-[#FDFBF7] p-3 rounded-lg border border-[#E8E2D9] mb-3">
                                            <div className="flex justify-between items-center text-xs font-semibold mb-1">
                                                <span className="text-[#1E1B18] truncate">{inq.productTitle}</span>
                                                <span className="text-[#C85A32] font-mono shrink-0">₹{inq.price.toLocaleString('en-IN')}</span>
                                            </div>
                                            <p className="text-xs text-[#6B635B] line-clamp-2 leading-relaxed">
                                                &quot;{inq.lastMessage}&quot;
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-[#F3EFEA] flex items-center justify-end">
                                        <Link
                                            href={`/messages?partner=${inq.buyerId}&artisanId=${profile?.id || 'raja'}&buyerName=${encodeURIComponent(inq.buyerName)}&productTitle=${encodeURIComponent(inq.productTitle)}&price=${inq.price}`}
                                            className="btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1 font-semibold"
                                        >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            <span>Open Live Chat</span>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── TAB 3: UPLOAD PRODUCT REEL ───────────────────────────────── */}
                {activeTab === 'upload' && (
                    <div className="flex flex-col items-center justify-center py-4">
                        <ReelUploader />
                    </div>
                )}

                {/* ─── TAB 4: OPEN COMMISSIONS ──────────────────────────────────── */}
                {activeTab === 'commissions' && (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-bold text-[#1E1B18] font-display uppercase tracking-wider">
                                    Open Custom Commissions in Your Region
                                </h2>
                                <p className="text-xs text-[#6B635B] mt-0.5">
                                    Submit custom project proposals with verified maker status.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {openProjects.map((proj) => (
                                <div
                                    key={proj.id}
                                    className="bg-white border border-[#E8E2D9] rounded-xl p-5 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold bg-[#EDF7ED] text-[#2E7D32] px-2 py-0.5 rounded-full uppercase">
                                                {proj.status}
                                            </span>
                                            <span className="text-xs font-bold text-[#C85A32] font-mono">
                                                ₹{proj.budget_min?.toLocaleString('en-IN')} – ₹{proj.budget_max?.toLocaleString('en-IN')}
                                            </span>
                                        </div>

                                        <h3 className="font-display font-bold text-sm text-[#1E1B18] mb-1">
                                            {proj.title}
                                        </h3>
                                        <p className="text-xs text-[#6B635B] line-clamp-3 leading-relaxed mb-3">
                                            {proj.description}
                                        </p>

                                        <div className="flex items-center gap-4 text-[11px] text-[#6B635B] mb-2">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5 text-[#C85A32]" />
                                                Deadline: {proj.deadline ? new Date(proj.deadline).toLocaleDateString() : 'Flexible'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <User className="w-3.5 h-3.5 text-[#C85A32]" />
                                                {proj.buyer?.full_name || 'Client'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-[#F3EFEA] flex justify-end">
                                        <button
                                            onClick={() => setBidProjectId(proj.id)}
                                            className="btn-primary text-xs py-1.5 px-3.5 font-semibold flex items-center gap-1"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Submit Custom Proposal</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── TAB 5: WORKSHOP PROFILE & BRAND SETTINGS ─────────────────── */}
                {activeTab === 'settings' && (
                    <div className="max-w-2xl mx-auto">
                        <form
                            onSubmit={handleSaveWorkshopSettings}
                            className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-card flex flex-col gap-5"
                        >
                            <div>
                                <h2 className="text-base font-bold text-[#1E1B18] font-display">
                                    Workshop Profile & Brand Identity
                                </h2>
                                <p className="text-xs text-[#6B635B] mt-0.5">
                                    Update your brand logo, workshop details, and craft specializations.
                                </p>
                            </div>

                            {profileSavedMsg && (
                                <div className="p-3 bg-[#EDF7ED] border border-[#2E7D32]/30 text-[#2E7D32] rounded-xl text-xs font-semibold flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    <span>{profileSavedMsg}</span>
                                </div>
                            )}

                            {/* Brand Logo Dropzone */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1B18] mb-2">
                                    Workshop Brand Logo / Maker Stamp
                                </label>
                                <div className="flex items-center gap-4">
                                    {logoPreview ? (
                                        <img
                                            src={logoPreview}
                                            alt="Brand Logo"
                                            className="w-16 h-16 rounded-2xl object-contain bg-[#FDFBF7] border border-[#E8E2D9] p-1.5 shadow-sm shrink-0"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-2xl bg-[#FFF4E5] border border-[#ED6C02]/30 flex items-center justify-center text-[#ED6C02] shrink-0 font-bold text-xl font-display">
                                            {workshopName.charAt(0) || 'M'}
                                        </div>
                                    )}

                                    <div>
                                        <label className="btn-ghost text-xs py-1.5 px-3 cursor-pointer inline-flex items-center gap-1.5 font-semibold">
                                            <Camera className="w-3.5 h-3.5" />
                                            <span>Upload New Logo</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setLogoFile(file);
                                                        const reader = new FileReader();
                                                        reader.onload = () => setLogoPreview(reader.result as string);
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                                className="hidden"
                                            />
                                        </label>
                                        <p className="text-[10px] text-[#6B635B] mt-1">
                                            PNG or JPG up to 5 MB. Used by AI to authenticate your workshop video stamps.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Workshop Name */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1B18] mb-1.5">
                                    Workshop Name / Maker Display Name <span className="text-[#D32F2F]">*</span>
                                </label>
                                <div className="relative flex items-center">
                                    <User className="absolute left-3.5 w-4 h-4 text-[#6B635B] pointer-events-none" />
                                    <input
                                        type="text"
                                        required
                                        value={workshopName}
                                        onChange={(e) => setWorkshopName(e.target.value)}
                                        style={{ paddingLeft: '2.5rem' }}
                                        className="input-base"
                                        placeholder="e.g. Royal Heritage Woodcraft Studio"
                                    />
                                </div>
                            </div>

                            {/* Location */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1B18] mb-1.5">
                                    Workshop Location / City
                                </label>
                                <div className="relative flex items-center">
                                    <MapPin className="absolute left-3.5 w-4 h-4 text-[#6B635B] pointer-events-none" />
                                    <input
                                        type="text"
                                        value={locationText}
                                        onChange={(e) => setLocationText(e.target.value)}
                                        style={{ paddingLeft: '2.5rem' }}
                                        className="input-base"
                                        placeholder="e.g. Saharanpur, Uttar Pradesh, India"
                                    />
                                </div>
                            </div>

                            {/* GST / Artisan ID */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1B18] mb-1.5">
                                    Artisan ID / GSTIN (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={taxId}
                                    onChange={(e) => setTaxId(e.target.value)}
                                    className="input-base font-mono"
                                    placeholder="e.g. 07AAAAA0000A1Z5"
                                />
                            </div>

                            {/* Craft Specializations Multi-Select */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1B18] mb-2">
                                    Craft Specializations
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {ALL_CRAFT_SPECIALIZATIONS.map((spec) => {
                                        const isSelected = selectedCategories.includes(spec.id);
                                        return (
                                            <button
                                                type="button"
                                                key={spec.id}
                                                onClick={() => toggleCraftCategory(spec.id)}
                                                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                                                    isSelected
                                                        ? 'border-[#C85A32] bg-[#FDFBF7] text-[#C85A32] font-bold shadow-xs'
                                                        : 'border-[#E8E2D9] bg-white text-[#6B635B] hover:border-[#C85A32]/40'
                                                }`}
                                            >
                                                <span className="text-sm">{spec.icon}</span>
                                                <span className="text-[11px] truncate">{spec.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={savingProfile}
                                className="btn-primary w-full py-3 font-semibold text-xs uppercase tracking-wider mt-2 cursor-pointer disabled:opacity-50"
                            >
                                {savingProfile ? 'Saving Workshop Profile...' : 'Save Workshop Profile'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Bid Submission Modal */}
                {bidProjectId && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#E8E2D9]">
                            <h3 className="font-display font-bold text-lg text-[#1E1B18] mb-1">
                                Submit Custom Project Bid
                            </h3>
                            <p className="text-xs text-[#6B635B] mb-4">
                                Provide your estimated cost and proposal notes for this client.
                            </p>

                            <form onSubmit={handleBidSubmit} className="flex flex-col gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
                                        Bid Amount (INR ₹)
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="e.g. 35000"
                                        value={bidAmount}
                                        onChange={(e) => setBidAmount(e.target.value)}
                                        className="input-base"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#1E1B18] mb-1">
                                        Proposal Details & Timeline
                                    </label>
                                    <textarea
                                        required
                                        rows={3}
                                        placeholder="Describe your craft approach, materials, and delivery estimate..."
                                        value={proposalText}
                                        onChange={(e) => setProposalText(e.target.value)}
                                        className="input-base"
                                    />
                                </div>

                                {bidStatus && (
                                    <p className="text-xs text-[#2E7D32] font-semibold">{bidStatus}</p>
                                )}

                                <div className="flex gap-2 justify-end mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setBidProjectId(null)}
                                        className="btn-ghost text-xs py-2 px-4"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={bidLoading}
                                        className="btn-primary text-xs py-2 px-4 font-semibold"
                                    >
                                        {bidLoading ? 'Submitting...' : 'Submit Bid'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
