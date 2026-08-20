'use client';

import React from 'react';
import { ShieldCheck, Clock, CheckCircle2, AlertTriangle, RefreshCw, Lock } from 'lucide-react';

export type EscrowState =
    | 'INITIATED'
    | 'FUNDED'
    | 'DISPATCHED'
    | 'IN_INSPECTION'
    | 'RELEASED'
    | 'REFUNDED'
    | 'DISPUTED';

export interface EscrowStatusBadgeProps {
    status: EscrowState | string;
    className?: string;
}

/** EscrowStatusBadge renders dual-rail statutory escrow states with accessible color tokens. */
export function EscrowStatusBadge({ status, className = '' }: EscrowStatusBadgeProps): React.ReactNode {
    const config: Record<string, { label: string; bg: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
        INITIATED: { label: 'Payment Initiated', bg: 'bg-[#FAF8F5]', text: 'text-[#6B635B]', icon: Clock },
        FUNDED: { label: 'Escrow Locked', bg: 'bg-[#EDF7ED]', text: 'text-[#2E7D32]', icon: Lock },
        DISPATCHED: { label: 'In Transit', bg: 'bg-[#EDF7ED]', text: 'text-[#2E7D32]', icon: ShieldCheck },
        IN_INSPECTION: { label: '48h Inspection Window', bg: 'bg-[#FFF4E5]', text: 'text-[#ED6C02]', icon: Clock },
        RELEASED: { label: 'Funds Released to Maker', bg: 'bg-[#EDF7ED]', text: 'text-[#2E7D32]', icon: CheckCircle2 },
        REFUNDED: { label: 'Refunded to Buyer', bg: 'bg-[#F3EFEA]', text: 'text-[#6B635B]', icon: RefreshCw },
        DISPUTED: { label: 'Disputed - In Triage', bg: 'bg-[#FDEDED]', text: 'text-[#D32F2F]', icon: AlertTriangle },
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
