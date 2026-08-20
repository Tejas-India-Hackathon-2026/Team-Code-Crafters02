import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
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

        // 3. Create SSR Supabase Client connected to cookies
        const cookieStore = await cookies();
        const supabaseSSR = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // Handled in Server Action / Route Handler
                        }
                    },
                },
            }
        );

        // 4. Attempt authentication with SSR client
        const { data: authData, error: authError } = await supabaseSSR.auth.signInWithPassword({
            email: cleanEmail,
            password: password,
        });

        if (authError) {
            return NextResponse.json({
                success: false,
                error: 'Invalid password. Please check your password or reset your credentials.',
            }, { status: 200 });
        }

        // 5. Fetch profile to check vendor/buyer status
        const { data: prof } = await supabaseAdmin
            .from('profiles')
            .select('is_vendor, full_name')
            .eq('id', foundUser.id)
            .maybeSingle();

        return NextResponse.json({
            success: true,
            session: authData.session,
            user: authData.user,
            isVendor: !!prof?.is_vendor,
            profile: prof,
            message: 'Signed in successfully.',
        });
    } catch (err: any) {
        console.error('Login API error:', err);
        return NextResponse.json({
            success: false,
            error: err.message || 'Login failed. Please try again.',
        }, { status: 200 });
    }
}
