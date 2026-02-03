"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// ============================================================================
// ТИПЫ
// ============================================================================

export type LoginResult =
  | { success: true }
  | { success: false; error: string };

// ============================================================================
// КОНСТАНТЫ
// ============================================================================

const ADMIN_COOKIE_NAME = "admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 дней

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Авторизация администратора
 */
export async function loginAdmin(password: string): Promise<LoginResult> {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error("ADMIN_PASSWORD не установлен в переменных окружения");
    return { success: false, error: "Ошибка конфигурации сервера" };
  }

  if (password !== adminPassword) {
    return { success: false, error: "Неверный пароль" };
  }

  // Создаём простую сессию (в продакшене используйте JWT или другой безопасный метод)
  const sessionToken = Buffer.from(
    JSON.stringify({ 
      authenticated: true, 
      timestamp: Date.now() 
    })
  ).toString("base64");

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return { success: true };
}

/**
 * Выход из админки
 */
export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  redirect("/admin/login");
}

/**
 * Проверка авторизации (для использования в серверных компонентах)
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);
  
  if (!sessionCookie?.value) {
    return false;
  }

  try {
    const session = JSON.parse(
      Buffer.from(sessionCookie.value, "base64").toString("utf-8")
    );
    return session.authenticated === true;
  } catch {
    return false;
  }
}
