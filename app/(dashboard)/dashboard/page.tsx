"use client";

import { useAuthGuard } from "@/hooks/useAuthGuard";

const DashboardPage = () => {
  // Перенаправит на /auth/login, если пользователь не авторизован
  const { isLoading } = useAuthGuard();

  if (isLoading) return <div>Загрузка...</div>;

  return;
};

export default DashboardPage;
