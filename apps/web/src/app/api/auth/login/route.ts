import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email) {
            return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
        }

        const cleanEmail = email.trim().toLowerCase();

        // 1. First find if user exists in auth.users
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

        if (!foundUser) {
            return NextResponse.json({
                success: false,
                notFound: true,
                error: 'No account found with this email address. Please switch to "Create Account" to register.',
            }, { status: 200 });
        }

        // 2. If user email is unconfirmed, auto-confirm it now so they are not blocked
        if (!foundUser.email_confirmed_at) {
            await supabaseAdmin.auth.admin.updateUserById(foundUser.id, {
                email_confirm: true,
            });
        }

        // 3. Fetch profile to check vendor/buyer status
        const { data: prof } = await supabaseAdmin
            .from('profiles')
            .select('is_vendor, full_name')
            .eq('id', foundUser.id)
            .maybeSingle();

        return NextResponse.json({
            success: true,
            user: { id: foundUser.id, email: foundUser.email },
            isVendor: !!prof?.is_vendor,
            profile: prof,
            message: 'User confirmed. Ready for sign-in.',
        });
    } catch (err: any) {
        console.error('Login API error:', err);
        return NextResponse.json({
            success: false,
            error: err.message || 'Login verification failed. Please try again.',
        }, { status: 200 });
    }
}
