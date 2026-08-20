'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Trash2, RefreshCw, AlertCircle } from 'lucide-react';

interface ProjectOwnerActionsProps {
    projectId: string;
    initialStatus: string;
    userId: string;
}

export default function ProjectOwnerActions({
    projectId,
    initialStatus,
    userId,
}: ProjectOwnerActionsProps) {
    const router = useRouter();
    const [status, setStatus] = useState<string>(initialStatus);
    const [loading, setLoading] = useState<boolean>(false);
    const [msg, setMsg] = useState<string | null>(null);

    const handleAction = async (action: 'MARK_COMPLETED' | 'REOPEN' | 'DELETE') => {
        if (action === 'DELETE') {
            if (!window.confirm('Are you sure you want to permanently delete this custom project commission and all received artisan bids?')) {
                return;
            }
        }

        try {
            setLoading(true);
            const res = await fetch('/api/buyer/projects/manage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, action, userId }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                if (action === 'DELETE') {
                    router.push('/projects');
                } else if (action === 'MARK_COMPLETED') {
                    setStatus('COMPLETED');
                    setMsg('✓ Project marked as completed!');
                    router.refresh();
                } else if (action === 'REOPEN') {
                    setStatus('OPEN');
                    setMsg('✓ Project reopened for artisan proposals!');
                    router.refresh();
                }
            } else {
                alert(data.error || 'Action failed');
            }
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#FDFBF7] border border-[#E8E2D9] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#6B635B] block mb-0.5">
                    Commission Owner Controls
                </span>
                <p className="text-xs text-[#1E1B18] font-medium">
                    Current Status:{' '}
                    <span className={`font-bold uppercase px-2 py-0.5 rounded text-[11px] ${
                        status === 'COMPLETED'
                            ? 'bg-[#EDF7ED] text-[#2E7D32]'
                            : status === 'OPEN'
                            ? 'bg-[#FFF4E5] text-[#ED6C02]'
                            : 'bg-[#F3EFEA] text-[#1E1B18]'
                    }`}>
                        {status}
                    </span>
                </p>
                {msg && <p className="text-xs text-[#2E7D32] font-semibold mt-1">{msg}</p>}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
                {status !== 'COMPLETED' ? (
                    <button
                        onClick={() => handleAction('MARK_COMPLETED')}
                        disabled={loading}
                        className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5 font-semibold cursor-pointer disabled:opacity-50"
                    >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark as Completed</span>
                    </button>
                ) : (
                    <button
                        onClick={() => handleAction('REOPEN')}
                        disabled={loading}
                        className="btn-ghost text-xs py-2 px-3 flex items-center gap-1.5 font-semibold cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reopen Project</span>
                    </button>
                )}

                <button
                    onClick={() => handleAction('DELETE')}
                    disabled={loading}
                    className="py-2 px-3 bg-white hover:bg-[#FDEDED] text-[#6B635B] hover:text-[#D32F2F] border border-[#E8E2D9] hover:border-[#F5C2C7] rounded-lg transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                    <Trash2 className="w-3.5 h-3.5 text-[#D32F2F]" />
                    <span>Delete Commission</span>
                </button>
            </div>
        </div>
    );
}
