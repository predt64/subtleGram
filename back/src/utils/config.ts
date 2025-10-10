/**
 * Конфигурация приложения для анализа субтитров на базе OpenRouter
 *
 * Предоставляет централизованную конфигурацию для:
 * - Модели OpenRouter (автоматический выбор оптимальных) и параметров API
 * - Загрузки файлов субтитров
 * - Ограничения частоты запросов
 * - Настроек сервера и окружения
 */

export interface OpenRouterModelConfig {
  /** Идентификатор модели для OpenRouter */
  model: string;
  /** Температура для случайности ответов (0.0 - 2.0) */
  temperature: number;
  /** Максимальное количество токенов в ответе */
  maxTokens: number;
  /** Таймаут запроса в миллисекундах */
  timeout: number;
  /** Максимальное количество попыток повтора */
  maxRetries: number;
  /** Базовый URL для API запросов */
  baseUrl: string;
  /** Базовая задержка для retry (мс) */
  retryDelayMs: number;
  /** Случайная добавка к задержке для jitter (мс) */
  retryJitterMs: number;
}

export interface FileUploadConfig {
  /** Максимальный размер файла в байтах */
  maxFileSize: number;
  /** Максимальный размер файла в MB (для отображения) */
  maxFileSizeMB: number;
  /** Разрешенные расширения файлов */
  allowedExtensions: string[];
  /** Разрешенные MIME типы */
  allowedMimeTypes: string[];
}

export interface SlangConfig {
  /** Время жизни кеша в миллисекундах */
  cacheTTL: number;
  /** Максимальное количество результатов от API */
  apiLimit: number;
  /** Таймаут запроса в миллисекундах */
  timeout: number;
  /** Максимальное количество повторных попыток */
  maxRetries: number;
}

export interface RateLimitConfig {
  /** Размер окна в миллисекундах */
  windowMs: number;
  /** Максимальное количество запросов в окне */
  max: number;
  /** Сообщение об ошибке при превышении лимита */
  message: string;
  /** Добавлять ли стандартные заголовки rate limit */
  standardHeaders: boolean;
  /** Добавлять ли устаревшие заголовки rate limit */
  legacyHeaders: boolean;
}

export interface AppConfig {
  /** Порт сервера */
  port: number;
  /** Окружение Node.js */
  nodeEnv: 'development' | 'production' | 'test';
  /** URL фронтенда для CORS */
  frontendUrl: string;
  /** Токен OpenRouter API */
  openRouterToken: string;
  /** Таймаут запросов для всех сервисов */
  requestTimeout: number;
}

/**
 * Базовая конфигурация модели OpenRouter, оптимизированная для анализа субтитров
 *
 * Основная модель: mistral/mistral-small-3.2-24b-instruct:free - мощная модель mistral с бесплатным доступом
 * Fallback: openai/gpt-oss-20b:free - альтернатива на базе GPT
 */
export const openRouterConfig: OpenRouterModelConfig = {
  model: 'mistralai/mistral-small-3.2-24b-instruct:free', // Основная бесплатная модель mistral
  temperature: 0.7,    // Средняя креативность для баланса качества и разнообразия
  maxTokens: 2000,     // Достаточно для подробных анализов
  timeout: 30000,      // 30 секунд таймаут
  maxRetries: 3,       // 3 попытки при ошибках
  baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
  retryDelayMs: 1000,  // Базовая задержка 1 секунда
  retryJitterMs: 500   // Случайная добавка до 500мс
};

/** Конфигурация fallback модели */
export const openRouterFallbackConfig: OpenRouterModelConfig = {
  model: 'openai/gpt-oss-20b:free', // Fallback модель
  temperature: 0.7,
  maxTokens: 2000,
  timeout: 30000,
  maxRetries: 2,       // Меньше попыток для fallback
  baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
  retryDelayMs: 1000,  // Базовая задержка 1 секунда
  retryJitterMs: 500   // Случайная добавка до 500мс
};


/**
 * Конфигурации для анализа субтитров
 */
export const analysisConfigs = {
  translation: {
    ...openRouterConfig,
    temperature: 0.4, // Умеренная температура для качественных переводов
    maxTokens: 2000
  }
} as const;

/**
 * Конфигурация загрузки файлов субтитров
 *
 * Поддерживает основные форматы субтитров:
 * - SRT (SubRip) - самый распространенный
 * - VTT (WebVTT) - для веб-приложений
 * - TXT - обычный текст
 */
export const fileUploadConfig: FileUploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB - достаточно для больших фильмов
  maxFileSizeMB: 10,
  allowedExtensions: ['.srt', '.vtt', '.txt'],
  allowedMimeTypes: [
    'text/plain',              // Для .txt файлов
    'application/octet-stream', // Для .srt, .vtt файлов
    'text/vtt'                 // Специфично для WebVTT
  ]
};

/**
 * Конфигурация сервиса сленга (Urban Dictionary)
 *
 * Параметры для оптимизации работы с внешним API:
 * - Кеширование результатов на 1 час
 * - Ограничение количества результатов для управляемости
 * - Таймауты и повторные попытки для надежности
 */
export const slangConfig: SlangConfig = {
  cacheTTL: 3600000,     // 1 час кеширования
  apiLimit: 2,          // Максимум 2 результата от API
  timeout: 10000,       // 10 секунд таймаут
  maxRetries: 2         // 2 повторные попытки при ошибках
};

/**
 * Конфигурация ограничения частоты запросов (Rate Limiting)
 *
 * Защищает API от перегрузки и злоупотреблений:
 * - 100 запросов за 15 минут с одного IP
 * - Предотвращает DDoS атаки и чрезмерное использование
 */
export const rateLimitConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 минут - скользящее окно
  max: 100, // Максимум 100 запросов за окно с одного IP
  message: 'Слишком много запросов с этого IP, попробуйте позже.',
  standardHeaders: true,    // Добавлять стандартные заголовки RateLimit
  legacyHeaders: false      // Не добавлять устаревшие заголовки
};

/**
 * Загружает и валидирует конфигурацию приложения из переменных окружения
 *
 * Читает переменные окружения и создает структурированную конфигурацию
 * с значениями по умолчанию для опциональных параметров
 */
export function loadAppConfig(): AppConfig {
  const config: AppConfig = {
    port: parseInt(process.env['PORT'] || '3001'),
    nodeEnv: (process.env['NODE_ENV'] as AppConfig['nodeEnv']) || 'development',
    frontendUrl: process.env['FRONTEND_URL'] || 'http://localhost:3000',
    openRouterToken: process.env['OPENROUTER_API_KEY'] || '',
    requestTimeout: 30000
  };

  // Валидируем загруженную конфигурацию
  validateConfig(config);

  return config;
}

/**
 * Валидирует конфигурацию приложения
 *
 * Проверяет обязательные параметры и корректность значений:
 * - Наличие и валидность OPENROUTER_API_KEY
 * - Корректность порта сервера
 * - Допустимое значение NODE_ENV
 */
export function validateConfig(config: AppConfig): void {
  const errors: string[] = [];

  // Проверка токена OpenRouter (новый приоритетный)
  if (!config.openRouterToken) {
    errors.push('Переменная окружения OPENROUTER_API_KEY обязательна');
  }

  if (config.openRouterToken.length < 10) {
    errors.push('OPENROUTER_API_KEY выглядит некорректно (слишком короткий)');
  }


  // Проверка порта
  if (config.port < 1000 || config.port > 9999) {
    errors.push('PORT должен быть между 1000 и 9999');
  }

  // Проверка окружения
  if (!['development', 'production', 'test'].includes(config.nodeEnv)) {
    errors.push('NODE_ENV должен быть development, production или test');
  }

  // Если есть ошибки, выбрасываем исключение с детальным описанием
  if (errors.length > 0) {
    throw new Error(`Валидация конфигурации не удалась:\n${errors.join('\n')}`);
  }
}

/**
 * Получает конфигурацию анализа по типу
 *
 * Возвращает оптимизированные параметры для конкретного типа анализа:
 * - difficulty, vocabulary, grammar, comprehensive, topics
 */
export function getAnalysisConfig(type: keyof typeof analysisConfigs) {
  return analysisConfigs[type];
}

/**
 * Получает информацию о текущей модели AI
 *
 * Возвращает информацию о основной и fallback моделях для отображения в API
 */
export function getCurrentModelInfo() {
  return {
    primary: {
      name: 'mistralai/mistral-small-3.2-24b-instruct:free',
      provider: 'Mistral',
      description: 'Основная бесплатная модель Mistral с высоким качеством анализа'
    },
    fallback: {
      name: 'openai/gpt-oss-20b:free',
      provider: 'OpenAI',
      description: 'Резервная модель на базе GPT для обеспечения доступности'
    },
    displayName: 'mistral-small-3.2-24b-instruct + GPT-OSS-20B (fallback)'
  };
}

/**
 * SINGLETON ПАТТЕРН ДЛЯ КОНФИГУРАЦИИ ПРИЛОЖЕНИЯ
 *
 * Ленивая инициализация - конфигурация загружается только при первом использовании.
 * Это гарантирует:
 * - Загрузку конфигурации один раз при старте приложения
 * - Валидацию конфигурации до начала работы сервисов
 * - Экономию ресурсов при повторных вызовах
 */
let appConfigInstance: AppConfig | null = null;

/**
 * Получить единственный экземпляр конфигурации приложения
 *
 * Используется во всем приложении для обеспечения консистентности настроек
 */
export function getAppConfig(): AppConfig {
  if (!appConfigInstance) {
    appConfigInstance = loadAppConfig();
  }
  return appConfigInstance;
}

