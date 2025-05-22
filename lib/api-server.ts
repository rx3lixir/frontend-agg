import { cookies, headers } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { User } from "@/types/auth";
import { redirect } from "next/navigation";

interface JWTPayload {
  id: number;
  email: string;
  is_admin: boolean;
  sub: string;
  exp: number;
  iat: number;
  jti: string;
}

/**
 * Получает пользователя из JWT токена
 * Работает только на сервере
 */
export async function getServerUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    if (!accessToken) {
      console.log("No access token found in cookies");
      return null;
    }

    // Декодируем токен
    const decoded = jwtDecode<JWTPayload>(accessToken);

    // Проверяем срок действия токена
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp < currentTime) {
      console.log("Access token expired");
      return null;
    }

    // Возвращаем пользователя
    const user: User = {
      name: decoded.email.split("@")[0], // Можно изменить логику получения имени
      email: decoded.email,
      is_admin: decoded.is_admin,
    };

    console.log("Server user retrieved:", user.email);
    return user;
  } catch (error) {
    console.error("Error getting server user:", error);
    return null;
  }
}

/**
 * Получает пользователя из заголовков (установленных middleware)
 * Альтернативный способ для серверных компонентов
 */
export async function getUserFromHeaders(): Promise<User | null> {
  try {
    const headersList = await headers();
    const isAuthenticated = headersList.get("x-user-authenticated") === "true";

    if (!isAuthenticated) {
      return null;
    }

    const email = headersList.get("x-user-email");
    const isAdmin = headersList.get("x-user-is-admin") === "true";

    if (!email) {
      return null;
    }

    return {
      name: email.split("@")[0],
      email,
      is_admin: isAdmin,
    };
  } catch (error) {
    console.error("Error getting user from headers:", error);
    return null;
  }
}

/**
 * Проверяет аутентификацию на сервере
 * Если пользователь не авторизован, перенаправляет на страницу входа
 */
export async function requireAuth(): Promise<User> {
  const user = await getServerUser();

  if (!user) {
    console.log("User not authenticated, redirecting to login");
    redirect("/auth/login");
  }

  return user;
}

/**
 * Проверяет админские права на сервере
 * Если пользователь не админ, перенаправляет на главную страницу
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireAuth(); // Сначала проверяем аутентификацию

  if (!user.is_admin) {
    console.log("User is not admin, redirecting to dashboard");
    redirect("/dashboard");
  }

  return user;
}

/**
 * Проверяет, авторизован ли пользователь на сервере
 * Не делает редирект, просто возвращает булево значение
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getServerUser();
  return !!user;
}

/**
 * Проверяет, является ли пользователь админом на сервере
 * Не делает редирект, просто возвращает булево значение
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getServerUser();
  return user?.is_admin ?? false;
}

/**
 * Получает информацию о сессии из cookies
 */
export async function getSessionInfo(): Promise<{
  sessionId: string | null;
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
}> {
  try {
    const cookieStore = await cookies();

    return {
      sessionId: cookieStore.get("session_id")?.value ?? null,
      hasAccessToken: !!cookieStore.get("access_token")?.value,
      hasRefreshToken: !!cookieStore.get("refresh_token")?.value,
    };
  } catch (error) {
    console.error("Error getting session info:", error);
    return {
      sessionId: null,
      hasAccessToken: false,
      hasRefreshToken: false,
    };
  }
}
