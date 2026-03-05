import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Supabase session middleware.
 * - Refreshes the auth token on every request so Server Components can read the session.
 * - Redirects unauthenticated users to /signin (except public routes).
 * - Redirects already-authenticated users away from /signin.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — do NOT remove this getUser() call.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Public routes that don't require auth
  const isPublicRoute =
    pathname === "/signin" ||
    pathname === "/reset_pw" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname === "/favicon.ico";

  // Already logged in → redirect away from signin only.
  // /reset_pw must always be accessible — Supabase exchanges the recovery token
  // client-side from the URL hash, so the server initially sees no session.
  if (user && pathname === "/signin") {
    return NextResponse.redirect(new URL("/projects", request.url));
  }

  // Not logged in → redirect to signin
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and images.
     * This is the recommended pattern from the Supabase SSR docs.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
