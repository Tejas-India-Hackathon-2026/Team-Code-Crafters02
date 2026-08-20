import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const { projectId, action, userId } = await request.json();

        if (!projectId || !action) {
            return NextResponse.json({ error: 'projectId and action are required' }, { status: 400 });
        }

        // Fetch project
        const { data: project, error: fetchErr } = await supabaseAdmin
            .from('custom_projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (fetchErr || !project) {
            return NextResponse.json({ error: 'Commission project not found' }, { status: 404 });
        }

        // Check ownership if userId provided
        if (userId && project.buyer_id && project.buyer_id !== userId) {
            return NextResponse.json({ error: 'Unauthorized: Only the project owner can manage this commission' }, { status: 403 });
        }

        if (action === 'DELETE') {
            // Delete associated bids first
            await supabaseAdmin.from('project_bids').delete().eq('project_id', projectId);

            // Delete project
            const { error: delErr } = await supabaseAdmin
                .from('custom_projects')
                .delete()
                .eq('id', projectId);

            if (delErr) throw delErr;

            return NextResponse.json({
                success: true,
                message: 'Custom project commission deleted successfully',
                projectId,
            });
        }

        if (action === 'MARK_COMPLETED') {
            const { data: updated, error: updateErr } = await supabaseAdmin
                .from('custom_projects')
                .update({ status: 'COMPLETED' })
                .eq('id', projectId)
                .select('*')
                .single();

            if (updateErr) throw updateErr;

            return NextResponse.json({
                success: true,
                message: 'Commission marked as completed!',
                project: updated,
            });
        }

        if (action === 'REOPEN') {
            const { data: updated, error: updateErr } = await supabaseAdmin
                .from('custom_projects')
                .update({ status: 'OPEN' })
                .eq('id', projectId)
                .select('*')
                .single();

            if (updateErr) throw updateErr;

            return NextResponse.json({
                success: true,
                message: 'Commission reopened for bids!',
                project: updated,
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (err: any) {
        console.error('Project management error:', err);
        return NextResponse.json({ error: err.message || 'Failed to manage commission' }, { status: 500 });
    }
}
