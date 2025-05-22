import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";
import { User } from "@/types/auth";

// Маршруты, которые требуют аутентификации
const PROTECTED_ROUTES = [
  "/dashboard",
  "/profile",
  "/settings",
  // Добавь сюда свои защищенные маршруты
];

// Маршруты, которые требуют админских прав
const ADMIN_ROUTES = ["/admin", "/admin/users", "/admin/settings"];

// Маршруты, к которым не должны иметь доступ уже авторизованные пользователи
const AUTH_ROUTES = ["/auth/login", "/auth/register", "/auth/forgot-password"];

// Публичные маршруты, которые всегда доступны
const PUBLIC_ROUTES = [
  "/",
  "/about",
  "/contact",
  // Добавь сюда публичные маршруты
];

interface JWTPayload {
  id: number;
  email: string;
  is_admin: boolean;
  sub: string;
  exp: number;
  iat: number;
  jti: string;
}

// Функция для проверки валидности и декодирования JWT токена
function verifyAndDecodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwtDecode<JWTPayload>(token);

    // Проверяем, не истек ли токен
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp < currentTime) {
      console.log("Token expired");
      return null;
    }

    return decoded;
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
}

// Функция для получения пользователя из токена
function getUserFromToken(token: string): User | null {
  const decoded = verifyAndDecodeToken(token);
  if (!decoded) return null;

  return {
    name: decoded.email.split("@")[0], // Используем часть email как имя, можно изменить
    email: decoded.email,
    is_admin: decoded.is_admin,
  };
}

// Функция для проверки, требует ли маршрут защиты
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

// Функция для проверки, является ли маршрут админским
function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some((route) => pathname.startsWith(route));
}

// Функция для проверки, является ли маршрут авторизационным
function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

// Функция для проверки, является ли маршрут публичным
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log(`Middleware processing: ${pathname}`);

  // Получаем токены из cookies
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const sessionId = request.cookies.get("session_id")?.value;

  console.log("Auth cookies present:", {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    hasSessionId: !!sessionId,
  });

  // Проверяем пользователя из access токена
  const user = accessToken ? getUserFromToken(accessToken) : null;
  const isAuthenticated = !!user;

  console.log("User authentication status:", {
    isAuthenticated,
    userEmail: user?.email,
    isAdmin: user?.is_admin,
  });

  // Если это публичный маршрут, разрешаем доступ
  if (isPublicRoute(pathname)) {
    console.log("Public route, allowing access");
    return NextResponse.next();
  }

  // Если пользователь пытается попасть на авторизационные страницы, но уже авторизован
  if (isAuthRoute(pathname) && isAuthenticated) {
    console.log(
      "Authenticated user trying to access auth route, redirecting to dashboard",
    );
    const redirectUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Если это защищенный маршрут, но пользователь не авторизован
  if (isProtectedRoute(pathname) && !isAuthenticated) {
    console.log(
      "Unauthenticated user trying to access protected route, redirecting to login",
    );
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname); // Сохраняем куда пользователь хотел попасть
    return NextResponse.redirect(loginUrl);
  }

  // Если это админский маршрут, но пользователь не админ
  if (isAdminRoute(pathname)) {
    if (!isAuthenticated) {
      console.log(
        "Unauthenticated user trying to access admin route, redirecting to login",
      );
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!user.is_admin) {
      console.log(
        "Non-admin user trying to access admin route, redirecting to dashboard",
      );
      const dashboardUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Если дошли до сюда, но это не публичный маршрут и пользователь не авторизован
  if (!isAuthenticated && !isAuthRoute(pathname)) {
    console.log(
      "Unauthenticated user trying to access non-public route, redirecting to login",
    );
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Создаем response и добавляем пользовательские заголовки для использования в серверных компонентах
  const response = NextResponse.next();

  if (user) {
    // Добавляем информацию о пользователе в заголовки для серверных компонентов
    response.headers.set("x-user-email", user.email);
    response.headers.set("x-user-is-admin", user.is_admin.toString());
    response.headers.set("x-user-authenticated", "true");
  } else {
    response.headers.set("x-user-authenticated", "false");
  }

  console.log("Middleware completed, allowing access");
  return response;
}

// Настройка матчера - определяет на каких маршрутах запускать middleware
export const config = {
  matcher: [
    /*
     * Запускаем middleware на всех маршрутах кроме:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - публичных ассетов в папке public
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
