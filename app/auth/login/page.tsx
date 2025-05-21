"use client";

import LoginForm from "@/components/auth/login-form";
import { useAuthRedirect } from "@/hooks/useAuthGuard";

const LoginPage = () => {
  // Перенаправит на /auth/login, если пользователь не авторизован
  const { isLoading } = useAuthRedirect();

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  return <LoginForm />;
};

export default LoginPage;
