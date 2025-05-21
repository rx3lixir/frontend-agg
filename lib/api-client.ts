import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from "@/types/auth";
import { logDebug, logError, logInfo, logWarn } from "@/lib/logger";

// Настройки базового URL для API
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/auth";

// Создаем экземпляр axios с нужными настройками
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Функция для получения токена из localStorage (только на клиенте)
const getAccessToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("accessToken");
  }
  return null;
};

// Функция для получения ID сессии из localStorage (только на клиенте)
const getSessionId = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("sessionId");
  }
  return null;
};

// Функция для получения refresh токена из localStorage (только на клиенте)
const getRefreshToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("refreshToken");
  }
  return null;
};

// Интерсептор для автоматического добавления токена к запросам
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
      logDebug(`Request to ${config.url} with auth token`);
    } else {
      logDebug(`Request to ${config.url} without auth token`);
    }
    return config;
  },
  (error) => {
    logError("Request interceptor error", { error: error.message });
    return Promise.reject(error);
  },
);

// Флаг для отслеживания выполнения обновления токена
let isRefreshing = false;
// Очередь ожидающих запросов
let refreshSubscribers: Array<(token: string) => void> = [];

// Функция для добавления запроса в очередь ожидания
const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// Функция для выполнения всех запросов из очереди
const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// Добавляем интерсептор для обработки ответов и автоматического обновления токена
apiClient.interceptors.response.use(
  (response) => {
    logDebug(`Response from ${response.config.url} successful`, {
      status: response.status,
    });
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const url = originalRequest.url || "unknown";
    const status = error.response?.status;

    logWarn(`API error from ${url}`, {
      status,
      errorMessage: error.message,
      responseData: error.response?.data,
    });

    // Проверяем, что ошибка 401 и запрос еще не повторялся
    if (error.response?.status === 401 && !originalRequest._retry) {
      logInfo("Received 401 error, attempting to refresh token");

      // Если уже идет обновление токена, добавляем запрос в очередь
      if (isRefreshing) {
        logInfo("Token refresh already in progress, queuing request");
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          logError("No refresh token available");
          throw new Error("No refresh token available");
        }

        // Пытаемся обновить токен
        const response = await axios.post<RefreshTokenResponse>(
          `${API_BASE_URL}/api/v1/auth/refresh`,
          { refresh_token: refreshToken },
        );

        // Получаем access token
        const accessToken = response.data.access_token;
        logInfo("Token refreshed successfully");

        // Сохраняем новый токен
        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", accessToken);

          // Сохраняем время истечения токена
          if (response.data.access_token_expires_at) {
            const expiresAt = new Date(
              response.data.access_token_expires_at,
            ).getTime();
            localStorage.setItem("tokenExpiry", expiresAt.toString());

            logDebug("Updated token expiry", {
              expiresAt: new Date(expiresAt).toISOString(),
            });
          }
        }

        // Обновляем заголовок в оригинальном запросе
        if (originalRequest.headers) {
          originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
        }

        // Уведомляем ожидающие запросы
        onTokenRefreshed(accessToken);
        isRefreshing = false;

        logInfo(`Retrying original request to ${url}`);
        return apiClient(originalRequest);
      } catch (refreshError: any) {
        // Расширенное логирование при ошибке обновления токена
        logError("Failed to refresh token", {
          originalUrl: url,
          errorResponse: refreshError.response?.data,
          errorMessage: refreshError.message,
        });

        // Сбрасываем флаг обновления
        isRefreshing = false;
        refreshSubscribers = [];

        // Если обновление токена не удалось, выходим из системы
        if (typeof window !== "undefined") {
          // Очищаем все данные аутентификации
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          localStorage.removeItem("tokenExpiry");
          localStorage.removeItem("sessionId");

          logInfo("Auth data cleared due to refresh token failure");

          try {
            if (
              typeof window !== "undefined" &&
              window.hasOwnProperty("dispatchEvent")
            ) {
              window.dispatchEvent(
                new CustomEvent("auth:session-expired", {
                  detail: { reason: "refresh_failed" },
                }),
              );
              logInfo("Session expired event dispatched");
            }
          } catch (e) {
            logError("Failed to dispatch session expired event", { error: e });
          }

          // Перенаправляем на страницу входа
          window.location.href = "/auth/login?reason=session_expired";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

// API методы для работы с аутентификацией
export const authApi = {
  // Пользователь логинится
  login: async (data: LoginRequest): Promise<AxiosResponse<LoginResponse>> => {
    logInfo(`Login attempt for user: ${data.email}`);

    try {
      // Используем правильный эндпоинт из роутера бэкенда
      const response = await apiClient.post<LoginResponse>(
        `/api/v1/auth/login`,
        data,
      );

      logInfo(`Login successful for user: ${data.email}`);
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message;
      logError(`Login failed for user: ${data.email}`, {
        errorMessage,
        status: error.response?.status,
        details: error.response?.data,
      });
      throw error;
    }
  },

  // Пользователь разлогнинивается
  logout: async (sessionId?: string): Promise<AxiosResponse<void>> => {
    logInfo("Logout attempt");

    try {
      // Используем ID сессии из параметра или из localStorage
      const sid = sessionId || getSessionId();

      if (!sid) {
        throw new Error("No session ID available for logout");
      }

      // Создаем параметры запроса с ID сессии
      const requestBody = { session_id: sid };
      logInfo(`Sending logout request with session ID: ${sid}`);

      const response = await apiClient.post<void>(
        `/api/v1/auth/logout`,
        requestBody,
      );
      logInfo("Logout successful");
      return response;
    } catch (error: any) {
      logError("Logout failed", {
        errorMessage: error.message,
        status: error.response?.status,
        details: error.response?.data,
      });
      throw error;
    }
  },

  // Обновление токена
  refreshToken: async (
    data: RefreshTokenRequest,
  ): Promise<AxiosResponse<RefreshTokenResponse>> => {
    logInfo("Manual token refresh attempt");

    try {
      const response = await apiClient.post<RefreshTokenResponse>(
        `/api/v1/auth/refresh`,
        data,
      );

      logInfo("Manual token refresh successful");
      return response;
    } catch (error: any) {
      logError("Manual token refresh failed", {
        errorMessage: error.message,
        status: error.response?.status,
        details: error.response?.data,
      });
      throw error;
    }
  },

  revokeToken: async (): Promise<AxiosResponse<void>> => {
    logInfo("Token revocation attempt");

    try {
      const response = await apiClient.post<void>(`/api/v1/auth/revoke`);
      logInfo("Token revocation successful");
      return response;
    } catch (error: any) {
      logError("Token revocation failed", {
        errorMessage: error.message,
        status: error.response?.status,
        details: error.response?.data,
      });
      throw error;
    }
  },
};

export default apiClient;
