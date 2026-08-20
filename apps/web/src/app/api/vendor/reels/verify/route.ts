import { NextResponse } from 'next/server';
import { createServerSideClient } from '../../../../../lib/supabaseServer';

export async function POST(request: Request) {
    try {
        const supabase = await createServerSideClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { reelId } = await request.json();

        // Call FastAPI Celery backend to enqueue video analysis
        const aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000';
        const aiResponse = await fetch(`${aiEngineUrl}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reelId }),
        });

        const aiData = await aiResponse.json();

        return NextResponse.json({
            status: 'QUEUED',
            reelId,
            jobId: aiData.jobId || 'local_worker',
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}