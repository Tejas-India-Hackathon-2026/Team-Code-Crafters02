'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, Tag, Clock } from 'lucide-react';
import { KintoCard, KintoBadge } from '../ui/kinto-card';

export interface ProjectCardProps {
    id: string;
    title: string;
    description: string;
    category?: string;
    budgetMin?: number;
    budgetMax?: number;
    deadline?: string;
    buyerName?: string;
    status?: string;
    imageUrl?: string | null;
}

/** ProjectCard renders marketplace commission brief with Kinto-styled tactile cards. */
export function ProjectCard({
    id,
    title,
    description,
    category = 'General Craft',
    budgetMin = 1000,
    budgetMax = 5000,
    deadline,
    buyerName = 'Artisan Buyer',
    status = 'OPEN',
    imageUrl,
}: ProjectCardProps): React.ReactNode {
    const refImgMatch = description?.match(/\[REFERENCE_IMAGE:\s*(.*?)\]/);
    const finalImageUrl = imageUrl || (refImgMatch ? refImgMatch[1] : null);
    const cleanDescription = description?.replace(/\[REFERENCE_IMAGE:\s*(.*?)\]/, '').trim();

    return (
        <KintoCard
            as="article"
            glow={true}
            aria-label={`Artisan Project: ${title}`}
            className="flex flex-col justify-between"
        >
            <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-lg bg-stone-100/80 text-stone-700 border border-stone-200/80">
                        <Tag className="w-3 h-3 text-[#C85A32]" />
                        {category}
                    </span>
                    <KintoBadge variant={status === 'OPEN' ? 'success' : 'default'}>
                        {status}
                    </KintoBadge>
                </div>

                {finalImageUrl && (
                    <div className="mb-3 rounded-xl overflow-hidden border border-stone-200/80 bg-[#FAF8F5]">
                        <img
                            src={finalImageUrl}
                            alt={`Reference sketch for ${title}`}
                            className="w-full h-32 object-cover"
                        />
                    </div>
                )}

                <h3 className="font-display font-bold text-base text-stone-900 mt-1 mb-2 line-clamp-1">
                    {title}
                </h3>

                <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed mb-4">
                    {cleanDescription}
                </p>

                {deadline && (
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-stone-500 mb-3">
                        <Clock className="w-3.5 h-3.5 text-[#C85A32]" />
                        <span>Deadline: {new Date(deadline).toLocaleDateString()}</span>
                    </div>
                )}
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between mt-2">
                <div>
                    <span className="text-[10px] uppercase tracking-wider text-stone-500 block font-mono font-semibold">
                        Budget Range
                    </span>
                    <span className="text-sm font-bold text-[#C85A32] font-mono">
                        ₹{budgetMin.toLocaleString('en-IN')} – ₹{budgetMax.toLocaleString('en-IN')}
                    </span>
                </div>

                <Link
                    href={`/projects/${id}`}
                    className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1 font-semibold shadow-xs"
                >
                    <span>View Brief</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </KintoCard>
    );
}

export default ProjectCard;
