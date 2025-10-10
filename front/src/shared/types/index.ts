/**
 * Структура субтитра из файла субтитров (.srt, .vtt, .txt)
 * Представляет одну строку субтитров с временными метками
 */
export interface SubtitleFile {
  id: number
  start: string
  end: string
  text: string
}

/**
 * Универсальный интерфейс ответа от API
 */
export interface ApiResponse<T = any> {
  success?: boolean
  message: string
  data?: T
  error?: string
  details?: any
  warnings?: string[]
}

/**
 * Данные ответа при успешной загрузке файла субтитров
 * Содержит информацию о загруженном файле и его содержимом
 */
export interface UploadResponseData {
  filename: string
  subtitlesCount: number
  subtitles: SubtitleFile[]
}

/**
 * Структура ошибки при загрузке файла
 * Используется когда загрузка файла не удалась
 */
export interface UploadError {
  error: string
  message: string
  details?: any
}

/**
 * Состояния процесса загрузки файла
 * Используется для отслеживания прогресса загрузки в UI
 */
export type UploadState =
  | 'idle'
  | 'uploading'
  | 'success'
  | 'error'


/**
 * Грамматическая особенность - краткое описание
 */
export interface GrammarFeature {
  rule: string    // Название правила на английском
  russian: string // Название правила на русском
}

/**
 * Сложность текста по CEFR
 */
export interface Difficulty {
  cefr: string // "B1", "C1" etc
}

/**
 * Сегмент текста для анализа
 */
export interface TranslationSegment {
  text: string
  difficulty: Difficulty
  features: GrammarFeature[]
}

/**
 * Вариант перевода
 */
export interface TranslationVariant {
  style: string // "natural", "formal", "casual" etc
  text: string
}

/**
 * Объяснение перевода - просто строка
 */
export type TranslationExplanation = string

/**
 * Перевод сегмента
 */
export interface TranslationData {
  variants: TranslationVariant[]
  explanation: TranslationExplanation
}

/**
 * Определение сленга из Urban Dictionary
 */
export interface SlangDefinition {
  definition: string
  example: string
  permalink: string
}

/**
 * Карточка сленга
 */
export interface SlangCard {
  term: string
  ud: SlangDefinition
}

/**
 * Результат анализа текста
 */
export interface AnalysisResult {
  text: string
  cefr: string
  features: GrammarFeature[]
  translations: TranslationVariant[]
  explanation: string
  slang: SlangCard[]
}

/**
 * Метаданные анализа
 */
export interface AnalysisMetadata {
  processingTimeMs: number
  timestamp: string
  model: string
  validationWarnings: string[]
}

/**
 * Данные ответа при успешном анализе предложения
 */
export interface AnalyzeResponseData {
  analysis: AnalysisResult
  metadata: AnalysisMetadata
}

/**
 * Состояния процесса анализа
 */
export type AnalysisState =
  | 'idle'
  | 'analyzing'
  | 'success'
  | 'error'