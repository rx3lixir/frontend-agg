import { useAuth } from "@/context/AuthContext";
import { logDebug } from "@/lib/logger";

/**
 * Хук для получения информации о текущем пользователе в клиентских компонентах
 * Используй этот хук вместо прямого вызова useAuth для получения пользователя
 */
export const useCurrentUser = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  logDebug("useCurrentUser called", {
    hasUser: !!user,
    isAuthenticated,
    isLoading,
    userEmail: user?.email,
  });

  return {
    user,
    isAuthenticated,
    isLoading,
    isAdmin: user?.is_admin ?? false,
  };
};

/**
 * Хук для действий аутентификации в клиентских компонентах
 */
export const useAuthActions = () => {
  const { login, logout, refreshToken } = useAuth();

  return {
    login,
    logout,
    refreshToken,
  };
};

/**
 * Хук для проверки прав доступа в клиентских компонентах
 * Не выполняет редирект, только возвращает информацию о правах
 */
export const usePermissions = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  const permissions = {
    isAuthenticated,
    isAdmin: user?.is_admin ?? false,
    isLoading,
    canAccess: (requiredAdmin: boolean = false) => {
      if (isLoading) return null; // Пока загружается, не знаем
      if (!isAuthenticated) return false;
      if (requiredAdmin && !user?.is_admin) return false;
      return true;
    },
  };

  logDebug("usePermissions called", permissions);

  return permissions;
};

/**
 * Хук для отображения условного контента на основе ролей пользователя
 * Полезен для показа/скрытия элементов UI в зависимости от прав
 */
export const useConditionalRender = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  return {
    // Показывать контент только аутентифицированным пользователям
    ifAuthenticated: (content: React.ReactNode) => {
      if (isLoading) return null;
      return isAuthenticated ? content : null;
    },

    // Показывать контент только неаутентифицированным пользователям
    ifNotAuthenticated: (content: React.ReactNode) => {
      if (isLoading) return null;
      return !isAuthenticated ? content : null;
    },

    // Показывать контент только администраторам
    ifAdmin: (content: React.ReactNode) => {
      if (isLoading) return null;
      return isAuthenticated && user?.is_admin ? content : null;
    },

    // Показывать контент только обычным пользователям (не админам)
    ifUser: (content: React.ReactNode) => {
      if (isLoading) return null;
      return isAuthenticated && !user?.is_admin ? content : null;
    },

    // Показывать контент во время загрузки
    ifLoading: (content: React.ReactNode) => {
      return isLoading ? content : null;
    },
  };
};

/**
 * Хук для получения приветствия пользователя
 */
export const useUserGreeting = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return "Гость";
  }

  return user.name || user.email.split("@")[0];
};
