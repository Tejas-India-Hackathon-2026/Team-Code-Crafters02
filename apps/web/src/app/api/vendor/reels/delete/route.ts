import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const { reelId, userId } = await request.json();

        if (!reelId) {
            return NextResponse.json({ error: 'Reel ID is required' }, { status: 400 });
        }

        // Fetch reel record
        const { data: reel, error: fetchErr } = await supabaseAdmin
            .from('verification_reels')
            .select('*')
            .eq('id', reelId)
            .single();

        if (fetchErr || !reel) {
            return NextResponse.json({ error: 'Reel not found' }, { status: 404 });
        }

        // Check ownership if userId provided
        if (userId && reel.vendor_id && reel.vendor_id !== userId) {
            return NextResponse.json({ error: 'Unauthorized to delete this product' }, { status: 403 });
        }

        // 1. Delete physical video file from local disk if stored locally
        if (reel.video_url && reel.video_url.startsWith('/uploads/reels/')) {
            const fileName = path.basename(reel.video_url);
            const filePath = path.join(process.cwd(), 'public', 'uploads', 'reels', fileName);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (e) {
                    console.warn('Could not delete local video file:', e);
                }
            }
        } else if (reel.video_url && reel.video_url.includes('product-reels')) {
            // Delete from Supabase storage if applicable
            try {
                const parts = reel.video_url.split('/product-reels/');
                if (parts[1]) {
                    await supabaseAdmin.storage.from('product-reels').remove([parts[1]]);
                }
            } catch (e) {
                console.warn('Could not delete storage video:', e);
            }
        }

        // 2. Delete from verification_reels table
        const { error: dbErr } = await supabaseAdmin
            .from('verification_reels')
            .delete()
            .eq('id', reelId);

        if (dbErr) {
            return NextResponse.json({ error: dbErr.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Product and video deleted successfully',
            reelId,
        });
    } catch (err: any) {
        console.error('Delete product reel error:', err);
        return NextResponse.json({ error: err.message || 'Failed to delete product' }, { status: 500 });
    }
}
