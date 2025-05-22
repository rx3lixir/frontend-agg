import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import {
  LoginRequest,
  LoginResponse,
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
  withCredentials: true, // КРИТИЧНО! Включаем отправку cookies
});

// Флаг для отслеживания обновления токена
let isRefreshing = false;
// Очередь ожидающих запросов
let refreshSubscribers: Array<(success: boolean) => void> = [];

// Функция для добавления запроса в очередь ожидания
const subscribeTokenRefresh = (callback: (success: boolean) => void) => {
  refreshSubscribers.push(callback);
};

// Функция для выполнения всех запросов из очереди
const onTokenRefreshed = (success: boolean) => {
  refreshSubscribers.forEach((callback) => callback(success));
  refreshSubscribers = [];
};

// Интерсептор для запросов - теперь проще, так как токены отправляются через cookies
apiClient.interceptors.request.use(
  (config) => {
    logDebug(`Request to ${config.url} - token will be sent via cookie`);
    return config;
  },
  (error) => {
    logError("Request interceptor error", { error: error.message });
    return Promise.reject(error);
  },
);

// Интерсептор для обработки ответов и автоматического обновления токена
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
    });

    // Проверяем, что ошибка 401 и запрос еще не повторялся
    if (error.response?.status === 401 && !originalRequest._retry) {
      logInfo("Received 401 error, attempting to refresh token");

      // Если уже идет обновление токена, добавляем запрос в очередь
      if (isRefreshing) {
        logInfo("Token refresh already in progress, queuing request");
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((success: boolean) => {
            if (success) {
              resolve(apiClient(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // ИСПРАВЛЕНИЕ: Просто вызываем refresh без передачи токена в теле
        // Refresh token будет отправлен автоматически через httpOnly cookie
        const response = await axios.post<RefreshTokenResponse>(
          `${API_BASE_URL}/api/v1/auth/refresh`,
          {}, // Пустое тело - токен в cookie
          { withCredentials: true },
        );

        logInfo("Token refreshed successfully via cookies");

        // Уведомляем ожидающие запросы об успехе
        onTokenRefreshed(true);
        isRefreshing = false;

        logInfo(`Retrying original request to ${url}`);
        return apiClient(originalRequest);
      } catch (refreshError: any) {
        logError("Failed to refresh token", {
          originalUrl: url,
          errorResponse: refreshError.response?.data,
          errorMessage: refreshError.message,
        });

        // Сбрасываем флаг обновления
        isRefreshing = false;
        onTokenRefreshed(false);

        // Если обновление токена не удалось
        if (typeof window !== "undefined") {
          logInfo("Refresh token failed, dispatching session expired event");

          try {
            window.dispatchEvent(
              new CustomEvent("auth:session-expired", {
                detail: { reason: "refresh_failed" },
              }),
            );
            logInfo("Session expired event dispatched");
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
      const response = await apiClient.post<LoginResponse>(
        `/api/v1/auth/login`,
        data,
        { withCredentials: true }, // Получаем httpOnly cookies от сервера
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

  // Пользователь разлогнивается
  logout: async (): Promise<AxiosResponse<void>> => {
    logInfo("Logout attempt");

    try {
      // Session ID будет отправлен автоматически через httpOnly cookie
      const response = await apiClient.post<void>(
        `/api/v1/auth/logout`,
        {}, // Пустое тело - все данные в cookies
        { withCredentials: true },
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
  refreshToken: async (): Promise<AxiosResponse<RefreshTokenResponse>> => {
    logInfo("Manual token refresh attempt");

    try {
      // Refresh token будет отправлен автоматически через httpOnly cookie
      const response = await apiClient.post<RefreshTokenResponse>(
        `/api/v1/auth/refresh`,
        {}, // Пустое тело - refresh_token в cookie
        { withCredentials: true },
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

  // Отзыв токена
  revokeToken: async (): Promise<AxiosResponse<void>> => {
    logInfo("Token revocation attempt");

    try {
      const response = await apiClient.post<void>(
        `/api/v1/auth/revoke`,
        {},
        { withCredentials: true },
      );
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
