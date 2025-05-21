export interface User {
  name: string;
  email: string;
  is_admin: boolean;
}

export interface Session {
  session_id: string;
  access_token: string;
  refresh_token: string;
  access_token_expires_at: Date;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  session_id: string;
  access_token: string;
  refresh_token: string;
  access_token_expires_at: string | Date;
  user: User;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  access_token_expires_at: string | Date;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<boolean>;
  refreshToken: () => Promise<boolean>;
}
