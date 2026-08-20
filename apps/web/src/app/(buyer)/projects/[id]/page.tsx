import { createServerSideClient } from '../../../../lib/supabaseServer';
import BiddingDrawer from '../../../../components/projects/BiddingDrawer';
import ProjectProposalsList from '../../../../components/projects/ProjectProposalsList';
import NearbyMakersMap from '../../../../components/map/NearbyMakersMap';
import ProjectOwnerActions from '../../../../components/projects/ProjectOwnerActions';
import { Calendar, DollarSign, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ProjectPageProps {
    params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
    const { id } = await params;
    const supabase = await createServerSideClient();

    // Fetch project details
    const { data: project } = await supabase
        .from('custom_projects')
        .select('*, buyer:profiles(full_name)')
        .eq('id', id)
        .single();

    // Fetch current user details
    const { data: { user } } = await supabase.auth.getUser();
    let userProfile = null;
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_vendor, vendor_verified')
            .eq('id', user.id)
            .single();
        userProfile = profile;
    }

    // Fetch bids
    const { data: bids } = await supabase
        .from('project_bids')
        .select('*, vendor:profiles(full_name, vendor_verified)')
        .eq('project_id', id);

    if (!project) {
        return (
            <main className="min-h-screen bg-[#FDFBF7] p-8 flex flex-col items-center justify-center gap-4">
                <p className="text-sm text-[#6B635B]">Project not found or was removed.</p>
                <Link href="/projects" className="btn-primary text-xs py-2 px-4">
                    View All Commissions
                </Link>
            </main>
        );
    }

    const isOwner = user && (user.id === project.buyer_id || !project.buyer_id);

    return (
        <main className="min-h-screen bg-[#FDFBF7] py-10 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto flex flex-col gap-6">
                {/* Back button */}
                <div>
                    <Link
                        href="/projects"
                        className="inline-flex items-center gap-1.5 text-xs text-[#6B635B] hover:text-[#1E1B18] font-semibold transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to All Commissions</span>
                    </Link>
                </div>

                {/* Project Header */}
                <div className="bg-white border border-[#E8E2D9] rounded-xl p-6 shadow-card">
                    <div className="flex items-center justify-between mb-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase ${
                            project.status === 'COMPLETED'
                                ? 'bg-[#EDF7ED] text-[#2E7D32]'
                                : project.status === 'OPEN'
                                ? 'bg-[#FFF4E5] text-[#ED6C02]'
                                : 'bg-[#F3EFEA] text-[#1E1B18]'
                        }`}>
                            {project.status}
                        </span>
                        <span className="text-xs font-mono text-[#6B635B]">
                            Created on {new Date(project.created_at).toLocaleDateString()}
                        </span>
                    </div>

                    <h1 className="text-2xl font-bold text-[#1E1B18] font-display">{project.title}</h1>
                    
                    {(() => {
                        const refImgMatch = project.description?.match(/\[REFERENCE_IMAGE:\s*(.*?)\]/);
                        const projImageUrl = project.image_url || (refImgMatch ? refImgMatch[1] : null);
                        const cleanDescription = project.description?.replace(/\[REFERENCE_IMAGE:\s*(.*?)\]/, '').trim();

                        return (
                            <>
                                {projImageUrl && (
                                    <div className="mt-4 rounded-xl overflow-hidden border border-[#E8E2D9] bg-[#FAF8F5]">
                                        <div className="bg-[#F3EFEA] px-3.5 py-1.5 border-b border-[#E8E2D9] flex items-center justify-between">
                                            <span className="text-xs font-semibold text-[#1E1B18] flex items-center gap-1.5">
                                                📷 Reference Sketch / Inspiration Photo
                                            </span>
                                            <a
                                                href={projImageUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-xs text-[#C85A32] font-medium hover:underline"
                                            >
                                                Open Full Resolution ↗
                                            </a>
                                        </div>
                                        <div className="p-2 flex justify-center bg-[#1E1B18]/5">
                                            <img
                                                src={projImageUrl}
                                                alt={`Reference sketch for ${project.title}`}
                                                className="max-h-80 w-auto rounded-lg object-contain"
                                            />
                                        </div>
                                    </div>
                                )}
                                <p className="text-sm text-[#6B635B] mt-4 leading-relaxed whitespace-pre-wrap">{cleanDescription}</p>
                            </>
                        );
                    })()}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-4 border-t border-[#E8E2D9]">
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-[#C85A32]" />
                            <span className="text-xs text-[#1E1B18] font-medium">
                                ₹{project.budget_min?.toLocaleString('en-IN')} – ₹{project.budget_max?.toLocaleString('en-IN')}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#C85A32]" />
                            <span className="text-xs text-[#1E1B18] font-medium">
                                Deadline: {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Flexible'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-[#C85A32]" />
                            <span className="text-xs text-[#1E1B18] font-medium">
                                Client: {project.buyer?.full_name || 'Anonymous Buyer'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Buyer Owner Actions: Delete Commission & Mark as Completed */}
                {isOwner && (
                    <ProjectOwnerActions
                        projectId={id}
                        initialStatus={project.status}
                        userId={user?.id || ''}
                    />
                )}

                {/* PostGIS Nearby Makers Map View */}
                <NearbyMakersMap />

                {/* Bidding Module */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <BiddingDrawer
                        projectId={id}
                        isVendor={userProfile?.is_vendor || false}
                        isVerified={userProfile?.vendor_verified || false}
                    />

                    {/* Received Bids (Real-time synchronized across tabs and cache) */}
                    <ProjectProposalsList
                        projectId={id}
                        initialBids={(bids || []) as any}
                        isOwner={!!isOwner}
                    />
                </div>
            </div>
        </main>
    );
}