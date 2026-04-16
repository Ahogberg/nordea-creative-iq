import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/auth/callback'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware entirely for API routes, static files, and Next internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/fonts/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/lottie/') ||
    pathname.startsWith('/renders/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured, let everything through
  if (!supabaseUrl || !supabaseKey) {
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Use getSession() instead of getUser() — it reads from cookies locally
  // without making a network request to Supabase, avoiding Edge timeout.
  let session = null;
  try {
    const { data } = await supabase.auth.getSession();
    session = data.session;
  } catch {
    // Fail open
  }

  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(session ? '/dashboard' : '/login', request.url)
    );
  }

  if (!session && !PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
