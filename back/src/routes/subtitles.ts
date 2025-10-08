/**
 * Маршруты для работы с субтитрами
 * Определяет API эндпоинты для загрузки, анализа и мониторинга субтитров
 */

import express from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { uploadController } from '../controllers/uploadController';
import { analyzeController } from '../controllers/analyzeController';
import { fileUploadConfig, rateLimitConfig, getCurrentModelInfo } from '../utils/config';

const router = express.Router();

/**
 * НАСТРОЙКА ЗАГРУЗКИ ФАЙЛОВ (MULTER)
 */

/**
 * Хранилище файлов в памяти - файлы не сохраняются на диск,
 * а обрабатываются непосредственно в оперативной памяти
 * Это быстрее и безопаснее для временных файлов
 */
const storage = multer.memoryStorage();

/**
 * Настройка multer для загрузки файлов субтитров
 * Использует централизованную конфигурацию из utils/config.ts
 */
const upload = multer({
  storage,
  limits: {
    fileSize: fileUploadConfig.maxFileSize, // Максимальный размер файла
  },

  /**
   * Фильтр файлов - проверяет допустимость типа файла
   * Разрешает только субтитры (.srt, .vtt, .txt)
   */
  fileFilter: (_req, file, cb) => {
    // Получаем расширение файла
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));

    // Проверяем MIME тип и расширение файла
    const isAllowedType = fileUploadConfig.allowedMimeTypes.includes(file.mimetype);
    const isAllowedExtension = fileUploadConfig.allowedExtensions.includes(fileExtension);

    if (isAllowedType || isAllowedExtension) {
      cb(null, true); // Файл разрешен
    } else {
      // Формируем понятное сообщение об ошибке
      const errorMessage = `Недопустимый тип файла. Разрешены только файлы: ${fileUploadConfig.allowedExtensions.join(', ')}. Лимит размера: ${fileUploadConfig.maxFileSizeMB}MB.`;
      cb(new Error(errorMessage));
    }
  },
});

/**
 * НАСТРОЙКА ОГРАНИЧЕНИЯ ЗАПРОСОВ (RATE LIMITING)
 */

/**
 * Ограничение частоты запросов к анализу субтитров
 * Защищает от злоупотреблений и перегрузки API
 */
const analysisRateLimit = rateLimit({
  ...rateLimitConfig,
  message: {
    error: 'Слишком много запросов на анализ',
    message: rateLimitConfig.message,
    retryAfter: Math.ceil(rateLimitConfig.windowMs / 1000) // Время ожидания в секундах
  }
});

/**
 * ОПРЕДЕЛЕНИЕ МАРШРУТОВ API
 */

/**
 * POST /api/subtitles/upload
 * Загрузка и парсинг файла субтитров
 *
 * Принимает: multipart/form-data с файлом 'subtitle'
 * Возвращает: распарсенные субтитры в JSON формате
 * Ограничения: размер файла, тип файла (.srt, .vtt, .txt)
 */
router.post('/upload', upload.single('file'), uploadController.uploadSubtitle);

/**
 * POST /api/subtitles/analyze
 * Анализ содержимого субтитров с помощью Qwen AI
 *
 * Принимает: JSON с массивом субтитров и типом анализа
 * Возвращает: детальный анализ (сложность, словарь, грамматика)
 * Ограничения: rate limiting для защиты от злоупотреблений
 */
router.post('/analyze', express.json(), analysisRateLimit, analyzeController.analyzeSubtitles);

/**
 * GET /api/subtitles/health
 * Проверка статуса сервиса субтитров
 *
 * Возвращает информацию о:
 * - Статусе сервиса
 * - Используемой AI модели
 * - Доступных эндпоинтах и их ограничениях
 * - Доступных функциях анализа
 */
router.get('/health', (_req, res) => {
  const modelInfo = getCurrentModelInfo();
  res.json({
    status: 'OK',
    service: 'subtitles',
    aiModel: modelInfo.displayName,
    models: {
      primary: modelInfo.primary,
      fallback: modelInfo.fallback
    },
    endpoints: [
      {
        path: 'POST /upload',
        description: 'Загрузка и парсинг файлов субтитров',
        limits: `${fileUploadConfig.maxFileSizeMB}MB, форматы: ${fileUploadConfig.allowedExtensions.join(', ')}`
      },
      {
        path: 'POST /analyze',
        description: 'Анализ субтитров с помощью AI',
        rateLimit: `${rateLimitConfig.max} запросов в ${Math.ceil(rateLimitConfig.windowMs / 60000)} минут`
      }
    ],
    features: [
      'Анализ сложности текста',
      'Оценка словарного запаса',
      'Проверка грамматики',
      'Комплексный анализ'
    ]
  });
});

export default router;
