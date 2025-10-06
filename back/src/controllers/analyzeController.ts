/**
 * Контроллер для обработки анализа субтитров
 * Обрабатывает HTTP запросы к /api/subtitles/analyze
 */

import { Request, Response } from 'express';
import { analysisService } from '../services/analysisService';

/**
 * Структура тела запроса на анализ субтитров
 */
interface AnalyzeRequestBody {
  /** Текст предложения для анализа */
  sentenceText: string;
  /** Контекст предложения (предыдущее/следующее) */
  context?: {
    prev: string;    // Предыдущее предложение
    next: string;    // Следующее предложение
  };
  /** Название сериала для контекста */
  seriesName?: string;
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
      // Извлекаем параметры анализа
      const { sentenceText, context, seriesName } = req.body as AnalyzeRequestBody;

      // Проверяем, что предоставлен текст предложения
      if (!sentenceText) {
        res.status(400).json({
          success: false,
          message: 'sentenceText (текст предложения) обязательна'
        });
        return;
      }

      // Флаг для отслеживания отмены запроса
      let requestCancelled = false;

      // Обработчик отмены запроса клиентом
      const onRequestClose = () => {
        requestCancelled = true;
        console.log('Analysis request cancelled by client');
      };

      // Слушаем событие закрытия соединения
      req.on('close', onRequestClose);
      req.on('aborted', onRequestClose);

      /**
       * ВЫПОЛНЕНИЕ АНАЛИЗА
       * Вызываем сервис анализа с использованием Qwen AI
       */
      const analysisResult = await analysisService.createTranslationGuide({
        sentenceText,
        ...(context && { context }),
        ...(seriesName && { seriesName })
      });

      // Убираем слушатели событий
      req.removeListener('close', onRequestClose);
      req.removeListener('aborted', onRequestClose);

      // Проверяем, был ли запрос отменен клиентом
      if (requestCancelled) {
        console.log('Request was cancelled, not sending response');
        return; // Не отправляем ответ
      }

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
          analysis: analysisResult,        // Результаты анализа
          metadata: {
            processingTimeMs: processingTime,    // Время обработки
            timestamp: new Date().toISOString(), // Время завершения
            model: 'Qwen/Qwen3-Next-80B-A3B-Instruct' // Используемая модель
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
            message: 'Неверный или отсутствующий токен OpenRouter',
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
