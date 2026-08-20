'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../../lib/supabaseClient';
import {
    FolderOpen,
    Plus,
    Calendar,
    DollarSign,
    MapPin,
    Trash2,
    CheckCircle2,
    Clock,
    ArrowRight,
    Search,
    Filter,
} from 'lucide-react';
import Link from 'next/link';
import { KintoCard, KintoBadge } from '../../../components/ui/kinto-card';

interface CustomProject {
    id: string;
    buyer_id: string;
    title: string;
    description: string;
    budget_min: number;
    budget_max: number;
    deadline: string;
    status: string;
    image_url?: string | null;
    created_at: string;
}

export default function ProjectsDirectoryPage() {
    const supabase = createClient();

    const [user, setUser] = useState<any>(null);
    const [projects, setProjects] = useState<CustomProject[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        setLoading(true);
        const { data: authData } = await supabase.auth.getUser();
        setUser(authData?.user || null);

        const { data, error } = await supabase
            .from('custom_projects')
            .select('*')
            .order('created_at', { ascending: false });

        let loaded: CustomProject[] = [];

        if (data && data.length > 0) {
            loaded = data as CustomProject[];
        }

        // Merge locally cached projects
        if (typeof window !== 'undefined') {
            try {
                const cached = JSON.parse(localStorage.getItem('karigar_custom_projects_cache') || '[]');
                if (Array.isArray(cached) && cached.length > 0) {
                    const dbIds = new Set(loaded.map((p) => p.id));
                    const freshCached = cached.filter((c: any) => !dbIds.has(c.id));
                    loaded = [...freshCached, ...loaded];
                }
            } catch (e) {}
        }

        if (loaded.length > 0) {
            setProjects(loaded);
        } else {
            // Seed default projects for presentation if table is empty
            setProjects([
                {
                    id: 'sample-proj-1',
                    buyer_id: authData?.user?.id || 'sample-buyer',
                    title: 'Hand-Carved Sheesham Dining Table (6 Seater)',
                    description: 'Looking for a master carpenter to craft a rustic 6-seater dining table with brass inlays and natural wax finish.',
                    budget_min: 25000,
                    budget_max: 45000,
                    deadline: '2026-09-30',
                    status: 'OPEN',
                    created_at: new Date().toISOString(),
                },
                {
                    id: 'sample-proj-2',
                    buyer_id: 'buyer-2',
                    title: 'Pure Mulberry Silk Handloom Saree with Zari Border',
                    description: 'Custom wedding saree requiring authentic pit-loom weaving with floral paisley motifs.',
                    budget_min: 18000,
                    budget_max: 30000,
                    deadline: '2026-10-15',
                    status: 'OPEN',
                    created_at: new Date().toISOString(),
                },
            ]);
        }
        setLoading(false);
    };

    const handleDeleteProject = async (projectId: string) => {
        if (!window.confirm('Are you sure you want to delete this custom commission project?')) return;

        try {
            setDeletingId(projectId);

            // Clean from local storage cache
            if (typeof window !== 'undefined') {
                try {
                    const cached = JSON.parse(localStorage.getItem('karigar_custom_projects_cache') || '[]');
                    if (Array.isArray(cached)) {
                        localStorage.setItem(
                            'karigar_custom_projects_cache',
                            JSON.stringify(cached.filter((p: any) => p.id !== projectId))
                        );
                    }
                } catch (e) {}
            }

            try {
                await fetch('/api/buyer/projects/manage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ projectId, action: 'DELETE', userId: user?.id }),
                });
            } catch (e) {}

            setProjects((prev) => prev.filter((p) => p.id !== projectId));
            setFeedbackMsg('Commission project deleted successfully.');
            setTimeout(() => setFeedbackMsg(null), 4000);
        } catch (err: any) {
            alert('Error deleting project: ' + err.message);
        } finally {
            setDeletingId(null);
        }
    };

    const handleToggleComplete = async (projectId: string, currentStatus: string) => {
        const action = currentStatus === 'COMPLETED' ? 'REOPEN' : 'MARK_COMPLETED';
        try {
            const res = await fetch('/api/buyer/projects/manage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, action, userId: user?.id }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setProjects((prev) =>
                    prev.map((p) =>
                        p.id === projectId
                            ? { ...p, status: action === 'MARK_COMPLETED' ? 'COMPLETED' : 'OPEN' }
                            : p
                    )
                );
                setFeedbackMsg(action === 'MARK_COMPLETED' ? '✓ Commission marked as completed!' : '✓ Commission reopened!');
                setTimeout(() => setFeedbackMsg(null), 4000);
            } else {
                alert(data.error || 'Action failed.');
            }
        } catch (err: any) {
            alert('Error: ' + err.message);
        }
    };

    const filteredProjects = projects.filter((p) => {
        const matchSearch =
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
        return matchSearch && matchStatus;
    });

    return (
        <main className="min-h-screen bg-[#FAF7F2] text-stone-900 py-12 px-4 sm:px-6 relative overflow-hidden">
            {/* Dot Matrix Atmosphere */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.14] kinto-dot-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,#000_70%,transparent_100%)]"
            />

            <div className="max-w-5xl mx-auto flex flex-col gap-8 relative">
                {/* Header */}
                <KintoCard glow className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <KintoBadge variant="brand" dot={true}>
                                BESPOKE CRAFT COMMISSIONS
                            </KintoBadge>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-950 font-display tracking-tight">
                            Custom Artisan Commissions
                        </h1>
                        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-xl">
                            Post bespoke project briefs with reference sketches. Verified local artisans submit transparent bids protected by dual-rail escrow.
                        </p>
                    </div>

                    <Link
                        href="/projects/new"
                        className="btn-primary text-xs py-3 px-5 rounded-full font-semibold flex items-center gap-1.5 shrink-0 self-start sm:self-auto shadow-xs hover:shadow-md transition-all font-mono"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Post New Commission</span>
                    </Link>
                </KintoCard>

                {/* Feedback Notification */}
                {feedbackMsg && (
                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-600/30 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-xs font-mono">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>{feedbackMsg}</span>
                    </div>
                )}

                {/* Filters & Search */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input
                            type="text"
                            placeholder="Search commissions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: '2.5rem' }}
                            className="input-base text-xs py-2.5 bg-white/90 border-stone-200/90 rounded-full font-mono"
                        />
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-xs font-semibold text-stone-500 flex items-center gap-1 font-mono">
                            <Filter className="w-3.5 h-3.5 text-[#C85A32]" /> Status:
                        </span>
                        {['ALL', 'OPEN', 'COMPLETED'].map((st) => (
                            <button
                                key={st}
                                onClick={() => setStatusFilter(st)}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-all font-mono ${
                                    statusFilter === st
                                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                                        : 'bg-white/80 text-stone-600 border-stone-200 hover:border-stone-400'
                                }`}
                            >
                                {st}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Projects Grid */}
                {loading ? (
                    <div className="p-16 text-center text-xs text-stone-500 font-mono">Loading custom commissions...</div>
                ) : filteredProjects.length === 0 ? (
                    <KintoCard glow className="p-12 text-center max-w-md mx-auto my-6">
                        <FolderOpen className="w-10 h-10 text-stone-400 mx-auto mb-3 opacity-60" />
                        <h3 className="font-display font-bold text-base text-stone-950 mb-1">No Commissions Found</h3>
                        <p className="text-xs text-stone-500 mb-5">Post a custom project requirement to start receiving bids from verified artisans.</p>
                        <Link href="/projects/new" className="btn-primary text-xs py-2.5 px-5 rounded-full inline-flex items-center gap-1.5 font-semibold font-mono">
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create Commission</span>
                        </Link>
                    </KintoCard>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {filteredProjects.map((proj) => {
                            const isOwner = user && (user.id === proj.buyer_id || proj.buyer_id === 'sample-buyer');
                            const refImgMatch = proj.description?.match(/\[REFERENCE_IMAGE:\s*(.*?)\]/);
                            const projImageUrl = proj.image_url || (refImgMatch ? refImgMatch[1] : null);
                            const cleanDescription = proj.description?.replace(/\[REFERENCE_IMAGE:\s*(.*?)\]/, '').trim();

                            return (
                                <KintoCard
                                    key={proj.id}
                                    glow={true}
                                    className="p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-900/5"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <KintoBadge
                                                variant={proj.status === 'COMPLETED' ? 'success' : 'warning'}
                                                dot={true}
                                            >
                                                {proj.status}
                                            </KintoBadge>
                                            <span className="text-[10px] text-stone-400 font-mono">
                                                {new Date(proj.created_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {/* Reference Sketch / Photo */}
                                        {projImageUrl && (
                                            <div className="mb-3.5 rounded-2xl overflow-hidden border border-stone-200/80 bg-stone-50 relative group">
                                                <img
                                                    src={projImageUrl}
                                                    alt={`Reference sketch for ${proj.title}`}
                                                    className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                                                    onClick={() => window.open(projImageUrl, '_blank')}
                                                />
                                                <div className="bg-stone-900/80 backdrop-blur-xs text-white px-3 py-1.5 text-[10px] flex items-center justify-between absolute bottom-0 left-0 right-0 font-mono">
                                                    <span className="font-medium">📷 Reference Sketch</span>
                                                    <span className="text-[#F7EAD9] underline cursor-pointer">Click to enlarge</span>
                                                </div>
                                            </div>
                                        )}

                                        <h3 className="font-display font-bold text-base text-stone-950 mb-1.5 line-clamp-1">
                                            {proj.title}
                                        </h3>
                                        <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed mb-4">
                                            {cleanDescription}
                                        </p>

                                        <div className="flex items-center justify-between pt-3.5 border-t border-stone-100 text-xs">
                                            <div className="flex items-center gap-1 text-[#C85A32] font-mono font-bold">
                                                <DollarSign className="w-3.5 h-3.5" />
                                                <span>₹{proj.budget_min?.toLocaleString('en-IN')} – ₹{proj.budget_max?.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-stone-500 font-mono text-[11px]">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{proj.deadline ? new Date(proj.deadline).toLocaleDateString() : 'Flexible'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-4 pt-3.5 border-t border-stone-100 flex items-center justify-between gap-2">
                                        <Link
                                            href={`/projects/${proj.id}`}
                                            className="text-xs text-[#C85A32] font-semibold hover:text-[#B04B26] flex items-center gap-1 font-mono group"
                                        >
                                            <span>View Details & Bids</span>
                                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                        </Link>

                                        {isOwner && (
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => handleToggleComplete(proj.id, proj.status)}
                                                    title={proj.status === 'COMPLETED' ? 'Reopen Commission' : 'Mark as Completed'}
                                                    className="py-1 px-3 bg-white hover:bg-emerald-50 text-emerald-700 border border-stone-200 rounded-full transition-all text-[11px] font-semibold flex items-center gap-1 cursor-pointer font-mono"
                                                >
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    <span>{proj.status === 'COMPLETED' ? 'Reopen' : 'Complete'}</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProject(proj.id)}
                                                    disabled={deletingId === proj.id}
                                                    title="Delete this commission"
                                                    className="py-1 px-2.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 border border-stone-200 rounded-full transition-all text-[11px] font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50 font-mono"
                                                >
                                                    <Trash2 className="w-3 h-3 text-rose-500" />
                                                    <span>{deletingId === proj.id ? '...' : 'Delete'}</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </KintoCard>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
