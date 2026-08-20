import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const { email, token, fullName, isVendor, avatarUrl } = await request.json();

        if (!email || !token) {
            return NextResponse.json({ error: 'Email and verification token are required' }, { status: 400 });
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanToken = token.trim();

        // 1. Verify OTP with Supabase Auth
        const { data: authData, error: verifyError } = await supabaseAdmin.auth.verifyOtp({
            email: cleanEmail,
            token: cleanToken,
            type: 'signup',
        });

        let userId = authData?.user?.id;

        if (verifyError) {
            // Also try 'email' type if signup type is not matched
            const { data: authDataEmail, error: emailVerifyError } = await supabaseAdmin.auth.verifyOtp({
                email: cleanEmail,
                token: cleanToken,
                type: 'email',
            });

            if (emailVerifyError) {
                // If standard OTP verification failed, check if token matches or user exists
                return NextResponse.json({ error: emailVerifyError.message || 'Invalid or expired verification code.' }, { status: 400 });
            }
            userId = authDataEmail?.user?.id;
        }

        // 2. Fetch User if ID is not in session
        if (!userId) {
            const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
            const user = usersData?.users?.find((u: any) => u.email?.toLowerCase() === cleanEmail);
            if (user) {
                userId = user.id;
                // Mark email as confirmed in auth.users
                await supabaseAdmin.auth.admin.updateUserById(user.id, {
                    email_confirm: true,
                });
            }
        }

        // 3. Provision / update profile in public.profiles with the mandatory logo
        if (userId) {
            await supabaseAdmin
                .from('profiles')
                .upsert({
                    id: userId,
                    full_name: fullName || 'Artisan User',
                    avatar_url: avatarUrl || '',
                    is_vendor: !!isVendor,
                    vendor_verified: false,
                    kyc_status: 'NONE',
                }, { onConflict: 'id' });
        }

        return NextResponse.json({
            success: true,
            userId,
            message: 'Email verified successfully. Account is now active.',
        });
    } catch (err: any) {
        console.error('OTP verification error:', err);
        return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 500 });
    }
}
