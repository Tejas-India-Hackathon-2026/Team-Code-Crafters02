import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // 1. If user is already logged in and visits /login or /auth, redirect to requested next route or artisan/profile
    if ((pathname === '/login' || pathname === '/auth') && user) {
        const nextUrl = request.nextUrl.searchParams.get('next');
        if (nextUrl && nextUrl.startsWith('/') && !nextUrl.startsWith('/login') && !nextUrl.startsWith('/auth')) {
            return NextResponse.redirect(new URL(nextUrl, request.url));
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('is_vendor')
            .eq('id', user.id)
            .maybeSingle();

        const dest = profile?.is_vendor ? '/artisan' : '/profile';
        return NextResponse.redirect(new URL(dest, request.url));
    }

    // 2. Admin Route Protection: Block non-admin access to /triage
    if (pathname.startsWith('/triage') && user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, is_vendor')
            .eq('id', user.id)
            .maybeSingle();

        if (!profile || profile.role !== 'admin') {
            return new NextResponse('HTTP 403 Forbidden: Admin claims required for triage.', { status: 403 });
        }
    }

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};