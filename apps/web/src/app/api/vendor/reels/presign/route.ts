import { NextResponse } from 'next/server';
import { createServerSideClient } from '../../../../../lib/supabaseServer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'mock_key',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'mock_secret',
    },
});

export async function POST(request: Request) {
    try {
        const supabase = await createServerSideClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { fileName, fileType, fileSizeBytes, productTitle, category, price, description } = await request.json();

        // Enforce 100 MB limit and MP4/QuickTime/WebM MIME types
        const MAX_BYTES = 100 * 1024 * 1024;
        const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

        if (!ALLOWED_TYPES.includes(fileType)) {
            return NextResponse.json({ error: 'Unsupported format. Use MP4 or MOV.' }, { status: 400 });
        }

        if (fileSizeBytes > MAX_BYTES) {
            return NextResponse.json({ error: 'File size exceeds 100 MB limit.' }, { status: 400 });
        }

        const reelKey = `vendors/${user.id}/reels/${Date.now()}-${fileName}`;

        // Insert PENDING record into Supabase with category and product metadata
        const { data: reel, error: dbError } = await supabase
            .from('verification_reels')
            .insert({
                vendor_id: user.id,
                video_url: `https://${process.env.AWS_S3_BUCKET || 'maker-marketplace-assets'}.s3.amazonaws.com/${reelKey}`,
                status: 'PENDING',
                extracted_metadata: {
                    productTitle: productTitle || 'Handmade Craft',
                    category: category || 'woodworking',
                    price: price || 0,
                    description: description || '',
                    submittedAt: new Date().toISOString(),
                },
            })
            .select('id')
            .single();

        if (dbError) throw dbError;

        // Generate 60-second S3 presigned PUT URL
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET || 'maker-marketplace-assets',
            Key: reelKey,
            ContentType: fileType,
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

        return NextResponse.json({
            uploadUrl,
            reelId: reel.id,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}