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

interface CustomProject {
    id: string;
    buyer_id: string;
    title: string;
    description: string;
    budget_min: number;
    budget_max: number;
    deadline: string;
    status: string;
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

        if (data && data.length > 0) {
            setProjects(data as CustomProject[]);
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
            const res = await fetch('/api/buyer/projects/manage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, action: 'DELETE', userId: user?.id }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setProjects((prev) => prev.filter((p) => p.id !== projectId));
                setFeedbackMsg('Commission project deleted successfully.');
                setTimeout(() => setFeedbackMsg(null), 4000);
            } else {
                alert(data.error || 'Failed to delete project.');
            }
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
        <main className="min-h-screen bg-[#FDFBF7] py-10 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-card">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF4E5] text-[#ED6C02] text-xs font-bold mb-2">
                            <FolderOpen className="w-3.5 h-3.5" />
                            <span>Custom Project Commissions</span>
                        </div>
                        <h1 className="text-2xl font-bold text-[#1E1B18] font-display">
                            Custom Artisan Commissions
                        </h1>
                        <p className="text-xs text-[#6B635B] mt-1">
                            Post your custom bespoke requirements, receive bids from verified local artisans, or manage your active commissions.
                        </p>
                    </div>

                    <Link
                        href="/projects/new"
                        className="btn-primary text-xs py-2.5 px-4 font-semibold flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Post New Commission</span>
                    </Link>
                </div>

                {/* Feedback Notification */}
                {feedbackMsg && (
                    <div className="p-3 bg-[#EDF7ED] border border-[#2E7D32]/30 text-[#2E7D32] rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-sm">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{feedbackMsg}</span>
                    </div>
                )}

                {/* Filters & Search */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B635B]" />
                        <input
                            type="text"
                            placeholder="Search commissions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: '2.5rem' }}
                            className="input-base text-xs py-2"
                        />
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-xs font-semibold text-[#6B635B] flex items-center gap-1">
                            <Filter className="w-3.5 h-3.5" /> Status:
                        </span>
                        {['ALL', 'OPEN', 'COMPLETED'].map((st) => (
                            <button
                                key={st}
                                onClick={() => setStatusFilter(st)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer border transition-all ${
                                    statusFilter === st
                                        ? 'bg-[#1E1B18] text-white border-[#1E1B18]'
                                        : 'bg-white text-[#6B635B] border-[#E8E2D9] hover:border-[#1E1B18]'
                                }`}
                            >
                                {st}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Projects Grid */}
                {loading ? (
                    <div className="p-12 text-center text-xs text-[#6B635B]">Loading custom commissions...</div>
                ) : filteredProjects.length === 0 ? (
                    <div className="card p-12 bg-white text-center border border-[#E8E2D9] max-w-md mx-auto my-6 shadow-card">
                        <FolderOpen className="w-10 h-10 text-[#6B635B] mx-auto mb-2 opacity-50" />
                        <h3 className="font-display font-bold text-sm text-[#1E1B18] mb-1">No Commissions Found</h3>
                        <p className="text-xs text-[#6B635B] mb-4">Post a custom project requirement to start receiving bids from verified artisans.</p>
                        <Link href="/projects/new" className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5 font-semibold">
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create Commission</span>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredProjects.map((proj) => {
                            const isOwner = user && (user.id === proj.buyer_id || proj.buyer_id === 'sample-buyer');

                            return (
                                <div
                                    key={proj.id}
                                    className="bg-white border border-[#E8E2D9] rounded-xl p-5 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                                proj.status === 'COMPLETED'
                                                    ? 'bg-[#EDF7ED] text-[#2E7D32]'
                                                    : 'bg-[#FFF4E5] text-[#ED6C02]'
                                            }`}>
                                                {proj.status}
                                            </span>
                                            <span className="text-[10px] text-[#6B635B] font-mono">
                                                {new Date(proj.created_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <h3 className="font-display font-bold text-base text-[#1E1B18] mb-1.5 line-clamp-1">
                                            {proj.title}
                                        </h3>
                                        <p className="text-xs text-[#6B635B] line-clamp-3 leading-relaxed mb-4">
                                            {proj.description}
                                        </p>

                                        <div className="flex items-center justify-between pt-3 border-t border-[#F3EFEA] text-xs">
                                            <div className="flex items-center gap-1 text-[#C85A32] font-mono font-bold">
                                                <DollarSign className="w-3.5 h-3.5" />
                                                <span>₹{proj.budget_min?.toLocaleString('en-IN')} – ₹{proj.budget_max?.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[#6B635B]">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{proj.deadline ? new Date(proj.deadline).toLocaleDateString() : 'Flexible'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-4 pt-3 border-t border-[#F3EFEA] flex items-center justify-between gap-2">
                                        <Link
                                            href={`/projects/${proj.id}`}
                                            className="text-xs text-[#C85A32] font-semibold hover:underline flex items-center gap-1"
                                        >
                                            <span>View Details & Bids</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>

                                        {isOwner && (
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => handleToggleComplete(proj.id, proj.status)}
                                                    title={proj.status === 'COMPLETED' ? 'Reopen Commission' : 'Mark as Completed'}
                                                    className="py-1 px-2.5 bg-[#FDFBF7] hover:bg-[#EDF7ED] text-[#2E7D32] border border-[#E8E2D9] rounded-lg transition-all text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                                                >
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    <span>{proj.status === 'COMPLETED' ? 'Reopen' : 'Complete'}</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProject(proj.id)}
                                                    disabled={deletingId === proj.id}
                                                    title="Delete this commission"
                                                    className="py-1 px-2 text-[#6B635B] hover:text-[#D32F2F] hover:bg-[#FDEDED] border border-[#E8E2D9] hover:border-[#F5C2C7] rounded-lg transition-all text-[11px] font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                                >
                                                    <Trash2 className="w-3 h-3 text-[#D32F2F]" />
                                                    <span>{deletingId === proj.id ? '...' : 'Delete'}</span>
                                                </button>
                                            </div>
                                        )}
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
