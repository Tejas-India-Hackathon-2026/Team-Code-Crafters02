import { createClient } from './supabaseClient';

export interface KarigarUser {
    id: string;
    email?: string;
    user_metadata?: {
        full_name?: string;
        is_vendor?: boolean;
        avatar_url?: string;
        location?: string;
        [key: string]: any;
    };
    [key: string]: any;
}

/**
 * Stores authentication session and user state in localStorage for reliable hydration
 */
export function storeKarigarSession(session: any, user: any) {
    if (typeof window === 'undefined') return;
    try {
        if (session) {
            localStorage.setItem('karigar_auth_session', JSON.stringify(session));
        }
        if (user) {
            localStorage.setItem('karigar_auth_user', JSON.stringify(user));
        }
    } catch (e) {
        console.warn('Failed to store session in localStorage:', e);
    }
}

/**
 * Clears all local auth cache on logout
 */
export function clearKarigarAuth() {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem('karigar_auth_session');
        localStorage.removeItem('karigar_auth_user');
    } catch (e) {}
}

/**
 * Bulletproof tri-layer user resolver:
 * 1. Checks Supabase local session
 * 2. Checks Supabase getUser() API
 * 3. Checks localStorage session backup and re-hydrates Supabase setSession()
 * 4. Checks localStorage user backup
 */
export async function getKarigarAuthUser(supabaseInstance?: any): Promise<KarigarUser | null> {
    const supabase = supabaseInstance || createClient();

    // Layer 1: Supabase client session (fast memory/cookie)
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            storeKarigarSession(session, session.user);
            return session.user;
        }
    } catch (e) {}

    // Layer 2: Supabase getUser() network validation
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            storeKarigarSession(null, user);
            return user;
        }
    } catch (e) {}

    // Layer 3: LocalStorage backup & session re-hydration
    if (typeof window !== 'undefined') {
        try {
            const rawSession = localStorage.getItem('karigar_auth_session');
            if (rawSession) {
                const sess = JSON.parse(rawSession);
                if (sess?.access_token && sess?.refresh_token) {
                    const { data: restored } = await supabase.auth.setSession({
                        access_token: sess.access_token,
                        refresh_token: sess.refresh_token,
                    });
                    if (restored?.user) {
                        return restored.user;
                    }
                }
            }
        } catch (e) {}

        // Layer 4: LocalStorage cached user profile
        try {
            const rawUser = localStorage.getItem('karigar_auth_user');
            if (rawUser) {
                const parsed = JSON.parse(rawUser);
                if (parsed?.id) return parsed;
            }
        } catch (e) {}
    }

    return null;
}
