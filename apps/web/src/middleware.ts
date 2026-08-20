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

    // Protected route groups: (buyer), (vendor), (admin)
    // These map to /messages, /orders, /projects (buyer),
    //               /dashboard, /verification (vendor),
    //               /triage (admin)
    const protectedPrefixes = [
        '/profile',
        '/messages',
        '/orders',
        '/projects',
        '/dashboard',
        '/verification',
        '/triage',
    ];

    const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

    // Redirect unauthenticated users to /login
    if (isProtected && !user) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Admin Route Protection: Block non-admin access to /triage
    if (pathname.startsWith('/triage') && user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, is_vendor')
            .eq('id', user.id)
            .single();

        // Check if user has admin claim or role
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