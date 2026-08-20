import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const { email, password, fullName, isVendor } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
        }

        const cleanEmail = email.trim().toLowerCase();
        let userId: string | null = null;

        // 1. Try to create the user with admin API
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: cleanEmail,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: fullName || 'Artisan User',
                is_vendor: !!isVendor,
            },
        });

        if (createError) {
            const isExisting =
                createError.message?.toLowerCase().includes('already registered') ||
                createError.message?.toLowerCase().includes('already exists') ||
                (createError as any).status === 422;

            if (isExisting) {
                // Find existing user across all pages
                let foundUser: any = null;
                let page = 1;
                while (!foundUser && page <= 5) {
                    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({
                        page,
                        perPage: 100,
                    });
                    if (!usersData?.users || usersData.users.length === 0) break;
                    foundUser = usersData.users.find(
                        (u: any) => u.email?.toLowerCase() === cleanEmail
                    );
                    page++;
                }

                if (foundUser) {
                    userId = foundUser.id;
                    // Update password and confirm user so they can sign in immediately
                    await supabaseAdmin.auth.admin.updateUserById(foundUser.id, {
                        password,
                        email_confirm: true,
                        user_metadata: {
                            full_name: fullName || foundUser.user_metadata?.full_name || 'Artisan User',
                            is_vendor: isVendor !== undefined ? !!isVendor : foundUser.user_metadata?.is_vendor,
                        },
                    });
                } else {
                    return NextResponse.json({
                        success: true,
                        message: 'Account is registered. Please sign in with your credentials.',
                        isExistingUser: true,
                    });
                }
            } else {
                return NextResponse.json({
                    success: false,
                    error: createError.message || 'Could not create account.',
                }, { status: 200 });
            }
        } else if (newUser?.user) {
            userId = newUser.user.id;
        }

        // 2. Ensure profile row exists and is populated
        if (userId) {
            await supabaseAdmin
                .from('profiles')
                .upsert({
                    id: userId,
                    full_name: fullName || 'Artisan User',
                    is_vendor: !!isVendor,
                    vendor_verified: !!isVendor,
                    kyc_status: isVendor ? 'PASSED' : 'NONE',
                }, { onConflict: 'id' });
        }

        return NextResponse.json({
            success: true,
            userId,
            message: 'User registered and confirmed successfully.',
        });
    } catch (err: any) {
        console.error('Registration API error:', err);
        return NextResponse.json({
            success: false,
            error: err.message || 'Registration failed',
        }, { status: 200 });
    }
}
