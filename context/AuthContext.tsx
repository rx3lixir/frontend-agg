"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Session, User, AuthContextType } from "@/types/auth";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api-client";
import { toast } from "sonner";
import { logDebug, logError, logInfo, logWarn } from "@/lib/logger";

// Контекст с начальными значениями
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({
    success: false,
    error: "Auth context not initialized",
  }),
  logout: async () => false,
  refreshToken: async () => false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Слушатель для обработки событий истечения сессии
  useEffect(() => {
    const handleSessionExpired = (event: CustomEvent) => {
      const reason = event.detail?.reason || "unknown";
      logWarn(`Session expired event received: ${reason}`);

      toast.error("Ваша сессия истекла. Пожалуйста, войдите снова.");

      // Очищаем данные аутентификации перед перенаправлением
      clearAuthData();

      // Перенаправляем пользователя на страницу входа, если еще не перенаправлены
      if (window.location.pathname !== "/auth/login") {
        router.push("/auth/login?reason=session_expired");
      }
    };

    window.addEventListener(
      "auth:session-expired",
      handleSessionExpired as EventListener,
    );

    return () => {
      window.removeEventListener(
        "auth:session-expired",
        handleSessionExpired as EventListener,
      );
    };
  }, [router]);

  // Проверяем аутентификацию при загрузке страницы
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      logInfo("Initializing authentication state");

      try {
        // Проверяем наличие данных сессии в localStorage
        const storedUser = localStorage.getItem("user");
        const accessToken = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");
        const tokenExpiry = localStorage.getItem("tokenExpiry");
        const sessionId = localStorage.getItem("sessionId");

        logDebug("Auth data check", {
          hasUser: !!storedUser,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          hasTokenExpiry: !!tokenExpiry,
          hasSessionId: !!sessionId,
        });

        if (!storedUser || !accessToken || !refreshToken || !sessionId) {
          logInfo("No complete session data found, user not authenticated");
          throw new Error("No session data found");
        }

        // Восстанавливаем пользователя из localStorage
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        logInfo(`User restored from storage: ${parsedUser.email || "unknown"}`);

        // Проверим валидность токена, при необходимости обновим
        if (tokenExpiry) {
          const expiryDate = new Date(parseInt(tokenExpiry));
          const currentDate = new Date();
          const timeUntilExpiry = expiryDate.getTime() - currentDate.getTime();

          logDebug("Token expiry check", {
            expiryDate: expiryDate.toISOString(),
            currentDate: currentDate.toISOString(),
            minutesUntilExpiry: Math.round(timeUntilExpiry / 60000),
          });

          // Если токен истек или истекает в ближайшие 5 минут
          if (expiryDate <= currentDate || timeUntilExpiry < 300000) {
            logInfo("Token expired or expiring soon, refreshing");
            const refreshSuccess = await handleRefreshToken(refreshToken);

            if (!refreshSuccess) {
              logWarn("Token refresh failed during initialization");
              throw new Error("Failed to refresh token");
            }
          }
        }
      } catch (error: any) {
        logError("Failed to initialize auth", { error: error.message });

        // Очищаем локальное хранилище, если что-то пошло не так
        clearAuthData();
      } finally {
        setIsLoading(false);
        logInfo("Auth initialization completed");
      }
    };

    initAuth();
  }, []);

  // Сохраняем сессию пользователя в localStorage
  const saveSession = (session: Session) => {
    logDebug("Saving session data", {
      userId: session.user.email,
      expiresAt: new Date(session.access_token_expires_at).toISOString(),
      sessionId: session.session_id,
    });

    localStorage.setItem("accessToken", session.access_token);
    localStorage.setItem("refreshToken", session.refresh_token);
    localStorage.setItem("user", JSON.stringify(session.user));
    localStorage.setItem("sessionId", session.session_id);

    // Сохраняем время истечения токена для проверки
    const expiresAt = new Date(session.access_token_expires_at).getTime();
    localStorage.setItem("tokenExpiry", expiresAt.toString());

    logInfo("Session data saved successfully");
  };

  // Очищаем данные аутентификации
  const clearAuthData = () => {
    logInfo("Clearing authentication data");

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("tokenExpiry");
    localStorage.removeItem("sessionId");
    setUser(null);

    logInfo("Authentication data cleared");
  };

  // Обрабатываем обновление токена
  const handleRefreshToken = async (refreshTokenStr?: string) => {
    try {
      logInfo("Attempting to refresh token");

      const token = refreshTokenStr || localStorage.getItem("refreshToken");
      if (!token) {
        logWarn("No refresh token available for refresh");
        return false;
      }

      const response = await authApi.refreshToken({ refresh_token: token });
      logInfo("Token refreshed successfully");

      // Обновляем только токен доступа, refresh токен остается прежним
      localStorage.setItem("accessToken", response.data.access_token);

      // Обновляем время истечения токена
      const expiresAt = new Date(
        response.data.access_token_expires_at,
      ).getTime();

      localStorage.setItem("tokenExpiry", expiresAt.toString());

      logDebug("Updated token expiry", {
        newExpiry: new Date(expiresAt).toISOString(),
      });

      return true;
    } catch (error: any) {
      logError("Failed to refresh token", {
        error: error.message,
        status: error.response?.status,
        details: error.response?.data,
      });

      // Если ошибка 401 или 403, значит refresh token недействителен
      if (error.response?.status === 401 || error.response?.status === 403) {
        logWarn("Refresh token is invalid or expired, clearing auth data");
        clearAuthData();

        // Генерируем событие об истечении сессии
        window.dispatchEvent(
          new CustomEvent("auth:session-expired", {
            detail: { reason: "invalid_refresh_token" },
          }),
        );
      }

      return false;
    }
  };

  // Функция для входа пользователя
  const login = async (email: string, password: string) => {
    logInfo(`Login attempt initiated for: ${email}`);

    try {
      setIsLoading(true);
      const response = await authApi.login({ email, password });

      // Получаем и сохраняем данные сессии
      const session: Session = {
        session_id: response.data.session_id,
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        access_token_expires_at: new Date(
          response.data.access_token_expires_at,
        ),
        user: response.data.user,
      };

      saveSession(session);
      setUser(session.user);

      logInfo(`Login successful for: ${email}`);
      return { success: true };
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Ошибка входа. Проверьте ваши данные.";

      logError(`Login failed for: ${email}`, {
        errorMessage,
        status: error.response?.status,
        details: error.response?.data,
      });

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для выхода пользователя
  const logout = async () => {
    try {
      logInfo("Logout initiated");
      setIsLoading(true);

      // Получаем ID сессии из localStorage для отдельного запроса
      const sessionId = localStorage.getItem("sessionId");
      if (!sessionId) {
        logWarn("No session ID found for logout");
        clearAuthData();
        router.push("/auth/login");
        return true;
      }

      // Вызываем API для выхода с указанием sessionId
      await authApi.logout(sessionId);
      logInfo("Logout API call successful");

      // Очищаем данные локально
      clearAuthData();

      // Перенаправляем на страницу входа
      router.push("/auth/login");
      logInfo("User redirected to login page");

      return true;
    } catch (error: any) {
      logError("Logout failed", {
        error: error.message,
        status: error.response?.status,
        details: error.response?.data,
      });

      toast.error("Ошибка при выходе из системы");

      // Даже при ошибке API очищаем локальные данные
      // для обеспечения корректного выхода пользователя
      clearAuthData();

      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Мемоизируем значение контекста для оптимизации рендеринга
  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      refreshToken: () => handleRefreshToken(),
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
