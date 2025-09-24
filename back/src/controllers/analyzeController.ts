/**
 * Контроллер для обработки анализа субтитров
 * Обрабатывает HTTP запросы к /api/subtitles/analyze
 */

import { Request, Response } from 'express';
import { analysisService } from '../services/analysisService';
import { validationUtils } from '../utils/validation';

/**
 * Структура тела запроса на анализ субтитров
 */
interface AnalyzeRequestBody {
  /** Массив субтитров для анализа */
  subtitles: Array<{
    id: number;      // Уникальный идентификатор субтитра
    start: string;   // Время начала (формат HH:MM:SS.mmm)
    end: string;     // Время окончания
    text: string;    // Текст субтитра
  }>;
  /** Текст предложения для анализа */
  sentenceText: string;
  /** Контекст предложения (предыдущее/следующее) */
  context?: {
    prev: string;    // Предыдущее предложение
    next: string;    // Следующее предложение
  };
}

/**
 * Контроллер для обработки запросов анализа субтитров
 */
export const analyzeController = {
  /**
   * Анализ субтитров с помощью Qwen AI
   * POST /api/subtitles/analyze
   *
   * Процесс:
   * 1. Валидация входных данных
   * 2. Вызов сервиса анализа
   * 3. Формирование ответа
   * 4. Обработка ошибок
   */
  analyzeSubtitles: async (req: Request, res: Response): Promise<void> => {
    // Засекаем время начала обработки для метрик
    const startTime = Date.now();

    try {
      // Извлекаем данные из тела запроса
      const { subtitles } = req.body as AnalyzeRequestBody;

      /**
       * ВАЛИДАЦИЯ ВХОДНЫХ ДАННЫХ
       * Проверяем корректность массива субтитров
       */
      const validation = validationUtils.validateSubtitles(subtitles);
      if (!validation.isValid) {
        // Возвращаем детальную информацию об ошибках валидации
        res.status(400).json({
          error: 'Ошибка валидации',
          message: 'Предоставлены некорректные данные субтитров',
          details: validation.errors,      // Критические ошибки
          warnings: validation.warnings,   // Предупреждения
        });
        return;
      }

      // Извлекаем параметры анализа
      const { sentenceText, context } = req.body;

      // Проверяем, что предоставлен текст предложения
      if (!sentenceText) {
        res.status(400).json({
          success: false,
          message: 'sentenceText (текст предложения) обязательна'
        });
        return;
      }

      // Логируем начало анализа
      console.log(`Начинаем анализ Qwen для ${subtitles.length} субтитров`);
      console.log(`Текст предложения: "${sentenceText}"`);
      console.log(`Контекст: prev="${context?.prev || ''}", next="${context?.next || ''}"`);

      // Логируем предупреждения валидации, если они есть
      if (validation.warnings.length > 0) {
        console.warn('Предупреждения валидации:', validation.warnings);
      }

      /**
       * ВЫПОЛНЕНИЕ АНАЛИЗА
       * Вызываем сервис анализа с использованием Qwen AI
       */
      const analysisResult = await analysisService.createTranslationGuide(subtitles, {
        sentenceText,
        context
      });

      // Вычисляем время обработки
      const processingTime = Date.now() - startTime;
      console.log(`Анализ завершен за ${processingTime}мс`);

      /**
       * ФОРМИРОВАНИЕ ОТВЕТА
       * Возвращаем результаты анализа с метаданными
       */
      res.status(200).json({
        success: true,
        message: 'Анализ с помощью Qwen завершен успешно',
        data: {
          subtitlesAnalyzed: subtitles.length, // Количество обработанных субтитров
          analysis: analysisResult,        // Результаты анализа
          metadata: {
            processingTimeMs: processingTime,    // Время обработки
            timestamp: new Date().toISOString(), // Время завершения
            model: 'Qwen/Qwen3-Next-80B-A3B-Instruct', // Используемая модель
            validationWarnings: validation.warnings // Предупреждения валидации
          }
        },
      });

    } catch (error) {
      // Вычисляем время обработки даже при ошибке
      const processingTime = Date.now() - startTime;
      console.error('Ошибка анализа после', processingTime, 'мс:', error);

      /**
       * ОБРАБОТКА ОШИБОК
       * Разные типы ошибок требуют разных HTTP статусов и сообщений
       */
      if (error instanceof Error) {
        // Ошибки аутентификации (неверный токен)
        if (error.message.includes('API token') || error.message.includes('401')) {
          res.status(401).json({
            error: 'Ошибка аутентификации',
            message: 'Неверный или отсутствующий токен Hugging Face',
            details: error.message,
          });
          return;
        }

        // Превышение лимита запросов
        if (error.message.includes('rate limit') || error.message.includes('429')) {
          res.status(429).json({
            error: 'Превышен лимит запросов',
            message: 'Слишком много запросов. Подождите перед повторной попыткой.',
            retryAfter: 60, // секунд до следующего запроса
          });
          return;
        }

        // Таймаут запроса
        if (error.message.includes('timeout') || error.message.includes('AbortError')) {
          res.status(408).json({
            error: 'Таймаут запроса',
            message: 'Анализ занял слишком много времени. Попробуйте с меньшим количеством субтитров.',
          });
          return;
        }

        // Сервис временно недоступен
        if (error.message.includes('503') || error.message.includes('unavailable')) {
          res.status(503).json({
            error: 'Сервис временно недоступен',
            message: 'Служба Qwen AI сейчас занята. Попробуйте позже.',
          });
          return;
        }

        // Ошибки парсинга JSON от AI
        if (error.message.includes('Invalid JSON') || error.message.includes('parseStructuredResponse')) {
          res.status(502).json({
            error: 'Ошибка ответа AI',
            message: 'Получен некорректный ответ от службы AI. Попробуйте еще раз.',
          });
          return;
        }

        // Общие ошибки анализа
        res.status(400).json({
          error: 'Анализ не удался',
          message: error.message,
          processingTimeMs: processingTime,
        });
        return;
      }

      // Неизвестные ошибки - возвращаем 500
      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла непредвиденная ошибка во время анализа',
        processingTimeMs: processingTime,
      });
    }
  },
};
