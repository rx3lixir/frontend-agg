// Уровни логирования
export enum LogLevel {
  ERROR = "ERROR",
  WARN = "WARN",
  INFO = "INFO",
  DEBUG = "DEBUG",
}

// Интерфейс для метаданных лога
export interface LogMetadata {
  [key: string]: any;
}

// Класс логгера
class Logger {
  private static instance: Logger;
  private currentLogLevel: LogLevel = LogLevel.INFO;
  private enabled: boolean = true;

  // Конфигурируемый префикс для логов
  private appPrefix: string = "[Auth]";

  private constructor() {
    // Устанавливаем уровень логирования на основе переменной окружения
    if (typeof window !== "undefined") {
      // В клиентском режиме
      const debugMode = localStorage.getItem("debugAuthMode");
      if (debugMode === "true") {
        this.currentLogLevel = LogLevel.DEBUG;
      }
    } else {
      // В серверном режиме
      if (process.env.NEXT_PUBLIC_LOG_LEVEL) {
        this.currentLogLevel = process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel;
      }
    }
  }

  // Получение экземпляра логгера (Singleton)
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // Включение/отключение логирования
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  // Изменение уровня логирования
  public setLogLevel(level: LogLevel): void {
    this.currentLogLevel = level;
    if (typeof window !== "undefined") {
      if (level === LogLevel.DEBUG) {
        localStorage.setItem("debugAuthMode", "true");
      } else {
        localStorage.removeItem("debugAuthMode");
      }
    }
  }

  // Получение текущего уровня логирования
  public getLogLevel(): LogLevel {
    return this.currentLogLevel;
  }

  // Проверка, должен ли лог с указанным уровнем быть отображен
  private shouldLog(level: LogLevel): boolean {
    if (!this.enabled) return false;

    const levels = [
      LogLevel.ERROR,
      LogLevel.WARN,
      LogLevel.INFO,
      LogLevel.DEBUG,
    ];
    return levels.indexOf(level) <= levels.indexOf(this.currentLogLevel);
  }

  // Форматирование сообщения
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `${timestamp} ${this.appPrefix} [${level}] ${message}`;
  }

  // Логирование с метаданными
  private log(level: LogLevel, message: string, metadata?: LogMetadata): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message);

    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage, metadata || "");
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, metadata || "");
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, metadata || "");
        break;
      case LogLevel.DEBUG:
        console.debug(formattedMessage, metadata || "");
        break;
      default:
        console.log(formattedMessage, metadata || "");
    }
  }

  // Публичные методы для разных уровней логирования
  public error(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.ERROR, message, metadata);
  }

  public warn(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  public info(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  public debug(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }
}

// Экспортируем экземпляр логгера
export const logger = Logger.getInstance();

// Вспомогательные функции для быстрого доступа
export const logError = (message: string, metadata?: LogMetadata) =>
  logger.error(message, metadata);
export const logWarn = (message: string, metadata?: LogMetadata) =>
  logger.warn(message, metadata);
export const logInfo = (message: string, metadata?: LogMetadata) =>
  logger.info(message, metadata);
export const logDebug = (message: string, metadata?: LogMetadata) =>
  logger.debug(message, metadata);

// Функция для включения режима отладки
export const enableDebugMode = () => {
  logger.setLogLevel(LogLevel.DEBUG);
  logInfo("Debug mode enabled");
};

// Функция для отключения режима отладки
export const disableDebugMode = () => {
  logger.setLogLevel(LogLevel.INFO);
  logInfo("Debug mode disabled");
};
