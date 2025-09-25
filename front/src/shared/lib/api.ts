/**
 * API клиент для SubtleGram
 * Централизованные функции для работы с backend API
 */

// Базовая конфигурация
const API_BASE_URL = 'http://localhost:3001/api'

/**
 * Типы данных для ответов API
 */
export interface ApiResponse<T = any> {
  success?: boolean
  message: string
  data?: T
  error?: string
  details?: any
  warnings?: string[]
}

export interface SubtitleFile {
  id: number
  start: string
  end: string
  text: string
}

export interface UploadResponseData {
  filename: string
  subtitlesCount: number
  subtitles: SubtitleFile[]
}

export interface UploadError {
  error: string
  message: string
  details?: any
}

/**
 * API функции для работы с субтитрами
 */
export const subtitlesApi = {
  /**
   * Загрузка файла субтитров
   * POST /api/subtitles/upload
   */
  async uploadFile(file: File): Promise<ApiResponse<UploadResponseData>> {
    try {
      const formData = new FormData()
      formData.append('subtitle', file)

      const response = await fetch(`${API_BASE_URL}/subtitles/upload`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error((result as UploadError).message || 'Ошибка загрузки файла')
      }

      return result as ApiResponse<UploadResponseData>
    } catch (error) {
      console.error('API Error (uploadFile):', error)
      throw error
    }
  },

  /**
   * Анализ субтитров с помощью Qwen AI
   * POST /api/subtitles/analyze
   */
  async analyzeSubtitles(
    subtitles: SubtitleFile[],
    sentenceText: string,
    context?: { prev: string; next: string }
  ): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/subtitles/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subtitles,
          sentenceText,
          context,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Ошибка анализа')
      }

      return result as ApiResponse<any>
    } catch (error) {
      console.error('API Error (analyzeSubtitles):', error)
      throw error
    }
  },

  /**
   * Проверка статуса сервиса
   * GET /api/subtitles/health
   */
  async checkHealth(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/subtitles/health`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error('Сервис недоступен')
      }

      return result as ApiResponse<any>
    } catch (error) {
      console.error('API Error (checkHealth):', error)
      throw error
    }
  },

  /**
   * Проверка основного health endpoint
   * GET /health
   */
  async checkMainHealth(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch('http://localhost:3001/health')
      const result = await response.json()

      if (!response.ok) {
        throw new Error('Сервер недоступен')
      }

      return result as ApiResponse<any>
    } catch (error) {
      console.error('API Error (checkMainHealth):', error)
      throw error
    }
  },
}

/**
 * Общие утилиты для работы с API
 */
export const apiUtils = {
  /**
   * Обработка ошибок API
   */
  handleApiError(error: any, defaultMessage: string = 'Произошла ошибка'): string {
    if (error instanceof Error) {
      return error.message
    }
    if (typeof error === 'string') {
      return error
    }
    if (error?.message) {
      return error.message
    }
    return defaultMessage
  },

  /**
   * Проверка доступности API
   */
  async checkApiAvailability(): Promise<boolean> {
    try {
      await subtitlesApi.checkMainHealth()
      return true
    } catch {
      return false
    }
  },
}
