import { Request, Response, NextFunction } from 'express';
import { getAppConfig } from './config';

/**
 * Кастомный класс ошибок приложения
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Захватываем стек вызовов для отладки
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Глобальный обработчик ошибок Express middleware
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Ошибка сервера:', err);

  // Обрабатываем Multer ошибки загрузки файлов
  if (err.name === 'MulterError') {
    if (err.message.includes('File too large')) {
      res.status(400).json({
        success: false,
        error: 'Файл слишком большой'
      });
      return;
    }
    res.status(400).json({
      success: false,
      error: 'Ошибка загрузки файла'
    });
    return;
  }

  // Обрабатка кастомных ошибок
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(getAppConfig().nodeEnv === 'development' && {
        stack: err.stack
      })
    });
    return;
  }

  // Обрабатываем остальные ошибки
  res.status(500).json({
    success: false,
    error: err.message || 'Внутренняя ошибка сервера',
    ...(getAppConfig().nodeEnv === 'development' && {
      stack: err.stack
    })
  });
};

/**
 * Обработчик необработанных отклонений промисов
 */
export const handleUnhandledRejections = (): void => {
  process.on('unhandledRejection', (err: Error, promise) => {
    console.error('Необработанное отклонение промиса:', err.message);
    console.error('Промис:', promise);

    // Закрываем сервер и завершаем процесс
    server.close(() => {
      console.error('Сервер закрыт из-за необработанного отклонения промиса');
      process.exit(1);
    });
  });
};

/**
 * Обработчик необработанных исключений
 */
export const handleUncaughtExceptions = (): void => {
  process.on('uncaughtException', (err: Error) => {
    console.error('Необработанное исключение:', err.message);
    console.error('Стек:', err.stack);

    console.error('Завершение работы из-за необработанного исключения');
    process.exit(1);
  });
};

/**
 * Wrapper для обработки ошибок в асинхронных функциях
 */
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Создание стандартизированного API ответа
 */
export const sendResponse = (
  res: Response,
  statusCode: number = 200,
  success: boolean = true,
  message: string = '',
  data: any = null,
  errors: any = null
): void => {
  const response: any = {
    success,
    message,
  };

  // Добавляем данные если они есть
  if (data !== null) {
    response.data = data;
  }

  // Добавляем ошибки если они есть
  if (errors !== null) {
    response.errors = errors;
  }

  // В режиме разработки добавляем timestamp
  if (getAppConfig().nodeEnv === 'development') {
    response.timestamp = new Date().toISOString();
  }

  res.status(statusCode).json(response);
};

// Ссылка на сервер для корректного завершения работы
let server: any;

export const setServer = (serverInstance: any): void => {
  server = serverInstance;
};
