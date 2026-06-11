import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE_NAME = "admin_session";

function isValidSession(sessionCookie: string | undefined): boolean {
  if (!sessionCookie) return false;
  try {
    const session = JSON.parse(
      Buffer.from(sessionCookie, "base64").toString("utf-8")
    );
    return session.authenticated === true;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname, hostname } = url;

  // 1. www → non-www (301)
  if (hostname.startsWith("www.")) {
    url.hostname = hostname.slice(4);
    return NextResponse.redirect(url, { status: 301 });
  }

  // 2. Убираем множественные слеши и trailing slash (301)
  // Заменяем повторные // на один /
  const cleanedPath = pathname.replace(/\/{2,}/g, "/");
  // Убираем trailing slash (кроме корня)
  const finalPath = cleanedPath.length > 1 && cleanedPath.endsWith("/")
    ? cleanedPath.slice(0, -1)
    : cleanedPath;

  if (finalPath !== pathname) {
    url.pathname = finalPath;
    return NextResponse.redirect(url, { status: 301 });
  }

  // 3. Авторизация в /admin
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const isAuthenticated = isValidSession(sessionCookie);

  if (pathname === "/admin/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|otf|css|js)).*)",
  ],
};
