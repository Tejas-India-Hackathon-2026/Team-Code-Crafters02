import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: reelId } = await context.params;
        const body = await request.json();
        const { decision, notes, adminId } = body;

        if (!reelId) {
            return NextResponse.json({ error: 'Reel ID is required' }, { status: 400 });
        }

        if (decision !== 'APPROVE' && decision !== 'REJECT') {
            return NextResponse.json(
                { error: 'Decision must be either "APPROVE" or "REJECT"' },
                { status: 400 }
            );
        }

        const newStatus = decision === 'APPROVE' ? 'VERIFIED' : 'REJECTED';

        // 1. Update verification_reel record
        const { data: updatedReel, error: reelError } = await supabaseAdmin
            .from('verification_reels')
            .update({
                status: newStatus,
                review_notes: notes || (decision === 'APPROVE' ? 'Manually verified by marketplace administrator.' : 'Rejected during manual HITL triage.'),
                reviewed_at: new Date().toISOString(),
                reviewed_by: adminId || null,
            })
            .eq('id', reelId)
            .select('*, vendor:profiles(id, full_name, avatar_url, vendor_verified)')
            .single();

        if (reelError) {
            console.error('Error updating verification reel decision:', reelError);
            return NextResponse.json({ error: reelError.message }, { status: 500 });
        }

        // 2. If approved, verify the maker profile
        if (decision === 'APPROVE' && updatedReel?.vendor_id) {
            await supabaseAdmin
                .from('profiles')
                .update({ vendor_verified: true, kyc_status: 'PASSED' })
                .eq('id', updatedReel.vendor_id);
        }

        return NextResponse.json({
            success: true,
            status: newStatus,
            decision,
            reel: updatedReel,
        });
    } catch (err: any) {
        console.error('Admin decision API error:', err);
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}
