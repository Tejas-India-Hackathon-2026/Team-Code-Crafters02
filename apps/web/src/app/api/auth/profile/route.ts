import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            userId,
            fullName,
            avatarUrl,
            isVendor,
            vendorVerified,
            kycStatus,
            craftCategories,
            craftCategory,
            location,
            taxId,
            latitude,
            longitude,
        } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Build database update object containing ONLY provided fields
        const profileUpdate: Record<string, any> = {};

        if (fullName !== undefined) profileUpdate.full_name = fullName;
        if (avatarUrl !== undefined) profileUpdate.avatar_url = avatarUrl;
        if (isVendor !== undefined) {
            profileUpdate.is_vendor = !!isVendor;
            if (isVendor) {
                // If switching to vendor or registering, ensure vendor_verified is true
                profileUpdate.vendor_verified = true;
            }
        }
        if (vendorVerified !== undefined) profileUpdate.vendor_verified = !!vendorVerified;

        // Ensure valid enum value for Postgres kyc_status_enum ('NONE' | 'PENDING' | 'PASSED')
        if (kycStatus !== undefined) {
            let sanitizedKyc: 'NONE' | 'PENDING' | 'PASSED' = 'NONE';
            if (kycStatus === 'APPROVED' || kycStatus === 'PASSED' || kycStatus === true) {
                sanitizedKyc = 'PASSED';
            } else if (kycStatus === 'PENDING') {
                sanitizedKyc = 'PENDING';
            }
            profileUpdate.kyc_status = sanitizedKyc;
        } else if (isVendor) {
            profileUpdate.kyc_status = 'PASSED';
        }

        // Add PostGIS point if coordinates are provided
        if (latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null) {
            profileUpdate.geo_location = `POINT(${longitude} ${latitude})`;
        }

        // Check if row already exists
        const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        let updatedData = null;

        if (existingProfile) {
            // Surgical UPDATE preserving all existing fields (like avatar_url, vendor_verified)
            const { data, error } = await supabaseAdmin
                .from('profiles')
                .update(profileUpdate)
                .eq('id', userId)
                .select('*')
                .single();

            if (error) {
                console.error('Admin profile update error:', error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
            updatedData = data;
        } else {
            // First time INSERT
            const { data, error } = await supabaseAdmin
                .from('profiles')
                .insert({
                    id: userId,
                    full_name: fullName || 'Artisan User',
                    is_vendor: !!isVendor,
                    vendor_verified: true,
                    kyc_status: 'PASSED',
                    ...profileUpdate,
                })
                .select('*')
                .single();

            if (error) {
                console.error('Admin profile insert error:', error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
            updatedData = data;
        }

        // Sync to auth.users user_metadata (small values only; avoid base64 cookie bloat)
        const metadataUpdate: Record<string, any> = {};
        if (fullName) metadataUpdate.full_name = fullName;
        if (avatarUrl && !avatarUrl.startsWith('data:')) {
            metadataUpdate.avatar_url = avatarUrl;
        }
        if (isVendor !== undefined) metadataUpdate.is_vendor = isVendor;
        metadataUpdate.vendor_verified = true;
        if (craftCategories) metadataUpdate.craft_categories = craftCategories;
        if (craftCategory) metadataUpdate.craft_category = craftCategory;
        if (location) metadataUpdate.location = location;
        if (taxId) metadataUpdate.tax_id = taxId;

        await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: metadataUpdate,
        });

        return NextResponse.json({ success: true, profile: updatedData });
    } catch (err: any) {
        console.error('Profile API error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
