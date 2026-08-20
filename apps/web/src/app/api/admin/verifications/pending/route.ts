import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    try {
        const { data: pendingReels, error } = await supabaseAdmin
            .from('verification_reels')
            .select(`
                id,
                vendor_id,
                video_url,
                status,
                confidence_score,
                ai_confidence_score,
                extracted_metadata,
                review_notes,
                reviewed_by,
                reviewed_at,
                created_at,
                vendor:profiles!verification_reels_vendor_id_fkey(id, full_name, avatar_url, is_vendor, vendor_verified)
            `)
            .in('status', ['PENDING_ADMIN_REVIEW', 'NEEDS_REVIEW', 'PENDING'])
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching pending admin verification reels:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            count: pendingReels?.length || 0,
            reels: pendingReels || [],
        });
    } catch (err: any) {
        console.error('Pending verifications API error:', err);
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}
