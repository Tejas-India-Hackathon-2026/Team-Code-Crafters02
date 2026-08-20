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
        const formData = await request.formData();
        const file = formData.get('logo') as File | null;
        const email = formData.get('email') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'Logo file is required' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileExt = (file.name.split('.').pop() || 'png').toLowerCase();
        const cleanEmail = (email || 'artisan').replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `logo_${cleanEmail}_${Date.now()}.${fileExt}`;

        let logoUrl = '';

        // 1. Try uploading to Supabase Storage 'brand-logos' bucket
        try {
            // Check / create bucket
            const { data: buckets } = await supabaseAdmin.storage.listBuckets();
            const exists = buckets?.some((b) => b.name === 'brand-logos');
            if (!exists) {
                await supabaseAdmin.storage.createBucket('brand-logos', { public: true });
            }

            const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                .from('brand-logos')
                .upload(fileName, buffer, {
                    contentType: file.type || 'image/png',
                    upsert: true,
                });

            if (!uploadError && uploadData) {
                const { data: publicUrlData } = supabaseAdmin.storage
                    .from('brand-logos')
                    .getPublicUrl(fileName);
                logoUrl = publicUrlData.publicUrl;
            }
        } catch (storageErr) {
            console.warn('Supabase storage upload error:', storageErr);
        }

        // 2. If Supabase storage is not reachable, save directly to local Next.js public directory
        // NEVER return base64 Data URLs because base64 strings bloat browser JWT cookies to >100KB, causing HTTP 431!
        if (!logoUrl) {
            const publicDir = path.join(process.cwd(), 'public', 'uploads', 'logos');
            if (!fs.existsSync(publicDir)) {
                fs.mkdirSync(publicDir, { recursive: true });
            }
            const filePath = path.join(publicDir, fileName);
            fs.writeFileSync(filePath, buffer);
            logoUrl = `/uploads/logos/${fileName}`;
        }

        return NextResponse.json({ success: true, logoUrl });
    } catch (err: any) {
        console.error('Logo upload error:', err);
        return NextResponse.json({ error: err.message || 'Logo upload failed' }, { status: 500 });
    }
}
