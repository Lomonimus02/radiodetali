import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE_NAME = "admin_session";

/**
 * Проверяет валидность сессии
 */
function isValidSession(sessionCookie: string | undefined): boolean {
  if (!sessionCookie) {
    return false;
  }

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
  const { pathname } = request.nextUrl;

  // Проверяем только маршруты /admin
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const isAuthenticated = isValidSession(sessionCookie);

  // Если пользователь идёт на страницу логина
  if (pathname === "/admin/login") {
    // Если уже авторизован — редирект в админку
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    // Иначе — пускаем на страницу логина
    return NextResponse.next();
  }

  // Для всех остальных страниц /admin/*
  // Если не авторизован — редирект на страницу логина
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // Авторизован — пускаем дальше
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
