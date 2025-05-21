import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { logDebug, logInfo, logWarn } from "@/lib/logger";

// Хук для защиты маршрутов, требующих аутентификации
export const useAuthGuard = (redirectTo: string = "/auth/login") => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Если загрузка завершена и пользователь не аутентифицирован,
    // перенаправляем на страницу входа
    if (!isLoading) {
      if (!isAuthenticated) {
        logWarn("Access denied: User not authenticated", {
          redirectingTo: redirectTo,
          currentPath:
            typeof window !== "undefined"
              ? window.location.pathname
              : "unknown",
        });

        router.push(redirectTo);
      } else {
        logDebug("Auth guard passed", {
          user: user?.email || "unknown",
          currentPath:
            typeof window !== "undefined"
              ? window.location.pathname
              : "unknown",
        });
      }
    }
  }, [isAuthenticated, isLoading, router, redirectTo, user]);

  return { isAuthenticated, isLoading };
};

// Хук для защиты маршрутов, требующих прав администратора
export const useAdminGuard = (redirectTo: string = "/") => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Если загрузка завершена и пользователь не администратор,
    // перенаправляем на указанный маршрут
    if (!isLoading) {
      const isAdmin = user?.is_admin || false;

      if (!user || !isAdmin) {
        logWarn("Access denied: Admin privileges required", {
          redirectingTo: redirectTo,
          currentPath:
            typeof window !== "undefined"
              ? window.location.pathname
              : "unknown",
          userEmail: user?.email || "not logged in",
          isAdmin,
        });

        router.push(redirectTo);
      } else {
        logInfo("Admin guard passed", {
          user: user.email,
          currentPath:
            typeof window !== "undefined"
              ? window.location.pathname
              : "unknown",
        });
      }
    }
  }, [user, isLoading, router, redirectTo]);

  return { isAdmin: user?.is_admin, isLoading };
};

// Новый хук для предотвращения доступа к страницам авторизации уже аутентифицированных пользователей
export const useAuthRedirect = (redirectTo: string = "/") => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Если пользователь уже аутентифицирован, перенаправляем его
    // Например, для предотвращения доступа к страницам логина/регистрации
    if (!isLoading && isAuthenticated) {
      logInfo("Authenticated user redirected from auth page", {
        redirectingTo: redirectTo,
        currentPath:
          typeof window !== "undefined" ? window.location.pathname : "unknown",
      });

      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return { isAuthenticated, isLoading };
};
