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
