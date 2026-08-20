'use client';

import React from 'react';
import { ShieldCheck, Clock, CheckCircle2, AlertTriangle, RefreshCw, Lock } from 'lucide-react';

export type EscrowOrderStatus =
    | 'AWAITING_PAYMENT'
    | 'INITIATED'
    | 'HELD_IN_ESCROW'
    | 'FUNDED'
    | 'DISPATCHED'
    | 'IN_TRANSIT'
    | 'DELIVERED_PENDING_BUFFER'
    | 'IN_INSPECTION'
    | 'RELEASED'
    | 'COMPLETED'
    | 'REFUNDED'
    | 'DISPUTED'
    | 'IN_TRIAGE';

export type EscrowRailType = 'WEB2_NODAL' | 'WEB3_ONCHAIN_USDC' | 'UPI_INSTANT';

export interface TdsBreakdownSummary {
    grossAmount: number;
    withheldTds: number;
    netMakerPayout: number;
    statutorySection: string;
}

export interface EscrowStatusBadgeProps {
    status: EscrowOrderStatus | string;
    rail?: EscrowRailType | string;
    showRailBadge?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

/** Resolves Section 194-O statutory TDS calculations for gross order amounts. */
export function resolveOrderTdsBreakdown(grossAmount: number): TdsBreakdownSummary {
    const gross = Math.max(0, isNaN(grossAmount) ? 0 : grossAmount);
    const tds = Math.round(gross * 0.01);
    const net = Math.max(0, gross - tds);
    return {
        grossAmount: gross,
        withheldTds: tds,
        netMakerPayout: net,
        statutorySection: 'Section 194-O (1% E-Commerce TDS)',
    };
}

/** EscrowStatusBadge renders dual-rail statutory escrow states with accessible color tokens. */
export function EscrowStatusBadge({
    status,
    rail,
    showRailBadge = false,
    size = 'md',
    className = '',
}: EscrowStatusBadgeProps): React.ReactNode {
    const config: Record<string, { label: string; bg: string; text: string; icon: React.ComponentType<{ className?: string }>; pulse?: boolean }> = {
        AWAITING_PAYMENT: { label: 'Awaiting Escrow Funding', bg: 'bg-[#FAF8F5]', text: 'text-[#6B635B]', icon: Clock },
        INITIATED: { label: 'Payment Initiated', bg: 'bg-[#FAF8F5]', text: 'text-[#6B635B]', icon: Clock },
        HELD_IN_ESCROW: { label: 'Locked in Escrow', bg: 'bg-[#EDF7ED]', text: 'text-[#2E7D32]', icon: Lock, pulse: true },
        FUNDED: { label: 'Escrow Locked', bg: 'bg-[#EDF7ED]', text: 'text-[#2E7D32]', icon: Lock },
        DISPATCHED: { label: 'In Transit with Courier', bg: 'bg-[#EDF7ED]', text: 'text-[#2E7D32]', icon: ShieldCheck },
        IN_TRANSIT: { label: 'In Transit', bg: 'bg-[#EDF7ED]', text: 'text-[#2E7D32]', icon: ShieldCheck },
        DELIVERED_PENDING_BUFFER: { label: '48h Inspection Buffer', bg: 'bg-[#FFF4E5]', text: 'text-[#ED6C02]', icon: Clock, pulse: true },
        IN_INSPECTION: { label: '48h Inspection Window', bg: 'bg-[#FFF4E5]', text: 'text-[#ED6C02]', icon: Clock, pulse: true },
        RELEASED: { label: 'Milestone Released to Maker', bg: 'bg-[#EDF7ED]', text: 'text-[#2E7D32]', icon: CheckCircle2 },
        COMPLETED: { label: 'Order Complete', bg: 'bg-[#EDF7ED]', text: 'text-[#2E7D32]', icon: CheckCircle2 },
        REFUNDED: { label: 'Refunded to Buyer', bg: 'bg-[#F3EFEA]', text: 'text-[#6B635B]', icon: RefreshCw },
        DISPUTED: { label: 'Disputed - In Triage', bg: 'bg-[#FDEDED]', text: 'text-[#D32F2F]', icon: AlertTriangle, pulse: true },
        IN_TRIAGE: { label: 'Under Platform Review', bg: 'bg-[#FDEDED]', text: 'text-[#D32F2F]', icon: AlertTriangle, pulse: true },
    };

    const current = config[status.toUpperCase()] || {
        label: status,
        bg: 'bg-[#FAF8F5]',
        text: 'text-[#6B635B]',
        icon: ShieldCheck,
    };

    const Icon = current.icon;

    return (
        <span
            role="status"
            aria-label={`Escrow Status: ${current.label}`}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${current.bg} ${current.text} border border-current/10 ${className}`}
        >
            <Icon className="w-3.5 h-3.5" />
            <span>{current.label}</span>
        </span>
    );
}

export default EscrowStatusBadge;
