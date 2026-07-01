import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const EASEBUZZ_CALLBACK_PATHS = new Set([
  "/payment/success",
  "/payment/failed",
]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (EASEBUZZ_CALLBACK_PATHS.has(pathname)) {
    const hasEasebuzzParams =
      request.method === "POST" ||
      request.nextUrl.searchParams.has("hash") ||
      request.nextUrl.searchParams.has("txnid");

    if (hasEasebuzzParams) {
      const apiPath =
        pathname === "/payment/success"
          ? "/api/payments/easebuzz/success"
          : "/api/payments/easebuzz/failed";
      return NextResponse.rewrite(new URL(apiPath, request.url));
    }
  }

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

  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
