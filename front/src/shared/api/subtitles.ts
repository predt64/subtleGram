const API_BASE_URL = 'http://localhost:3001/api'

import type {
  ApiResponse,
  SubtitleFile,
  UploadResponseData,
  UploadError,
  AnalyzeResponseData
} from '@/shared/types'

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
    sentenceText: string,
    context?: { prev: string; next: string },
    seriesName?: string,
    signal?: AbortSignal
  ): Promise<ApiResponse<AnalyzeResponseData>> {
    const requestData = {
      sentenceText,
      context: context || { prev: '', next: '' },
      ...(seriesName && { seriesName })
    }

    const response = await fetch(`${API_BASE_URL}/subtitles/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
      signal, // AbortSignal для отмены запроса
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
}