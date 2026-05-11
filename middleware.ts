import { NextResponse, type NextRequest } from "next/server";

// ── Auth middleware ──
//
// Critical guarantee: this middleware NEVER redirects /login. The dashboard
// layout is the single source of truth that *validates* the Supabase cookie
// via getUser(). Middleware only checks cookie *presence* on protected
// routes, so if a stale/invalid cookie is sent the layout redirects to
// /login once and we stop there.
//
// Previously a file named `proxy.ts` existed but Next.js only picks up
// `middleware.ts` — the proxy never ran, while an older cached
// middleware.ts edge function lingered on Vercel and looped /login →
// /dashboard against the layout's /dashboard → /login. This file
// supersedes that cached edge function on the next deploy.

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/motion-studio",
  "/templates",
  "/produce",
  "/ad-studio",
  "/copy-studio",
  "/campaigns",
  "/campaign-planner",
  "/localization",
  "/personas",
  "/settings",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const hasSupabase = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));
  const demoEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO === "true";
  const hasDemo =
    demoEnabled && request.cookies.get("demo-session")?.value === "true";

  if (!hasSupabase && !hasDemo) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on everything except Next internals + obvious static files
    "/((?!_next/static|_next/image|favicon.ico|fonts|images|renders|lottie).*)",
  ],
};
