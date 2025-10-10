/**
 * Контроллер для обработки анализа субтитров
 * Обрабатывает HTTP запросы к /api/subtitles/analyze
 */

import { Request, Response } from 'express';
import { analysisService } from '../services/analysisService';
import { getCurrentModelInfo } from '../utils/config';

/**
 * Константы для проверки типов ошибок
 */
const ERROR_PATTERNS = {
  AUTHENTICATION: ['API token', '401'],
  RATE_LIMIT: ['rate limit', '429'],
  TIMEOUT: ['timeout', 'AbortError'],
  SERVICE_UNAVAILABLE: ['503', 'unavailable'],
  INVALID_RESPONSE: ['Invalid JSON', 'parseStructuredResponse']
} as const;

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
 * Формирует успешный ответ с результатами анализа
 */
function sendAnalysisSuccess(res: Response, analysisResult: any, processingTime: number): void {
  res.status(200).json({
    success: true,
    message: 'Анализ с помощью AI завершен успешно',
    data: {
      analysis: analysisResult,
      metadata: {
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
        model: getCurrentModelInfo().displayName
      }
    },
  });
}

/**
 * Обрабатывает ошибки анализа и возвращает соответствующий HTTP ответ
 */
function handleAnalysisError(res: Response, error: unknown, processingTime: number): void {
  if (!(error instanceof Error)) {
    res.status(500).json({
      error: 'Внутренняя ошибка сервера',
      message: 'Произошла непредвиденная ошибка во время анализа',
      processingTimeMs: processingTime,
    });
    return;
  }

  // Ошибки аутентификации (неверный токен)
  if (ERROR_PATTERNS.AUTHENTICATION.some(pattern => error.message.includes(pattern))) {
    res.status(401).json({
      error: 'Ошибка аутентификации',
      message: 'Неверный или отсутствующий токен OpenRouter',
      details: error.message,
    });
    return;
  }

  // Превышение лимита запросов
  if (ERROR_PATTERNS.RATE_LIMIT.some(pattern => error.message.includes(pattern))) {
    res.status(429).json({
      error: 'Превышен лимит запросов',
      message: 'Слишком много запросов. Подождите перед повторной попыткой.',
      retryAfter: 60,
    });
    return;
  }

  // Таймаут запроса
  if (ERROR_PATTERNS.TIMEOUT.some(pattern => error.message.includes(pattern))) {
    res.status(408).json({
      error: 'Таймаут запроса',
      message: 'Анализ занял слишком много времени. Попробуйте с меньшим количеством субтитров.',
    });
    return;
  }

  // Сервис временно недоступен
  if (ERROR_PATTERNS.SERVICE_UNAVAILABLE.some(pattern => error.message.includes(pattern))) {
    res.status(503).json({
      error: 'Сервис временно недоступен',
      message: 'Служба AI сейчас занята. Попробуйте позже.',
    });
    return;
  }

  // Ошибки парсинга JSON от AI
  if (ERROR_PATTERNS.INVALID_RESPONSE.some(pattern => error.message.includes(pattern))) {
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
}

/**
 * Извлекает и валидирует параметры анализа из запроса
 */
function extractAndValidateRequest(req: Request): AnalyzeRequestBody {
  const { sentenceText, context, seriesName } = req.body as AnalyzeRequestBody;

  if (!sentenceText) {
    throw new Error('sentenceText (текст предложения) обязательна');
  }

  return { sentenceText, context, seriesName } as AnalyzeRequestBody;
}

/**
 * Настраивает обработку отмены запроса клиентом
 */
function setupCancellationHandling(req: Request): () => boolean {
  let requestCancelled = false;

  const onRequestClose = () => {
    requestCancelled = true;
    console.log('Analysis request cancelled by client');
  };

  req.on('close', onRequestClose);
  req.on('aborted', onRequestClose);

  return () => {
    req.removeListener('close', onRequestClose);
    req.removeListener('aborted', onRequestClose);
    return requestCancelled;
  };
}

/**
 * Контроллер для обработки запросов анализа субтитров
 */
export const analyzeController = {
  /**
   * Анализ субтитров с помощью AI
   * POST /api/subtitles/analyze
   *
   * Процесс:
   * 1. Валидация входных данных
   * 2. Вызов сервиса анализа
   * 3. Формирование ответа
   * 4. Обработка ошибок
   */
  analyzeSubtitles: async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();

    try {
      const requestData = extractAndValidateRequest(req);
      const checkCancelled = setupCancellationHandling(req);

      const analysisResult = await analysisService.createTranslationGuide({
        sentenceText: requestData.sentenceText,
        ...(requestData.context && { context: requestData.context }),
        ...(requestData.seriesName && { seriesName: requestData.seriesName })
      });

      const requestCancelled = checkCancelled();
      if (requestCancelled) {
        return;
      }

      const processingTime = Date.now() - startTime;
      console.log(`Анализ завершен за ${processingTime}мс`);
      sendAnalysisSuccess(res, analysisResult, processingTime);

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('Ошибка анализа после', processingTime, 'мс:', error);

      if (error instanceof Error && error.message.includes('sentenceText')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }

      handleAnalysisError(res, error, processingTime);
    }
  },
};
