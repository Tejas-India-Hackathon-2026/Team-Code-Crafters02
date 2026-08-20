import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/verifications
 * Fetches verified artisan video reels with optional category filtering and pagination.
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const limit = Math.min(50, parseInt(searchParams.get('limit') || '20', 10));

        let query = supabaseAdmin
            .from('verification_reels')
            .select(`
                id,
                vendor_id,
                video_url,
                status,
                confidence_score,
                ai_confidence_score,
                extracted_metadata,
                created_at,
                vendor:profiles!verification_reels_vendor_id_fkey(id, full_name, avatar_url, vendor_verified)
            `)
            .in('status', ['VERIFIED', 'AUTO_APPROVED'])
            .order('created_at', { ascending: false })
            .limit(limit);

        if (category && category !== 'all') {
            query = query.filter('extracted_metadata->>category', 'eq', category.toLowerCase());
        }

        const { data: reels, error } = await query;

        if (error) {
            console.error('Error fetching verified reels:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            count: reels?.length || 0,
            reels: reels || [],
        });
    } catch (err: any) {
        console.error('Verifications route error:', err);
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}
