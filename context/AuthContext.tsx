import React, { createContext, useContext, useEffect, useState } from "react";
import { User, AuthContextType } from "@/types/auth";
import { authApi } from "@/lib/api-client";
import { logDebug, logError, logInfo } from "@/lib/logger";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accessTokenExpiresAt, setAccessTokenExpiresAt] = useState<Date | null>(
    null,
  );

  // Функция для проверки текущего состояния аутентификации
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);

      // ИСПРАВЛЕНИЕ: Делаем запрос к защищенному эндпоинту для проверки токена
      // Если токен валиден, сервер вернет данные пользователя
      // Если нет - получим 401 и сработает перехватчик
      const response = await fetch(
        "http://localhost:8080/auth/api/v1/auth/me",
        {
          credentials: "include", // Включаем cookies
        },
      );

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
        setIsAuthenticated(true);
        setAccessTokenExpiresAt(new Date(userData.access_token_expires_at));
        logInfo("User authenticated from cookies", {
          email: userData.user.email,
        });
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setAccessTokenExpiresAt(null);
        logDebug("User not authenticated");
      }
    } catch (error) {
      logError("Error checking auth status", { error });
      setUser(null);
      setIsAuthenticated(false);
      setAccessTokenExpiresAt(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Проверяем состояние аутентификации при загрузке приложения
  useEffect(() => {
    checkAuthStatus();

    // Слушаем события истечения сессии
    const handleSessionExpired = () => {
      logInfo("Session expired event received");
      setUser(null);
      setIsAuthenticated(false);
      setAccessTokenExpiresAt(null);
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);

    return () => {
      window.removeEventListener("auth:session-expired", handleSessionExpired);
    };
  }, []);

  // Функция логина
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.login({ email, password });
      const { user: userData, access_token_expires_at } = response.data;

      setUser(userData);
      setIsAuthenticated(true);
      setAccessTokenExpiresAt(new Date(access_token_expires_at));

      logInfo("User logged in successfully", { email: userData.email });
      return { success: true }; // Добавляем возвращаемое значение
    } catch (error) {
      logError("Login failed", { error });
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Функция логаута
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      logError("Logout API call failed", { error });
      // Продолжаем с локальной очисткой даже если API вызов неудачен
    } finally {
      // Очищаем локальное состояние
      setUser(null);
      setIsAuthenticated(false);
      setAccessTokenExpiresAt(null);

      logInfo("User logged out successfully");

      // Перенаправляем на страницу входа
      window.location.href = "/auth/login";
    }
  };

  // Функция обновления токена
  const refreshToken = async () => {
    try {
      const response = await authApi.refreshToken();
      const { access_token_expires_at } = response.data;

      setAccessTokenExpiresAt(new Date(access_token_expires_at));
      logInfo("Token refreshed successfully");
    } catch (error) {
      logError("Token refresh failed", { error });

      // Если refresh не удался, очищаем состояние
      setUser(null);
      setIsAuthenticated(false);
      setAccessTokenExpiresAt(null);

      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    accessTokenExpiresAt,
    login,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
