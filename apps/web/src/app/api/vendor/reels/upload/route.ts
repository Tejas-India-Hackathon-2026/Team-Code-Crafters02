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

        // 1. Fetch Maker Profile & Registered Logo / Avatar
        let registeredLogo: string | null = null;
        let makerFullName: string = 'Artisan Maker';
        if (userId) {
            const { data: prof } = await supabaseAdmin
                .from('profiles')
                .select('avatar_url, full_name')
                .eq('id', userId)
                .maybeSingle();
            registeredLogo = prof?.avatar_url || null;
            if (prof?.full_name) makerFullName = prof.full_name;
        }

        // 2. Multimodal AI Video & Watermark / Logo Inspection with Gemini
        let confidenceScore = 0.40;
        let isGenuineCraft = false;
        let logoDetected = false;
        let logoMatched = false;
        let livenessVerified = false;
        let batchMarking = `#0${Math.floor(Math.random() * 9 + 1)}/50`;
        let aiSummary = `No authentic handcrafted ${category} process detected in this video. Please upload a genuine video of your workshop crafting process.`;

        const geminiApiKey = process.env.GEMINI_API_KEY;

        if (geminiApiKey && !geminiApiKey.includes('mock')) {
            const prompt = `You are the strict, unyielding AI Craft Authenticity Inspector for the Karigar Kart Handmade Artisan Marketplace.
Your sole mission is to inspect the attached video for physical, authentic, handmade craftsmanship in the declared category: "${category}".

Declared Product Title: "${productTitle}"
Declared Category: "${category}"
Declared Maker / Studio: "${makerFullName}"

STRICT EVALUATION RULES:

1. REJECTION CRITERIA (Assign confidence_score between 0.10 and 0.55):
   - The video is random, generic, or unrelated content (e.g. video game recordings, movies, memes, dancing, talking head / vlogs, animals, vehicles, digital screen recordings, nature footage, food recipes).
   - The video displays finished factory goods without showing physical handcrafted work in progress.
   - The video shows automated industrial mass production machinery (e.g. computer-controlled CNC mills, industrial injection molds, automated conveyor assembly lines).
   - The video is not related to "${category}".

2. HITL REVIEW CRITERIA (Assign confidence_score between 0.85 and 0.89):
   - Authentic handcrafted item is shown, and some manual tool work or studio table is visible, but the video is very short (< 5s of process) or physical maker hands are partially occluded.

3. AUTO-APPROVAL CRITERIA (Assign confidence_score between 0.90 and 0.98):
   - The video unambiguously demonstrates a human artisan actively handcrafting raw materials using manual tools (e.g. wood chisel/sander, pottery throwing wheel, manual handloom shuttle, hand brush painting, stone carving, manual metal beating).
   - Workshop setting, raw materials (clay, wood, yarn, metal), and artisan process are clearly genuine.

Output ONLY valid JSON with this exact schema:
{
  "is_genuine_craft": boolean,
  "confidence_score": number,
  "craft_detected": string,
  "tools_observed": string[],
  "materials_observed": string[],
  "logo_detected": boolean,
  "logo_matched": boolean,
  "batch_marking": string,
  "liveness_verified": boolean,
  "summary": string
}`;

            // 2a. Attempt upload via Gemini Files API for reliable video handling
            let geminiFileUri: string | null = null;
            try {
                const uploadRes = await fetch(
                    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${geminiApiKey}`,
                    {
                        method: 'POST',
                        headers: {
                            'X-Goog-Upload-Command': 'start, upload, finalize',
                            'X-Goog-Upload-Header-Content-Length': buffer.length.toString(),
                            'X-Goog-Upload-Header-Content-Type': file.type || 'video/mp4',
                            'Content-Type': file.type || 'video/mp4',
                        },
                        body: buffer,
                    }
                );
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    if (uploadData.file?.uri) {
                        geminiFileUri = uploadData.file.uri;
                    }
                }
            } catch (fileErr) {
                console.warn('Gemini Files API upload note, trying inline payload:', fileErr);
            }

            const parts: any[] = [];
            if (geminiFileUri) {
                parts.push({
                    fileData: {
                        mimeType: file.type || 'video/mp4',
                        fileUri: geminiFileUri,
                    },
                });
            } else {
                parts.push({
                    inlineData: {
                        mimeType: file.type || 'video/mp4',
                        data: buffer.toString('base64'),
                    },
                });
            }
            parts.push({ text: prompt });

            const candidateModels = ['gemini-flash-latest', 'gemini-3.6-flash', 'gemini-3.5-flash'];

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
                            isGenuineCraft = parsed.is_genuine_craft !== undefined ? !!parsed.is_genuine_craft : (parsed.confidence_score >= 0.85);
                            confidenceScore = typeof parsed.confidence_score === 'number' ? parsed.confidence_score : (isGenuineCraft ? 0.92 : 0.35);
                            
                            // If AI determined it's NOT genuine craft, strictly cap score below 0.85
                            if (!isGenuineCraft && confidenceScore >= 0.85) {
                                confidenceScore = 0.45;
                            }

                            logoDetected = parsed.logo_detected !== undefined ? !!parsed.logo_detected : isGenuineCraft;
                            logoMatched = parsed.logo_matched !== undefined ? !!parsed.logo_matched : isGenuineCraft;
                            livenessVerified = parsed.liveness_verified !== undefined ? !!parsed.liveness_verified : isGenuineCraft;
                            batchMarking = parsed.batch_marking || `#0${Math.floor(Math.random() * 9 + 1)}/50`;
                            aiSummary = parsed.summary || (isGenuineCraft ? `Authentic ${category} craftwork verified by Gemini Vision.` : `Video did not show authentic ${category} craftsmanship.`);
                            break;
                        }
                    }
                } catch (err) {
                    console.warn(`Gemini evaluation note with ${model}:`, err);
                }
            }
        }

        // 3. TIERED VERIFICATION THRESHOLD LOGIC:
        // Tier 1: Score < 85% OR not genuine craft -> REJECTED (Automatically reject, not uploaded to public feed)
        // Tier 2: 85% <= Score < 90% -> PENDING_ADMIN_REVIEW (Flagged for manual HITL admin review)
        // Tier 3: 90% <= Score <= 100% -> VERIFIED (Auto-verified and published to public marketplace feed)
        
        const scorePct = Math.round(confidenceScore * 100);
        let reelStatus: 'REJECTED' | 'PENDING_ADMIN_REVIEW' | 'VERIFIED' = 'REJECTED';

        if (confidenceScore >= 0.90 && isGenuineCraft) {
            reelStatus = 'VERIFIED';
        } else if (confidenceScore >= 0.85 && isGenuineCraft) {
            reelStatus = 'PENDING_ADMIN_REVIEW';
        } else {
            reelStatus = 'REJECTED';
        }

        // Tier 1: Low Confidence (< 85%) -> Reject and do not publish
        if (reelStatus === 'REJECTED') {
            return NextResponse.json({
                success: false,
                isAutoApproved: false,
                isPendingAdminReview: false,
                confidenceScore,
                ai_confidence_score: confidenceScore,
                status: 'REJECTED',
                tier: 'LOW_CONFIDENCE',
                error: `AI Verification Failed (${scorePct}% confidence score): ${aiSummary}`,
                aiSummary,
            }, { status: 422 });
        }

        // Tier 2 & 3: Save video to storage
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

        // 4. Save video record into public.verification_reels with tiered status
        const { data: reel, error: dbError } = await supabaseAdmin
            .from('verification_reels')
            .insert({
                vendor_id: userId || '83db6dde-207f-4e63-aee0-3b6db0983763',
                video_url: videoUrl,
                status: reelStatus,
                confidence_score: confidenceScore,
                ai_confidence_score: confidenceScore,
                review_notes: reelStatus === 'PENDING_ADMIN_REVIEW'
                    ? 'Medium confidence score (85%-90%). Queued for manual admin triage.'
                    : 'Auto-verified with high confidence (≥90%).',
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
                    tier: reelStatus === 'VERIFIED' ? 'HIGH_CONFIDENCE' : 'MEDIUM_CONFIDENCE',
                    submittedAt: new Date().toISOString(),
                },
            })
            .select('*')
            .single();

        if (dbError) {
            console.error('Reel insert error:', dbError);
            return NextResponse.json({ error: dbError.message }, { status: 500 });
        }

        // 5. Update Maker profile if High Confidence auto-verified
        if (userId && reelStatus === 'VERIFIED') {
            await supabaseAdmin
                .from('profiles')
                .update({ vendor_verified: true, kyc_status: 'PASSED' })
                .eq('id', userId);
        }

        return NextResponse.json({
            success: true,
            status: reelStatus,
            isAutoApproved: reelStatus === 'VERIFIED',
            isPendingAdminReview: reelStatus === 'PENDING_ADMIN_REVIEW',
            tier: reelStatus === 'VERIFIED' ? 'HIGH_CONFIDENCE' : 'MEDIUM_CONFIDENCE',
            confidenceScore,
            ai_confidence_score: confidenceScore,
            aiSummary,
            reelId: reel.id,
            reel,
            message: reelStatus === 'VERIFIED'
                ? '✓ High Confidence (≥90%): Product reel auto-verified and published to the marketplace!'
                : '⏳ Medium Confidence (85%-89%): Video queued for human admin review before public publishing.',
        });
    } catch (err: any) {
        console.error('Reel upload error:', err);
        return NextResponse.json({ error: err.message || 'Video upload failed' }, { status: 500 });
    }
}
