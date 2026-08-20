'use client';

import React from 'react';
import { cn } from '../../lib/utils';

export interface KintoCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    glow?: boolean;
    hoverEffect?: boolean;
    as?: React.ElementType;
}

/**
 * KintoCard: Kinto-inspired tactile surface with backdrop blur, subtle borders,
 * and optional ambient lighting glow.
 */
export function KintoCard({
    children,
    className,
    glow = false,
    hoverEffect = true,
    as: Component = 'div',
    ...props
}: KintoCardProps) {
    return (
        <Component
            className={cn(
                'relative bg-white/90 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs transition-all duration-200',
                glow && 'before:absolute before:-inset-px before:rounded-2xl before:bg-gradient-to-b before:from-[#C85A32]/20 before:to-transparent before:-z-10 before:opacity-0 hover:before:opacity-100 before:transition-opacity',
                hoverEffect && 'hover:shadow-md hover:border-stone-300 hover:-translate-y-0.5',
                className
            )}
            {...props}
        >
            {children}
        </Component>
    );
}

export type KintoBadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

export interface KintoBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    children: React.ReactNode;
    variant?: KintoBadgeVariant;
    dot?: boolean;
    className?: string;
}

const BADGE_VARIANTS: Record<KintoBadgeVariant, { container: string; dot: string }> = {
    default: {
        container: 'bg-stone-100/90 text-stone-700 border-stone-200/80',
        dot: 'bg-stone-500',
    },
    success: {
        container: 'bg-[#EDF7ED]/90 text-[#2E7D32] border-[#2E7D32]/20',
        dot: 'bg-[#2E7D32]',
    },
    warning: {
        container: 'bg-[#FFF4E5]/90 text-[#ED6C02] border-[#ED6C02]/20',
        dot: 'bg-[#ED6C02]',
    },
    danger: {
        container: 'bg-[#FDEDED]/90 text-[#D32F2F] border-[#D32F2F]/20',
        dot: 'bg-[#D32F2F]',
    },
    info: {
        container: 'bg-sky-50/90 text-sky-700 border-sky-200/80',
        dot: 'bg-sky-500',
    },
    brand: {
        container: 'bg-[#FAF7F2] text-[#C85A32] border-[#C85A32]/25',
        dot: 'bg-[#C85A32]',
    },
};

/**
 * KintoBadge: Monospaced status badge with tactile ring borders and optional pulse indicator.
 */
export function KintoBadge({
    children,
    variant = 'default',
    dot = true,
    className,
    ...props
}: KintoBadgeProps) {
    const config = BADGE_VARIANTS[variant] || BADGE_VARIANTS.default;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold tracking-tight border backdrop-blur-xs shadow-2xs select-none',
                config.container,
                className
            )}
            {...props}
        >
            {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} />}
            <span>{children}</span>
        </span>
    );
}

export default KintoCard;
