import { NextResponse, type NextRequest } from "next/server";
import { AUTH_STORAGE_KEY } from "@/lib/supabase/auth-storage";

function decodeCookieValue(value: string) {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    return decodeURIComponent(escape(atob(padded)));
  } catch {
    return null;
  }
}

function hasUsableSession(request: NextRequest) {
  const cookieValue = request.cookies.get(AUTH_STORAGE_KEY)?.value;
  if (!cookieValue) return false;

  const decoded = decodeCookieValue(cookieValue);
  if (!decoded) return false;

  try {
    const session = JSON.parse(decoded) as { access_token?: string; expires_at?: number };
    if (!session.access_token) return false;
    if (typeof session.expires_at === "number") {
      return session.expires_at > Math.floor(Date.now() / 1000);
    }
    return true;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  if (!hasUsableSession(request)) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
