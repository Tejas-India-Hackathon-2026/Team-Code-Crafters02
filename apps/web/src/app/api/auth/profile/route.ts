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
        if (isVendor !== undefined) profileUpdate.is_vendor = !!isVendor;

        // Check if row already exists
        const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        // Strict Artisan Verification Rule:
        // An artisan is verified ONLY if BOTH a brand logo (avatar_url) and workshop location are present!
        const finalLogo = avatarUrl || existingProfile?.avatar_url;
        const finalLocation = location || existingProfile?.user_metadata?.location || existingProfile?.geo_location;

        const isVerifiedArtisan = isVendor !== false
            ? !!(finalLogo && finalLocation && finalLocation.toString().trim().length > 0)
            : false;

        profileUpdate.vendor_verified = isVerifiedArtisan;
        profileUpdate.kyc_status = isVerifiedArtisan ? 'PASSED' : 'PENDING';

        // Add PostGIS point if coordinates are provided
        if (latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null) {
            profileUpdate.geo_location = `POINT(${longitude} ${latitude})`;
        }

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
        metadataUpdate.vendor_verified = isVerifiedArtisan;
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
