/**
 * Типы API ответов
 */

/**
 * Стандартный ответ API
 * Используется для всех HTTP ответов приложения
 */
export interface ApiResponse<T = any> {
  success: boolean;     // Успешность операции
  message: string;      // Сообщение пользователю
  data?: T;            // Данные ответа (опционально)
  errors?: any;        // Ошибки (опционально)
  timestamp?: string;  // Временная метка (в режиме разработки)
}

/**
 * Типы субтитров
 */

/**
 * Отдельная запись субтитра
 * Представляет одну строку субтитров с временными метками
 */
export interface SubtitleEntry {
  id: number;      // Уникальный идентификатор субтитра
  start: string;   // Время начала показа (формат: "00:00:00,000")
  end: string;     // Время окончания показа (формат: "00:00:00,000")
  text: string;    // Текст субтитра
}

/**
 * Ответ с разобранными субтитрами
 * Возвращается после успешного парсинга файла субтитров
 */
export interface ParsedSubtitlesResponse {
  filename: string;           // Имя загруженного файла
  subtitlesCount: number;     // Общее количество субтитров
  subtitles: SubtitleEntry[]; // Массив всех субтитров
}


/**
 * Типы загрузки файлов
 */

/**
 * Загруженный файл через Multer
 * Представляет файл, полученный через multipart/form-data
 */
export interface UploadedFile {
  fieldname: string;    // Имя поля формы
  originalname: string; // Оригинальное имя файла
  encoding: string;     // Кодировка файла
  mimetype: string;     // MIME тип файла
  buffer: Buffer;       // Содержимое файла в памяти
  size: number;         // Размер файла в байтах
}

/**
 * Типы конфигурации окружения
 */

/**
 * Конфигурация переменных окружения
 * Определяет все доступные переменные среды
 */
export interface EnvironmentConfig {
  PORT: number;                    // Порт сервера
  NODE_ENV: 'development' | 'production' | 'test'; // Окружение Node.js
  HF_TOKEN: string;               // Токен Hugging Face API
  MAX_FILE_SIZE: number;          // Максимальный размер файла
  UPLOAD_DIR: string;             // Директория для загрузок
  FRONTEND_URL: string;           // URL фронтенд приложения
  LOG_LEVEL: string;              // Уровень логирования
}

/**
 * Типы ошибок
 */

/**
 * Кастомная ошибка приложения
 * Расширяет стандартную Error дополнительными полями
 */
export interface AppError {
  message: string;      // Сообщение об ошибке
  statusCode: number;   // HTTP статус код
  isOperational: boolean; // Операционная ошибка (не программная)
}

/**
 * Типы сервисов
 */

/**
 * Конфигурация Hugging Face API
 * Параметры для взаимодействия с AI моделями
 */
export interface HuggingFaceConfig {
  token: string;       // API токен
  model: string;       // Название модели
  maxRetries: number;  // Максимум повторных попыток
  timeout: number;     // Таймаут запросов
}

/**
 * Типы валидации
 */

/**
 * Результат валидации данных
 * Возвращается функциями проверки корректности
 */
export interface ValidationResult {
  isValid: boolean;   // Корректны ли данные
  errors: string[];   // Массив ошибок валидации
  warnings: string[]; // Массив предупреждений
}

/**
 * Типы проверки здоровья системы
 */

/**
 * Ответ health check эндпоинта
 * Показывает статус всех компонентов системы
 */
export interface HealthCheckResponse {
  status: string;     // Статус системы ("OK", "ERROR", etc.)
  timestamp: string;  // Время проверки
  environment: string; // Текущее окружение
  services?: {        // Статус отдельных сервисов
    database?: boolean;   // Статус базы данных
    ai?: boolean;         // Статус AI сервисов
    fileSystem?: boolean; // Статус файловой системы
  };
}

/**
 * Типы ограничения частоты запросов
 */

/**
 * Конфигурация rate limiting
 * Параметры для защиты от перегрузки API
 */
export interface RateLimitConfig {
  windowMs: number;      // Размер окна в миллисекундах
  max: number;           // Максимум запросов в окне
  message: string;       // Сообщение при превышении лимита
  standardHeaders: boolean; // Добавлять стандартные заголовки
  legacyHeaders: false;  // Добавлять устаревшие заголовки
}

/**
 * Типы CORS настроек
 */

/**
 * Конфигурация Cross-Origin Resource Sharing
 * Параметры для настройки CORS политики
 */
export interface CORSConfig {
  origin: string | string[]; // Разрешенные источники
  methods: string[];         // Разрешенные HTTP методы
  allowedHeaders: string[];  // Разрешенные заголовки
  credentials: boolean;      // Разрешать credentials
}

/**
 * Типы логирования
 */

/**
 * Запись в логе приложения
 * Структурированная запись для системы логирования
 */
export interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug'; // Уровень важности
  message: string;        // Сообщение лога
  timestamp: string;      // Время записи
  service: string;        // Название сервиса/модуля
  userId?: string;        // ID пользователя (опционально)
  requestId?: string;     // ID запроса для трассировки
  metadata?: Record<string, any>; // Дополнительные данные
}

/**
 * Типы пагинации
 */

/**
 * Параметры пагинации для запросов со списками
 * Используется для постраничной загрузки данных
 */
export interface PaginationParams {
  page: number;           // Номер страницы (начиная с 1)
  limit: number;          // Количество элементов на странице
  sort?: string;          // Поле для сортировки
  order?: 'asc' | 'desc'; // Порядок сортировки
}

/**
 * Ответ с пагинированными данными
 * Расширяет стандартный ApiResponse информацией о пагинации
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;     // Текущая страница
    limit: number;    // Элементов на странице
    total: number;    // Общее количество элементов
    pages: number;    // Общее количество страниц
    hasNext: boolean; // Есть ли следующая страница
    hasPrev: boolean; // Есть ли предыдущая страница
  };
}

/**
 * Типы middleware
 */

/**
 * Асинхронный обработчик Express запросов
 * Для middleware функций, которые могут содержать await
 */
export type AsyncRequestHandler = (
  req: import('express').Request,
  res: import('express').Response,
  next: import('express').NextFunction
) => Promise<void>;

/**
 * Синхронный обработчик Express запросов
 * Для обычных middleware функций без асинхронности
 */
export type RequestHandler = (
  req: import('express').Request,
  res: import('express').Response,
  next: import('express').NextFunction
) => void;

/**
 * Утилитарные типы TypeScript
 */

/**
 * Делает указанные поля интерфейса опциональными
 * Остальные поля остаются обязательными
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Делает указанные поля интерфейса обязательными
 * Остальные поля могут быть опциональными
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Рекурсивно делает все поля интерфейса опциональными
 * Включая вложенные объекты и массивы
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Сегмент перевода - логический фрагмент для перевода
 */
export interface TranslationSegment {
  id: string;                    // Уникальный ID сегмента
  wordStart: number;             // Начальный индекс слова
  wordEnd: number;               // Конечный индекс слова
  text: string;                  // Текст сегмента
  reasoning: string[];           // Причины объединения (например, ["parcellation_continuation"])
  links?: { dependsOnSegmentId?: string; }; // Зависимости от других сегментов
  difficulty: {                  // Уровень сложности сегмента
    cefr: string;                // CEFR уровень (B1, C1, etc.)
    score: number;               // Оценка 1-10
    factors: string[];           // Факторы (["idiom", "colloquial"])
  };
  features: string[];            // Особенности (["idiom", "slang_like"])
}

/**
 * Вариант перевода
 */
export interface TranslationVariant {
  style: 'natural' | 'literal';  // Стиль перевода
  text: string;                  // Текст перевода
  confidence: number;            // Уверенность 0-1
}

/**
 * Карточка сленга из Urban Dictionary
 */
export interface SlangCard {
  tokenId: number;               // ID токена, к которому относится
  term: string;                  // Термин (например, "gonna")
  ud: {                          // Данные из UD
    definition: string;            // Определение
    example: string;               // Пример использования
    permalink: string;             // Ссылка на UD
  };
}

/**
 * Полный гид перевода для клика
 */
export interface TranslationGuide {
  segments: TranslationSegment[]; // Сегменты для перевода
  translations: {                // Переводы по сегментам
    segmentId: string;
    variants: TranslationVariant[];
    explanation?: {              // Объяснение для сложных случаев
      type: string;                // Тип (например, "idiom_or_reference")
      summary: string;             // Краткое описание
      details: string;             // Детали
      notes: string[];             // Заметки
    };
  }[];
  slang: SlangCard[];            // Карточки сленга
}