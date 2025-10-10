
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
 * Кастомная ошибка приложения
 * Расширяет стандартную Error дополнительными полями
 */
export interface AppError {
  message: string;      // Сообщение об ошибке
  statusCode: number;   // HTTP статус код
  isOperational: boolean; // Операционная ошибка (не программная)
}

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
 * Конфигурация rate limiting
 * Параметры для защиты от перегрузки API
 */
export interface RateLimitConfig {
  windowMs: number;      // Размер окна в миллисекундах
  max: number;           // Максимум запросов в окне
  message: string;       // Сообщение при превышении лимита
  standardHeaders: boolean; // Добавлять стандартные заголовки
  legacyHeaders: boolean; // Добавлять устаревшие заголовки
}


/**
 * Сегмент перевода - логический фрагмент для перевода
 */
export interface TranslationSegment {
  text: string;                  // Текст сегмента
  difficulty: {                  // Уровень сложности сегмента
    cefr: string;                // CEFR уровень (B1, C1, etc.)
  };
  features: {                    // Грамматические особенности
    rule: string;                // Название правила на английском
    russian: string;             // Название правила на русском
  }[];
}

/**
 * Вариант перевода
 */
export interface TranslationVariant {
  style: 'natural' | 'literal';  // Стиль перевода
  text: string;                  // Текст перевода
}

/**
 * Карточка сленга из Urban Dictionary
 */
export interface SlangCard {
  term: string;                  // Термин (например, "gonna")
  ud: {                          // Данные из UD
    definition: string;            // Определение
    example: string;               // Пример использования
    permalink: string;             // Ссылка на UD
  };
}

/**
 * Интерфейс перевода предложения
 */
export interface TranslationGuide {
  segment: TranslationSegment;    // Сегмент для перевода
  translations: {                 // Варианты перевода и объяснение
    variants: TranslationVariant[];
    explanation: string;          // Объяснение грамматики и перевода
  };
  slang: SlangCard[];             // Карточки сленга
}

/**
 * Базовая структура анализа текста (общие поля)
 */
interface BaseAnalysis {
  text: string;                   // анализируемый текст
  cefr: string;                   // уровень сложности (A1, A2, B1, B2, C1, C2)
  features: GrammarFeature[];     // грамматические особенности
  translations: TranslationVariant[]; // варианты перевода
  explanation: string;            // объяснение грамматики и перевода
}

/**
 * Ответ ИИ на анализ предложения (сырые данные)
 */
export interface AIAnalysisResponse extends BaseAnalysis {
  slang: string[];                // термины сленга для дальнейшего обогащения
}

/**
 * Результат анализа текста (готовый для фронтенда)
 */
export interface AnalysisResult extends BaseAnalysis {
  slang: SlangCard[];             // готовые карточки сленга
}

/**
 * Грамматическая особенность (псевдоним для лучшей читаемости)
 */
export type GrammarFeature = {
  rule: string;                   // название правила на английском
  russian: string;                // название правила на русском
};

// Ре-экспорт типов OpenRouter для удобства импорта
export * from './openRouterTypes';