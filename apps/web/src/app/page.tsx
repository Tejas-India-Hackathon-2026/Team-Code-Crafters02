import Link from 'next/link';
import { ShieldCheck, Video, MessageSquare, Package, ArrowRight, Sparkles, Search, CheckCircle2, Play, Award, Lock, Zap } from 'lucide-react';
import { AnimatedNumber } from '../components/ui/animated-number';

const FEATURED_CATEGORIES = [
    { id: 'pottery', label: 'Pottery & Ceramics', icon: '🏺', reelsCount: '18 Reels', desc: 'Wheel-thrown clay urlis & terracotta decor' },
    { id: 'woodworking', label: 'Woodworking & Carving', icon: '🪵', reelsCount: '24 Reels', desc: 'Hand-chiseled Sheesham & Teak furniture' },
    { id: 'handloom', label: 'Handloom & Textiles', icon: '🧵', reelsCount: '32 Reels', desc: 'Varanasi silk & Chanderi pit-loom weaves' },
    { id: 'metalcraft', label: 'Metalcraft & Brassware', icon: '🪚', reelsCount: '15 Reels', desc: 'Moradabad beaten brass & bell metal art' },
    { id: 'jewelry', label: 'Handmade Jewelry', icon: '💍', reelsCount: '29 Reels', desc: 'Kundan Meenakari & Jaipur gemstone silver' },
    { id: 'painting', label: 'Folk Art & Painting', icon: '🎨', reelsCount: '12 Reels', desc: 'Madhubani, Pattachitra & Pichwai canvases' },
];

export default function HomePage(): React.ReactNode {
    return (
        <main className="min-h-screen bg-[#FAF7F2]" aria-label="Main marketplace landing content">
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#EDF7ED] border border-[#2E7D32]/20 text-[#2C4A3E] rounded-full text-xs font-semibold mb-6 shadow-xs">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D32]" />
                            AI-Verified Artisan Marketplace
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1E1B18] font-display leading-tight tracking-tight">
                            Handmade,{' '}
                            <span className="text-[#C85A32]">Heart-made.</span>
                            <br />
                            Verified & Trusted.
                        </h1>

                        <p className="mt-5 text-base sm:text-lg text-[#6B635B] max-w-xl leading-relaxed font-normal">
                            Commission bespoke handcrafted goods from verified Indian artisans.
                            Every piece is verified with 9:16 process video reels matching registered maker logos.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link
                                href="/projects/new"
                                className="btn-primary text-sm py-3 px-6 shadow-elevated"
                            >
                                Post a Commission
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href="/verification/feed"
                                className="btn-secondary text-sm py-3 px-6 flex items-center gap-2 bg-white hover:bg-[#FAF7F2] border border-[#E8E2D9]"
                            >
                                <Play className="w-4 h-4 text-[#E08E45]" />
                                Explore Category Reels
                            </Link>
                        </div>

                        {/* Live Animated Precision & Trust Stats */}
                        <div className="mt-12 pt-8 border-t border-[#E8E2D9]/70 grid grid-cols-3 gap-4 max-w-xl">
                            <div>
                                <div className="text-xl sm:text-2xl font-bold font-display text-[#1E1B18] flex items-center gap-0.5">
                                    <AnimatedNumber value={98} suffix="%" />
                                </div>
                                <p className="text-[11px] font-medium text-[#6B635B] mt-0.5 flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-[#2E7D32]" />
                                    AI Precision Rate
                                </p>
                            </div>
                            <div>
                                <div className="text-xl sm:text-2xl font-bold font-display text-[#1E1B18] flex items-center gap-0.5">
                                    <AnimatedNumber value={100} suffix="%" />
                                </div>
                                <p className="text-[11px] font-medium text-[#6B635B] mt-0.5 flex items-center gap-1">
                                    <Lock className="w-3 h-3 text-[#C85A32]" />
                                    Escrow Protection
                                </p>
                            </div>
                            <div>
                                <div className="text-xl sm:text-2xl font-bold font-display text-[#1E1B18] flex items-center gap-0.5">
                                    <AnimatedNumber value={48} suffix="h" />
                                </div>
                                <p className="text-[11px] font-medium text-[#6B635B] mt-0.5 flex items-center gap-1">
                                    <Award className="w-3 h-3 text-[#E08E45]" />
                                    Inspection Buffer
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative gradient orbs */}
                <div className="absolute top-20 right-0 w-96 h-96 bg-[#C85A32]/8 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-40 w-72 h-72 bg-[#E08E45]/10 rounded-full blur-3xl pointer-events-none" />
            </section>

            {/* Category Discovery Section for Buyers */}
            <section className="border-t border-[#E8E2D9] bg-white py-16 sm:py-20" aria-label="Handcrafted categories showcase">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                        <div>
                            <span className="text-xs font-bold text-[#C85A32] uppercase tracking-widest block mb-2 font-mono">
                                Explore By Craft Category
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-bold text-[#1E1B18] font-display">
                                Verified Video Reels by Category
                            </h2>
                            <p className="text-xs sm:text-sm text-[#6B635B] mt-1">
                                Watch real workshop process videos matching maker brand logos
                            </p>
                        </div>

                        <Link
                            href="/verification/feed"
                            className="text-xs font-bold text-[#C85A32] hover:underline flex items-center gap-1 shrink-0"
                        >
                            <span>View All Category Feeds</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {FEATURED_CATEGORIES.map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/verification/feed`}
                                className="card p-5 bg-[#FDFBF7] hover:bg-white hover:border-[#C85A32]/50 transition-all hover:shadow-elevated group flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-2xl">{cat.icon}</span>
                                        <span className="text-[10px] font-semibold bg-[#EDF7ED] text-[#2C4A3E] px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3" />
                                            {cat.reelsCount}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-bold text-[#1E1B18] font-display group-hover:text-[#C85A32] transition-colors">
                                        {cat.label}
                                    </h3>
                                    <p className="text-xs text-[#6B635B] mt-1 leading-relaxed">
                                        {cat.desc}
                                    </p>
                                </div>

                                <div className="mt-4 pt-3 border-t border-[#E8E2D9] flex items-center justify-between text-xs font-semibold text-[#C85A32]">
                                    <span className="flex items-center gap-1">
                                        <Play className="w-3 h-3" /> Watch Reels
                                    </span>
                                    <span>→</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="border-t border-[#E8E2D9] bg-[#FDFBF7] py-16 sm:py-20" aria-label="How Karigar Kart marketplace works">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C85A32] uppercase tracking-widest mb-3">
                            <Sparkles className="w-3.5 h-3.5" />
                            How It Works
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-[#1E1B18] font-display">
                            From Commission to Doorstep
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                icon: Video,
                                step: '01',
                                title: 'AI Verification',
                                desc: 'Artisans upload workshop reels. Gemini Vision matches physical stamps against registered brand logos.',
                                color: 'text-[#C85A32]',
                                bg: 'bg-[#C85A32]/8',
                            },
                            {
                                icon: MessageSquare,
                                step: '02',
                                title: 'Secure Chat & Quote',
                                desc: 'Ingress-sanitized messaging with in-chat milestone quotes and TDS-compliant pricing.',
                                color: 'text-[#2C4A3E]',
                                bg: 'bg-[#2C4A3E]/8',
                            },
                            {
                                icon: Package,
                                step: '03',
                                title: 'Escrow Protection',
                                desc: 'Funds locked in dual-rail escrow. 48-hour dispute buffer after carrier-confirmed delivery.',
                                color: 'text-[#E08E45]',
                                bg: 'bg-[#E08E45]/10',
                            },
                            {
                                icon: ShieldCheck,
                                step: '04',
                                title: 'Admin Triage',
                                desc: 'HITL review queue for edge cases. Human oversight ensures fair resolution of disputes.',
                                color: 'text-[#2E7D32]',
                                bg: 'bg-[#2E7D32]/8',
                            },
                        ].map((item) => (
                            <div
                                key={item.step}
                                className="relative p-6 bg-white border border-[#E8E2D9] rounded-xl group hover:border-[#C85A32]/30 transition-all hover:shadow-card"
                            >
                                <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center mb-4`}>
                                    <item.icon className={`w-5 h-5 ${item.color}`} />
                                </div>
                                <span className="text-[10px] font-mono text-[#6B635B] uppercase tracking-widest">
                                    Step {item.step}
                                </span>
                                <h3 className="text-sm font-bold text-[#1E1B18] mt-1 mb-2 font-display">
                                    {item.title}
                                </h3>
                                <p className="text-xs text-[#6B635B] leading-relaxed">
                                    {item.desc}
                                </p>
                            </div>
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
