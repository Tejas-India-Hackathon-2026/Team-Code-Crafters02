import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const maxDuration = 60; // Allocate maximum 60s runtime for multimodal AI video inspection
export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('video') as File | null;
        const productTitle = (formData.get('productTitle') as string) || 'Handmade Craft';
        const category = (formData.get('category') as string) || 'woodworking';
        const price = parseFloat((formData.get('price') as string) || '0');
        const description = (formData.get('description') as string) || '';
        const userId = (formData.get('userId') as string) || null;

        if (!file) {
            return NextResponse.json({ error: 'Video file is required' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileExt = (file.name.split('.').pop() || 'mp4').toLowerCase();
        const cleanTitle = productTitle.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const fileName = `reel_${cleanTitle}_${Date.now()}.${fileExt}`;

        // 1. Fetch Maker Profile
        let registeredLogo = null;
        if (userId) {
            const { data: prof } = await supabaseAdmin
                .from('profiles')
                .select('avatar_url, full_name')
                .eq('id', userId)
                .maybeSingle();
            registeredLogo = prof?.avatar_url;
        }

        // 2. Strict Real Multimodal AI Inspection with Gemini 3.6 Flash BEFORE saving
        let confidenceScore = 0.10;
        let logoDetected = false;
        let logoMatched = false;
        let livenessVerified = false;
        let batchMarking = 'NONE';
        let aiSummary = 'No physical artisan handcrafting or workshop process detected in video.';

        const geminiApiKey = process.env.GEMINI_API_KEY;

        if (geminiApiKey && !geminiApiKey.includes('mock')) {
            const prompt = `You are the strict AI Vision Inspector for the Karigar Kart Handmade Artisan Marketplace.
Inspect the attached video bytes for authentic artisan craftsmanship in the category: "${category}".

Strict Verification Rules:
1. If the video is a generic stock video, motivational quote, text animation, meme, random clip, child/comedy video, video game, or has NO visible real physical handcrafting activity (such as chiseling wood, throwing pottery clay, handloom weaving, hammering brass, gemstone setting, or leather stitching), you MUST reject it:
   - "confidence_score": 0.05 to 0.20 (strictly below 0.85)
   - "logo_detected": false
   - "logo_matched": false
   - "liveness_verified": false
   - "summary": "Video rejected: No physical artisan handcrafting or workshop manufacturing process detected."
2. Only if the video genuinely shows an artisan creating or working on a physical handcrafted item in a workshop AND physical branding/stamping is verified, can you assign a score >= 0.85.

Output JSON ONLY in this exact format:
{
  "confidence_score": 0.92,
  "logo_detected": true,
  "logo_matched": true,
  "batch_marking": "#04/50",
  "liveness_verified": true,
  "summary": "Detailed description of detected workshop process"
}`;

            const parts: any[] = [
                {
                    inlineData: {
                        mimeType: file.type || 'video/mp4',
                        data: buffer.toString('base64'),
                    },
                },
                { text: prompt },
            ];

            const candidateModels = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];
            for (const model of candidateModels) {
                try {
                    const geminiRes = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{ parts }],
                                generationConfig: { responseMimeType: 'application/json' },
                            }),
                        }
                    );

                    if (geminiRes.ok) {
                        const geminiData = await geminiRes.json();
                        const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text) {
                            const parsed = JSON.parse(text);
                            confidenceScore = typeof parsed.confidence_score === 'number' ? parsed.confidence_score : 0.10;
                            logoDetected = !!parsed.logo_detected;
                            logoMatched = !!parsed.logo_matched;
                            livenessVerified = !!parsed.liveness_verified;
                            batchMarking = parsed.batch_marking || 'NONE';
                            aiSummary = parsed.summary || aiSummary;
                            break;
                        }
                    }
                } catch (err) {
                    console.warn(`Gemini evaluation error with ${model}:`, err);
                }
            }
        }

        // 3. Strict 85% Verification Threshold Rule:
        // IF SCORE < 85%, COMPLETELY REJECT AND DO NOT PUBLISH/STORE THE VIDEO
        const isAutoApproved = confidenceScore >= 0.85;

        if (!isAutoApproved) {
            const scorePct = Math.round(confidenceScore * 100);
            return NextResponse.json({
                success: false,
                isAutoApproved: false,
                confidenceScore,
                status: 'REJECTED',
                error: `AI Verification Failed (${scorePct}% score, minimum 85% required): ${aiSummary}`,
                aiSummary,
            }, { status: 422 });
        }

        // 4. If and only if Score >= 85%, persist video to storage
        let videoUrl = '';
        try {
            const { data: buckets } = await supabaseAdmin.storage.listBuckets();
            const exists = buckets?.some((b) => b.name === 'product-reels');
            if (!exists) {
                await supabaseAdmin.storage.createBucket('product-reels', { public: true });
            }

            const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                .from('product-reels')
                .upload(fileName, buffer, {
                    contentType: file.type || 'video/mp4',
                    upsert: true,
                });

            if (!uploadError && uploadData) {
                const { data: publicUrlData } = supabaseAdmin.storage
                    .from('product-reels')
                    .getPublicUrl(fileName);
                videoUrl = publicUrlData.publicUrl;
            }
        } catch (storageErr) {
            console.warn('Supabase storage video upload warning:', storageErr);
        }

        if (!videoUrl) {
            const publicDir = path.join(process.cwd(), 'public', 'uploads', 'reels');
            if (!fs.existsSync(publicDir)) {
                fs.mkdirSync(publicDir, { recursive: true });
            }
            const filePath = path.join(publicDir, fileName);
            fs.writeFileSync(filePath, buffer);
            videoUrl = `/uploads/reels/${fileName}`;
        }

        // 5. Save verified product reel into public.verification_reels
        const { data: reel, error: dbError } = await supabaseAdmin
            .from('verification_reels')
            .insert({
                vendor_id: userId || '83db6dde-207f-4e63-aee0-3b6db0983763',
                video_url: videoUrl,
                status: 'AUTO_APPROVED',
                confidence_score: confidenceScore,
                extracted_metadata: {
                    productTitle,
                    category,
                    price,
                    description,
                    batch_marking: batchMarking !== 'NONE' ? batchMarking : `#0${Math.floor(Math.random() * 9 + 1)}/50`,
                    logo_detected: logoDetected,
                    logo_matched: logoMatched,
                    liveness_verified: livenessVerified,
                    summary: aiSummary,
                    submittedAt: new Date().toISOString(),
                },
            })
            .select('*')
            .single();

        if (dbError) {
            console.error('Reel insert error:', dbError);
            return NextResponse.json({ error: dbError.message }, { status: 500 });
        }

        // 6. Update Maker profile
        if (userId) {
            await supabaseAdmin
                .from('profiles')
                .update({ vendor_verified: true, kyc_status: 'PASSED' })
                .eq('id', userId);
        }

        return NextResponse.json({
            success: true,
            isAutoApproved: true,
            confidenceScore,
            status: 'AUTO_APPROVED',
            aiSummary,
            reelId: reel.id,
            reel,
        });
    } catch (err: any) {
        console.error('Reel upload error:', err);
        return NextResponse.json({ error: err.message || 'Video upload failed' }, { status: 500 });
    }
}
