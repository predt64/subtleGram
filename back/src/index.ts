/**
 * Главный файл приложения - точка входа Express сервера
 * Настраивает middleware, маршруты и запускает HTTP сервер
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer, Server } from 'http';

import subtitleRoutes from './routes/subtitles';
import { getAppConfig } from './utils/config';

/**
 * Загружаем переменные окружения из .env файла
 * Должны быть установлены: HF_TOKEN, FRONTEND_URL, NODE_ENV, PORT
 */
dotenv.config();

/**
 * Получаем централизованную конфигурацию приложения
 * Включает валидацию всех необходимых параметров
 */
const appConfig = getAppConfig();

/**
 * Создаем Express приложение и HTTP сервер
 * Используем отдельный HTTP сервер для поддержки graceful shutdown
 */
const app = express();
const server: Server = createServer(app);

/**
 * НАСТРОЙКА ЗАЩИТЫ И БЕЗОПАСНОСТИ
 */

/**
 * Helmet.js - добавляет HTTP заголовки безопасности
 * Защищает от XSS, clickjacking, MIME sniffing и других атак
 */
app.use(helmet());

/**
 * Настройка CORS (Cross-Origin Resource Sharing)
 * Разрешает запросы только с указанного фронтенда
 */
const corsOptions = {
  origin: appConfig.frontendUrl,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Разрешает cookies и авторизацию
};
app.use(cors(corsOptions));

/**
 * НАСТРОЙКА ЛОГИРОВАНИЯ
 */

/**
 * Morgan - middleware для логирования HTTP запросов
 * В режиме разработки показывает детальную информацию
 * В продакшене использует Apache-стиль логов
 */
if (appConfig.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

/**
 * НАСТРОЙКА ОБРАБОТКИ ЗАПРОСОВ
 */

/**
 * Парсинг JSON тела запросов с лимитом 10MB
 * Поддерживает загрузку больших субтитров
 */
app.use(express.json({ limit: '10mb' }));

/**
 * Парсинг URL-encoded данных (формы) с лимитом 10MB
 * Нужно для multipart/form-data загрузки файлов
 */
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * МАРШРУТЫ И ОБРАБОТЧИКИ
 */

/**
 * Health check эндпоинт для проверки статуса сервера
 * Используется для мониторинга и load balancer'ов
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: appConfig.nodeEnv,
  });
});

/**
 * Основные API маршруты для работы с субтитрами
 * Все эндпоинты находятся под префиксом /api/subtitles
 */
app.use('/api/subtitles', subtitleRoutes);

/**
 * ОБРАБОТКА ОШИБОК
 */

/**
 * 404 обработчик для несуществующих маршрутов
 * Возвращает JSON с информацией об ошибке
 */
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Маршрут ${req.originalUrl} не найден`,
  });
});

/**
 * Глобальный обработчик ошибок
 * Обрабатывает все непойманные ошибки в приложении
 */
app.use((err: any, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('Ошибка сервера:', err);

  // Специальная обработка ошибок загрузки файлов (multer)
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({
      error: 'Файл слишком большой',
      message: 'Размер файла превышает максимально допустимый лимит',
    });
    return;
  }

  // Общая обработка ошибок
  const statusCode = err.status || 500;
  const errorResponse: any = {
    error: err.message || 'Внутренняя ошибка сервера',
  };

  // В режиме разработки добавляем stack trace для отладки
  if (appConfig.nodeEnv === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
});

/**
 * ЗАПУСК СЕРВЕРА
 */

/**
 * Получаем порт из централизованной конфигурации
 */
const PORT = appConfig.port;

/**
 * Запускаем HTTP сервер и выводим информацию о запуске
 */
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`Среда: ${appConfig.nodeEnv}`);
  console.log(`Frontend URL: ${appConfig.frontendUrl}`);
  console.log(`HF токен: ${appConfig.hfToken ? 'установлен' : 'не установлен'}`);
});

/**
 * GRACEFUL SHUTDOWN
 * Корректное завершение работы сервера при получении сигналов
 */

/**
 * Обработка сигнала SIGTERM (от системного менеджера процессов)
 */
process.on('SIGTERM', () => {
  console.log('Получен сигнал SIGTERM, завершаем работу...');
  server.close(() => {
    console.log('Сервер остановлен');
    process.exit(0);
  });
});

/**
 * Обработка сигнала SIGINT (Ctrl+C в терминале)
 */
process.on('SIGINT', () => {
  console.log('Получен сигнал SIGINT, завершаем работу...');
  server.close(() => {
    console.log('Сервер остановлен');
    process.exit(0);
  });
});

/**
 * Экспортируем Express приложение для тестирования
 */
export default app;
