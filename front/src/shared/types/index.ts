/**
 * Структура субтитра из файла субтитров (.srt, .vtt, .txt)
 * Представляет одну строку субтитров с временными метками
 */
export interface SubtitleFile {
  id: number        // Уникальный идентификатор субтитра
  start: string     // Время начала показа (формат: "00:00:00,000")
  end: string       // Время окончания показа (формат: "00:00:00,000")
  text: string      // Текст субтитра
}

/**
 * Универсальный интерфейс ответа от API
 * Используется для стандартизации ответов от всех API endpoints
 */
export interface ApiResponse<T = any> {
  success?: boolean   // Флаг успешности операции
  message: string     // Сообщение для пользователя (успех/ошибка)
  data?: T           // Полезные данные ответа (при успехе)
  error?: string     // Сообщение об ошибке (при неудаче)
  details?: any      // Дополнительные детали ошибки
  warnings?: string[] // Массив предупреждений
}

/**
 * Данные ответа при успешной загрузке файла субтитров
 * Содержит информацию о загруженном файле и его содержимом
 */
export interface UploadResponseData {
  filename: string         // Имя загруженного файла
  subtitlesCount: number   // Общее количество субтитров в файле
  subtitles: SubtitleFile[] // Массив всех субтитров из файла
}

/**
 * Структура ошибки при загрузке файла
 * Используется когда загрузка файла не удалась
 */
export interface UploadError {
  error: string      // Код типа ошибки
  message: string    // Читаемое сообщение об ошибке
  details?: any      // Дополнительная техническая информация
}

/**
 * Состояния процесса загрузки файла
 * Используется для отслеживания прогресса загрузки в UI
 */
export type UploadState =
  | 'idle'      // Ожидание действия пользователя
  | 'uploading' // Идет загрузка файла
  | 'success'   // Загрузка завершена успешно
  | 'error'     // Произошла ошибка загрузки


/**
 * Грамматическая особенность текста
 * Содержит название правила на английском и русском языках
 */
export interface GrammarFeature {
  rule: string    // Название грамматического правила на английском
  russian: string // Название грамматического правила на русском
}

/**
 * Вариант перевода текста
 * Содержит стиль перевода и сам текст перевода
 */
export interface TranslationVariant {
  style: 'natural' | 'literal' | 'formal'  // Стиль перевода
  text: string                            // Текст перевода
}

/**
 * Результат анализа текста ИИ
 * Содержит все данные анализа предложения
 */
export interface AnalysisResult {
  text: string                   // Анализируемый текст
  cefr: string                   // Уровень сложности по CEFR (A1, B1, C1 и т.д.)
  features: GrammarFeature[]     // Грамматические особенности текста
  translations: TranslationVariant[] // Варианты перевода
  explanation: string            // Объяснение грамматики и перевода
  slang: SlangCard[]             // Найденные термины сленга
}

/**
 * Метаданные анализа
 * Служебная информация о процессе анализа
 */
export interface AnalysisMetadata {
  processingTimeMs: number       // Время обработки в миллисекундах
  timestamp: string              // Время выполнения анализа (ISO строка)
  model: string                  // Название использованной модели ИИ
  validationWarnings: string[]   // Предупреждения валидации
}

/**
 * Карточка сленга из Urban Dictionary
 * Содержит термин, определение, пример использования и ссылку
 */
export interface SlangCard {
  term: string                   // Термин сленга
  ud: {                          // Данные из Urban Dictionary
    definition: string           // Определение термина
    example: string              // Пример использования
    permalink: string            // Ссылка на страницу Urban Dictionary
  }
}

/**
 * Данные ответа при успешном анализе предложения
 * Содержит результаты анализа и метаданные
 */
export interface AnalyzeResponseData {
  analysis: AnalysisResult        // Результаты анализа текста
  metadata: AnalysisMetadata     // Метаданные процесса анализа
}

/**
 * Состояния процесса анализа текста
 * Используется для отслеживания прогресса анализа в UI
 */
export type AnalysisState =
  | 'idle'      // Ожидание начала анализа
  | 'analyzing' // Идет анализ текста ИИ
  | 'success'   // Анализ завершен успешно
  | 'error'     // Произошла ошибка анализа