'use client';

import Link from 'next/link';
import {
    ShieldCheck,
    Video,
    MessageSquare,
    Package,
    ArrowRight,
    Sparkles,
    Play,
    Award,
    Lock,
    Star,
    CheckCircle2,
    ChevronRight,
} from 'lucide-react';
import { AnimatedNumber } from '../components/ui/animated-number';
import { KintoCard, KintoBadge } from '../components/ui/kinto-card';

const FEATURED_CATEGORIES = [
    { id: 'pottery', label: 'Pottery & Ceramics', index: '01', icon: '🏺', reelsCount: '18 Reels', desc: 'Wheel-thrown clay urlis & terracotta studio decor' },
    { id: 'woodworking', label: 'Woodworking & Carving', index: '02', icon: '🪵', reelsCount: '24 Reels', desc: 'Hand-chiseled Sheesham & Teak furniture with brass inlay' },
    { id: 'handloom', label: 'Handloom & Textiles', index: '03', icon: '🧵', reelsCount: '32 Reels', desc: 'Varanasi pure silk & Chanderi pit-loom weaves' },
    { id: 'metalcraft', label: 'Metalcraft & Brassware', index: '04', icon: '🪚', reelsCount: '15 Reels', desc: 'Moradabad beaten brass & temple bell metal art' },
    { id: 'jewelry', label: 'Handmade Jewelry', index: '05', icon: '💍', reelsCount: '29 Reels', desc: 'Kundan Meenakari & Jaipur gemstone silver' },
    { id: 'painting', label: 'Folk Art & Painting', index: '06', icon: '🎨', reelsCount: '12 Reels', desc: 'Madhubani, Pattachitra & Pichwai canvases' },
];

export default function HomePage(): React.ReactNode {
    return (
        <main className="min-h-screen bg-[#FAF7F2] text-stone-900 overflow-hidden" aria-label="Main marketplace landing content">
            {/* ─── HERO SECTION ─────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
                {/* Dot Matrix Atmosphere with Radial Mask */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-[0.15] kinto-dot-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)]"
                />

                {/* Subtle Ambient Radial Orbs */}
                <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-[#C85A32]/10 via-[#E08E45]/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    {/* Centered Top Badge & Title */}
                    <div className="text-center max-w-3xl mx-auto mb-8">
                        <div className="inline-flex mb-4">
                            <KintoBadge variant="brand" dot={true}>
                                AI-VERIFIED ARTISAN MARKETPLACE
                            </KintoBadge>
                        </div>

                        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-stone-950 font-display leading-[1.08] tracking-tight">
                            Handmade,{' '}
                            <em className="animate-text-shimmer not-italic font-serif">Heart-made.</em>
                            <br />
                            Verified & Trusted.
                        </h1>

                        {/* Kinto Editorial Divider Line */}
                        <div className="h-px bg-gradient-to-r from-transparent via-stone-300 to-transparent my-6 max-w-lg mx-auto" />
                    </div>

                    {/* Two-Column Editorial Hero Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                        {/* Left Column: Mission, CTAs, Trust Tags */}
                        <div className="lg:col-span-7 flex flex-col justify-center">
                            <p className="text-base sm:text-lg text-stone-600 leading-relaxed font-normal max-w-xl mb-8">
                                Commission bespoke handcrafted goods directly from master Indian artisans.
                                Every creation is verified via 9:16 process video reels matched to registered workshop maker stamps, protected by dual-rail escrow.
                            </p>

                            <div className="flex flex-wrap items-center gap-3.5 mb-10">
                                <Link
                                    href="/projects/new"
                                    className="btn-primary text-sm py-3 px-6 rounded-full font-semibold shadow-sm hover:shadow-md flex items-center gap-2"
                                >
                                    <span>Post a Commission</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                                <Link
                                    href="/verification/feed"
                                    className="btn-ghost text-sm py-3 px-5 rounded-full font-medium bg-white/80 border border-stone-200/90 text-stone-800 hover:bg-stone-100 flex items-center gap-2 shadow-2xs"
                                >
                                    <Play className="w-3.5 h-3.5 text-[#C85A32] fill-[#C85A32]" />
                                    <span>Explore Video Reels</span>
                                    <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                                </Link>
                            </div>

                            {/* Kinto Monospaced Micro Feature Tags */}
                            <div className="flex flex-wrap gap-x-5 gap-y-2.5 font-mono text-xs text-stone-600">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" />
                                    Gemini AI Certified
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#C85A32]" />
                                    Dual-Rail Escrow
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#ED6C02]" />
                                    48h Dispute Buffer
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-stone-500" />
                                    Section 194-O TDS
                                </span>
                            </div>
                        </div>

                        {/* Right Column: Kinto Hero Interactive Showcase Card */}
                        <div className="lg:col-span-5 relative">
                            <div className="relative group/showcase">
                                {/* Ambient Glow under card */}
                                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#C85A32]/20 via-[#E08E45]/15 to-[#2E7D32]/20 blur-xl opacity-70 group-hover/showcase:opacity-100 transition-opacity" />

                                <div className="relative bg-white/95 backdrop-blur-xl border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-xl transition-transform duration-300 group-hover/showcase:-translate-y-1">
                                    {/* Card Header */}
                                    <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-stone-100">
                                        <div className="flex items-center gap-1.5">
                                            <Star className="w-3.5 h-3.5 text-[#C85A32] fill-[#C85A32]" />
                                            <span className="font-mono text-[11px] font-bold text-[#C85A32] tracking-wider uppercase">
                                                AI Vision Stamp Certified
                                            </span>
                                        </div>
                                        <span className="font-mono text-[10px] text-stone-400">
                                            Just Now
                                        </span>
                                    </div>

                                    {/* Card Quote / Highlight */}
                                    <div className="mb-4">
                                        <blockquote className="border-l-2 border-[#C85A32] pl-3 italic font-serif text-stone-800 text-sm leading-snug mb-2">
                                            &ldquo;Hand-chiseled seasoned Sheesham table with brass inlay work and natural honey wax polish.&rdquo;
                                        </blockquote>
                                        <p className="text-xs text-stone-500 leading-relaxed">
                                            Gemini 2.5 Flash matched the physical workshop stamp on video frame #142 with 98.4% brand confidence.
                                        </p>
                                    </div>

                                    {/* Verification Milestone Visualizer */}
                                    <div className="bg-stone-50/90 rounded-xl p-3 border border-stone-200/70 mb-4 flex flex-col gap-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-medium text-stone-700">Maker: Raja Ram (Moradabad)</span>
                                            <span className="font-mono font-bold text-[#2E7D32]">₹14,800 Locked</span>
                                        </div>
                                        <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-[#2E7D32] h-full w-[98.4%]" />
                                        </div>
                                    </div>

                                    {/* Card Footer Badges */}
                                    <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                                        <div className="flex gap-1.5">
                                            <KintoBadge variant="success" dot={false}>
                                                98.4% MATCH
                                            </KintoBadge>
                                            <KintoBadge variant="brand" dot={false}>
                                                ESCROW HELD
                                            </KintoBadge>
                                        </div>
                                        <span className="font-mono text-[10px] text-stone-400">
                                            Batch #KG-2026
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Live Metric Count-up Tiles */}
                    <div className="mt-16 pt-8 border-t border-stone-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
                        <KintoCard hoverEffect={false} className="p-4 bg-white/70">
                            <div className="text-2xl font-bold font-display text-stone-900 flex items-center gap-0.5">
                                <AnimatedNumber value={98} suffix="%" />
                            </div>
                            <p className="text-xs font-mono text-stone-500 mt-1 flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D32]" />
                                Gemini AI Precision
                            </p>
                        </KintoCard>
                        <KintoCard hoverEffect={false} className="p-4 bg-white/70">
                            <div className="text-2xl font-bold font-display text-stone-900 flex items-center gap-0.5">
                                <AnimatedNumber value={100} suffix="%" />
                            </div>
                            <p className="text-xs font-mono text-stone-500 mt-1 flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-[#C85A32]" />
                                Escrow Protection
                            </p>
                        </KintoCard>
                        <KintoCard hoverEffect={false} className="p-4 bg-white/70">
                            <div className="text-2xl font-bold font-display text-stone-900 flex items-center gap-0.5">
                                <AnimatedNumber value={48} suffix="h" />
                            </div>
                            <p className="text-xs font-mono text-stone-500 mt-1 flex items-center gap-1.5">
                                <Award className="w-3.5 h-3.5 text-[#ED6C02]" />
                                Post-Delivery Buffer
                            </p>
                        </KintoCard>
                    </div>
                </div>
            </section>

            {/* ─── CATEGORY DISCOVERY SECTION ───────────────────────────────────── */}
            <section className="border-t border-stone-200/80 bg-white/60 py-16 sm:py-24" aria-label="Handcrafted categories showcase">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                        <div>
                            <span className="text-xs font-bold text-[#C85A32] uppercase tracking-widest block mb-2 font-mono">
                                Curated Indian Guilds
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-display tracking-tight">
                                Handcrafted Categories
                            </h2>
                            <p className="text-sm text-stone-500 mt-1">
                                Discover authentic video reels and custom craft commissions across verified regional guilds.
                            </p>
                        </div>

                        <Link
                            href="/verification/feed"
                            className="text-xs font-semibold text-[#C85A32] hover:text-[#B04B26] flex items-center gap-1 font-mono shrink-0 group"
                        >
                            <span>EXPLORE ALL FEEDS</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {FEATURED_CATEGORIES.map((cat) => (
                            <Link
                                key={cat.id}
                                href="/verification/feed"
                                className="group block"
                            >
                                <KintoCard glow className="h-full flex flex-col justify-between p-6">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-2xl">{cat.icon}</span>
                                            <span className="font-mono text-xs font-bold text-[#C85A32]">
                                                {cat.index}
                                            </span>
                                        </div>
                                        <h3 className="text-base font-bold text-stone-900 font-display group-hover:text-[#C85A32] transition-colors mb-1.5">
                                            {cat.label}
                                        </h3>
                                        <p className="text-xs text-stone-600 leading-relaxed mb-4">
                                            {cat.desc}
                                        </p>
                                    </div>

                                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-mono font-medium text-stone-500 group-hover:text-[#C85A32] transition-colors">
                                        <span>{cat.reelsCount}</span>
                                        <span className="flex items-center gap-1">
                                            Watch <ArrowRight className="w-3 h-3" />
                                        </span>
                                    </div>
                                </KintoCard>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── HOW IT WORKS SECTION ─────────────────────────────────────────── */}
            <section className="border-t border-stone-200/80 bg-[#FAF7F2] py-16 sm:py-24" aria-label="How Karigar Kart marketplace works">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16 max-w-2xl mx-auto">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C85A32] uppercase tracking-widest font-mono mb-2">
                            <Sparkles className="w-3.5 h-3.5" />
                            VERIFICATION PIPELINE
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-display tracking-tight">
                            From Workshop to Doorstep
                        </h2>
                        <p className="text-sm text-stone-500 mt-2">
                            How we guarantee authenticity, safe payouts, and complete peace of mind.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {[
                            {
                                step: '01',
                                icon: Video,
                                title: 'AI Verification',
                                desc: 'Artisans upload 9:16 process reels. Gemini Vision inspects frames matching registered maker stamps.',
                            },
                            {
                                step: '02',
                                icon: MessageSquare,
                                title: 'Direct Messaging',
                                desc: 'Ingress-sanitized chat with live in-chat TDS-compliant milestone quotes and proposals.',
                            },
                            {
                                step: '03',
                                icon: Lock,
                                title: 'Dual-Rail Escrow',
                                desc: 'Funds secured in bank nodal buffer until carrier confirms delivery with a 48h inspection window.',
                            },
                            {
                                step: '04',
                                icon: ShieldCheck,
                                title: 'Tax & Compliance',
                                desc: 'Section 194-O statutory TDS calculations automated for transparent artisan disbursements.',
                            },
                        ].map((item) => (
                            <KintoCard key={item.step} className="p-5 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-9 h-9 rounded-xl bg-stone-100 text-[#C85A32] flex items-center justify-center">
                                            <item.icon className="w-4 h-4" />
                                        </div>
                                        <span className="font-mono text-xs font-bold text-stone-400">
                                            {item.step}
                                        </span>
                                    </div>
                                    <h3 className="font-display font-bold text-sm text-stone-900 mb-1.5">
                                        {item.title}
                                    </h3>
                                    <p className="text-xs text-stone-600 leading-relaxed">
                                        {item.desc}
                                    </p>
                                </div>
                            </KintoCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="border-t border-[#E8E2D9]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
                    <div className="bg-[#1E1B18] rounded-2xl p-8 sm:p-12 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#C85A32]/20 to-transparent pointer-events-none" />
                        <div className="relative z-10">
                            <h2 className="text-2xl sm:text-3xl font-bold text-white font-display mb-3">
                                Ready to Commission Something Beautiful?
                            </h2>
                            <p className="text-sm text-white/60 max-w-md mx-auto mb-6">
                                Join thousands of buyers and artisans on India&apos;s first AI-verified handmade marketplace.
                            </p>
                            <div className="flex flex-wrap justify-center gap-3">
                                <Link
                                    href="/login"
                                    className="btn-primary text-sm py-3 px-6 shadow-elevated"
                                >
                                    Get Started
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                                <Link
                                    href="/verification/onboarding"
                                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all backdrop-blur-sm border border-white/10"
                                >
                                    Apply as Artisan
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-[#E8E2D9] bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-[#C85A32] flex items-center justify-center">
                            <span className="text-white font-bold text-xs font-display">K</span>
                        </div>
                        <span className="text-xs font-medium text-[#6B635B]">
                            Karigar Kart &copy; {new Date().getFullYear()}
                        </span>
                    </div>
                    <div className="flex gap-6 text-xs text-[#6B635B]">
                        <span>AI-Powered Verification</span>
                        <span>Sec 194-O TDS Compliant</span>
                        <span>Dual-Rail Escrow</span>
                    </div>
                </div>
            </footer>
        </main>
    );
}
