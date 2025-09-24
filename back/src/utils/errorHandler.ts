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
  // Создаем копию ошибки для модификации
  let error = { ...err };
  error.message = err.message;

  // Логируем ошибку
  console.error('Ошибка сервера:', err);

  // Обработка специфических ошибок базы данных (Mongoose)
  if (err.name === 'CastError') {
    const message = 'Ресурс не найден';
    error = new AppError(message, 404);
  }

  // Дублирование ключа в MongoDB
  if (err.name === 'MongoError' && (err as any).code === 11000) {
    const message = 'Дублирование значения поля';
    error = new AppError(message, 400);
  }

  // Ошибка валидации Mongoose
  if (err.name === 'ValidationError') {
    const message = 'Ошибка валидации данных';
    error = new AppError(message, 400);
  }

  // Ошибки JWT токенов
  if (err.name === 'JsonWebTokenError') {
    const message = 'Неверный токен';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Токен истек';
    error = new AppError(message, 401);
  }

  // Ошибки загрузки файлов (Multer)
  if (err.name === 'MulterError') {
    if (err.message.includes('File too large')) {
      error = new AppError('Файл слишком большой', 400);
    } else {
      error = new AppError('Ошибка загрузки файла', 400);
    }
  }

  // Отправляем ответ с ошибкой
  res.status((error as AppError).statusCode || 500).json({
    success: false,
    error: error.message || 'Ошибка сервера',
    // В режиме разработки добавляем стек и детали для отладки
    ...(getAppConfig().nodeEnv === 'development' && {
      stack: err.stack,
      details: err
    }),
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

/**
 * Устанавливаем ссылку на сервер для graceful shutdown
 */
export const setServer = (serverInstance: any): void => {
  server = serverInstance;
};
