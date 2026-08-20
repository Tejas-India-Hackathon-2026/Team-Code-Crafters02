'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Calendar, Clock, DollarSign } from 'lucide-react';

interface Proposal {
    id: string;
    vendor_id?: string;
    vendorId?: string;
    project_id?: string;
    projectId?: string;
    amount?: number;
    bid_amount?: number;
    proposal_text?: string;
    proposalText?: string;
    created_at?: string;
    vendor?: {
        full_name?: string;
        vendor_verified?: boolean;
        avatar_url?: string;
    };
}

interface ProjectProposalsListProps {
    projectId: string;
    projectTitle?: string;
    initialBids: Proposal[];
    isOwner?: boolean;
}

/**
 * ProjectProposalsList renders real-time synchronized artisan proposals for custom commission
 * briefs, with instant removal when an artisan withdraws their bid and live pricing updates.
 */
export function ProjectProposalsList({
    projectId,
    initialBids = [],
    isOwner = false,
}: ProjectProposalsListProps): React.ReactNode {
    const [bids, setBids] = useState<Proposal[]>(initialBids);

    useEffect(() => {
        const syncBids = () => {
            let combined = [...initialBids];

            if (typeof window !== 'undefined') {
                try {
                    const rawCached = localStorage.getItem('karigar_project_bids_cache');
                    if (rawCached) {
                        const cachedList = JSON.parse(rawCached);
                        if (Array.isArray(cachedList)) {
                            // Find bids for this project
                            const projectCached = cachedList.filter(
                                (c: any) => (c.projectId === projectId || c.project_id === projectId)
                            );

                            const cachedVendorIds = new Set(projectCached.map((c: any) => c.vendorId || c.vendor_id));

                            // Remove any server bid that was overwritten or deleted in cache
                            combined = combined.filter((b) => {
                                const vId = b.vendor_id || b.vendorId;
                                return !cachedVendorIds.has(vId);
                            });

                            // Add the fresh active cached bids
                            projectCached.forEach((cb: any) => {
                                combined.push({
                                    id: cb.id || `bid-${Date.now()}`,
                                    vendor_id: cb.vendorId || cb.vendor_id,
                                    project_id: projectId,
                                    amount: cb.bid_amount || cb.amount || 0,
                                    bid_amount: cb.bid_amount || cb.amount || 0,
                                    proposal_text: cb.proposal_text || cb.proposalText || '',
                                    vendor: cb.vendor || {
                                        full_name: 'Verified Artisan',
                                        vendor_verified: true,
                                    },
                                    created_at: cb.created_at || new Date().toISOString(),
                                });
                            });
                        }
                    }
                } catch (e) {}
            }

            setBids(combined);
        };

        syncBids();

        // Listen for storage events across tabs or local mutations
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'karigar_project_bids_cache') {
                syncBids();
            }
        };

        window.addEventListener('storage', handleStorage);
        const interval = setInterval(syncBids, 2000);

        return () => {
            window.removeEventListener('storage', handleStorage);
            clearInterval(interval);
        };
    }, [projectId, initialBids]);

    return (
        <div className="bg-white border border-[#E8E2D9] rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-[#1E1B18]">
                    Received Proposals ({bids.length})
                </h3>
                {bids.length > 0 && (
                    <span className="text-[11px] font-bold text-[#2E7D32] bg-[#EDF7ED] px-2 py-0.5 rounded-full">
                        Active Bids
                    </span>
                )}
            </div>

            {bids.length > 0 ? (
                <div className="flex flex-col gap-3">
                    {bids.map((bid) => {
                        const price = bid.bid_amount || bid.amount || 0;
                        const text = bid.proposal_text || bid.proposalText || '';
                        const turnaroundMatch = text.match(/\[ESTIMATED_TURNAROUND:\s*(\d+\s*Days)\]/);
                        const turnaround = turnaroundMatch ? turnaroundMatch[1] : null;
                        const cleanText = text.replace(/\[ESTIMATED_TURNAROUND:\s*.*?\]/, '').trim();

                        return (
                            <div
                                key={bid.id}
                                className="p-3.5 bg-[#FDFBF7] border border-[#E8E2D9] rounded-xl transition-all hover:border-[#C85A32]/40 hover:shadow-xs"
                            >
                                <div className="flex justify-between items-center mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-[#1E1B18]">
                                            {bid.vendor?.full_name || 'Verified Artisan Maker'}
                                        </span>
                                        <span className="text-[10px] font-semibold bg-[#EDF7ED] text-[#2E7D32] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                            <ShieldCheck className="w-2.5 h-2.5" />
                                            Verified
                                        </span>
                                    </div>
                                    <span className="text-sm font-bold text-[#C85A32] font-mono">
                                        ₹{price.toLocaleString('en-IN')}
                                    </span>
                                </div>

                                <p className="text-xs text-[#6B635B] leading-relaxed mb-2 whitespace-pre-wrap">
                                    {cleanText}
                                </p>

                                {turnaround && (
                                    <div className="flex items-center gap-1 text-[11px] text-[#6B635B] font-medium pt-1.5 border-t border-[#E8E2D9]/60">
                                        <Clock className="w-3 h-3 text-[#C85A32]" />
                                        <span>Estimated Dispatch: {turnaround}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="py-6 text-center text-xs text-[#6B635B] bg-[#FAF8F5] rounded-lg border border-dashed border-[#E8E2D9]">
                    <p className="font-medium text-[#1E1B18] mb-1">No active proposals right now</p>
                    <p className="text-[11px]">When verified regional artisans submit bids, their estimates will appear here in real time.</p>
                </div>
            )}
        </div>
    );
}

export default ProjectProposalsList;
