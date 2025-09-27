const API_BASE_URL = 'http://localhost:3001/api'

import { useSubtitleStore } from '@/shared/stores/subtitle'
import { useUploadStore } from '@/shared/stores/upload'

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
 * API клиент для работы с субтитрами
 */
export const subtitlesApi = {
  /**
   * Загрузка файла субтитров
   */
  async uploadFile(file: File): Promise<ApiResponse<UploadResponseData>> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE_URL}/subtitles/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  },

  /**
   * Анализ субтитров
   */
  async analyzeSubtitles(
    subtitles: SubtitleFile[],
    sentenceText: string,
    context?: { prev: string; next: string }
  ): Promise<ApiResponse<any>> {
    const requestData = {
      subtitles,
      sentence: sentenceText,
      context: context || { prev: '', next: '' }
    }

    const response = await fetch(`${API_BASE_URL}/subtitles/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  },

  /**
   * Проверка здоровья основного API
   */
  async checkHealth(): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  },

  /**
   * Проверка здоровья API субтитров
   */
  async checkMainHealth(): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/subtitles/health`, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  },
}

/**
 * Утилиты для работы с API
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
      await subtitlesApi.checkHealth()
      return true
    } catch {
      return false
    }
  },

  /**
   * Очистка данных загрузки
   */
  clearUploadData(): void {
    // VueUse автоматически управляет sessionStorage в stores,
    // поэтому просто очищаем stores
    const subtitleStore = useSubtitleStore()
    const uploadStore = useUploadStore()

    subtitleStore.clear()
    uploadStore.reset()
  },
}
