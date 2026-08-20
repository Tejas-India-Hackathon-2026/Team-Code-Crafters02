'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, Tag, Clock } from 'lucide-react';

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
}

/** ProjectCard renders marketplace commission brief with budget and category tags. */
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
}: ProjectCardProps): JSX.Element {
    return (
        <article
            aria-label={`Artisan Project: ${title}`}
            className="card p-5 bg-white border border-[#E8E2D9] rounded-2xl shadow-card hover:shadow-elevated transition-all flex flex-col justify-between"
        >
            <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF8F5] text-[#C85A32] border border-[#E8E2D9]">
                        <Tag className="w-3 h-3" />
                        {category}
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#EDF7ED] text-[#2E7D32]">
                        {status}
                    </span>
                </div>

                <h3 className="font-display font-bold text-base text-[#1E1B18] mt-1 mb-2 line-clamp-1">
                    {title}
                </h3>

                <p className="text-xs text-[#6B635B] line-clamp-2 leading-relaxed mb-4">
                    {description}
                </p>

                {deadline && (
                    <div className="flex items-center gap-1 text-[11px] text-[#6B635B] mb-3">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Deadline: {new Date(deadline).toLocaleDateString()}</span>
                    </div>
                )}
            </div>

            <div className="pt-3 border-t border-[#F3EFEA] flex items-center justify-between mt-2">
                <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#6B635B] block font-semibold">
                        Budget Range
                    </span>
                    <span className="text-sm font-bold text-[#C85A32] font-mono">
                        ₹{budgetMin.toLocaleString('en-IN')} – ₹{budgetMax.toLocaleString('en-IN')}
                    </span>
                </div>

                <Link
                    href={`/projects/${id}`}
                    className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1 font-semibold"
                >
                    <span>View Brief</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </article>
    );
}

export default ProjectCard;
