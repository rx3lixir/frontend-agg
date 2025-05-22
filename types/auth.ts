// types/auth.ts

export interface User {
  name: string;
  email: string;
  is_admin: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ИСПРАВЛЕНИЕ: Убираем токены из ответа логина, так как они теперь в cookies
export interface LoginResponse {
  user: User;
  access_token_expires_at: string; // Только время истечения для UI
}

// ИСПРАВЛЕНИЕ: Убираем токен из ответа refresh, так как он теперь в cookie
export interface RefreshTokenResponse {
  access_token_expires_at: string; // Только время истечения для UI
}

export interface RefreshTokenRequest {
  // Пустой интерфейс, так как refresh_token теперь отправляется через cookie
}

// Дополнительные типы для работы с сессиями
export interface SessionInfo {
  sessionId: string | null;
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessTokenExpiresAt: Date | null;
}

export interface AuthContextType extends AuthState {
  login: (
    email: string,
    password: string,
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}
