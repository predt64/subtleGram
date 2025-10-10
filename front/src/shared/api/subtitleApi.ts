/**
 * Базовый URL для API сервера
 * Использует переменную окружения или значение по умолчанию для разработки
 */
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api'

import type {
  ApiResponse,
  UploadResponseData,
  AnalyzeResponseData
} from '@/shared/types'

/**
 * Создает AbortController с таймаутом для автоматической отмены запроса
 * @param timeoutMs - время ожидания в миллисекундах (по умолчанию 30 секунд)
 */
function createTimeoutController(timeoutMs: number = 30000): AbortController {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), timeoutMs)
  return controller
}

/**
 * Комбинирует несколько AbortSignal в один
 * @param signals - массив сигналов для комбинации
 */
function combineAbortSignals(signals: (AbortSignal | undefined)[]): AbortSignal {
  const controller = new AbortController()
  const onAbort = () => controller.abort()

  for (const signal of signals) {
    if (signal) {
      signal.addEventListener('abort', onAbort, { once: true })
    }
  }

  return controller.signal
}

/**
 * Обрабатывает HTTP ответ и преобразует ошибки в читаемый формат
 * @param response - HTTP ответ от fetch
 */
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`

    try {
      const errorData = await response.json()
      if (errorData.message) {
        errorMessage = errorData.message
      } else if (errorData.error) {
        errorMessage = errorData.error
      }
    } catch {
      // Если не удается распарсить JSON ошибки, используем стандартное сообщение
    }

    throw new Error(errorMessage)
  }

  return response.json()
}

/**
 * API клиент для работы с бэкендом субтитров
 * Предоставляет методы для загрузки файлов, анализа текста и проверки здоровья API
 */
export const subtitleApi = {
  /**
   * Загружает файл субтитров на сервер для обработки
   * @param file - файл субтитров в формате SRT, VTT или TXT
   * @returns Promise с данными загруженного файла или ошибкой
   */
  async uploadFile(file: File): Promise<ApiResponse<UploadResponseData>> {
    const formData = new FormData()
    formData.append('file', file)

    const timeoutController = createTimeoutController()

    try {
      const response = await fetch(`${API_BASE_URL}/subtitles/upload`, {
        method: 'POST',
        body: formData,
        signal: timeoutController.signal,
      })

      return await handleApiResponse<ApiResponse<UploadResponseData>>(response)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Превышено время ожидания загрузки файла')
      }
      throw error
    }
  },

  /**
   * Отправляет текст предложения на анализ с помощью ИИ
   * @param sentenceText - текст предложения для анализа
   * @param context - контекст предложения (предыдущее и следующее предложения)
   * @param seriesName - название сериала для улучшения анализа
   * @param signal - сигнал для отмены запроса (опционально)
   * @returns Promise с результатами анализа или ошибкой
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

    const timeoutController = createTimeoutController()
    const combinedSignal = combineAbortSignals([
      timeoutController.signal,
      signal
    ].filter(Boolean)) // Фильтруем undefined сигналы

    try {
      const response = await fetch(`${API_BASE_URL}/subtitles/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: combinedSignal,
      })

      return await handleApiResponse<ApiResponse<AnalyzeResponseData>>(response)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Проверяем, от какого сигнала пришел AbortError
        if (signal && signal.aborted) {
          // Отмена от UI - не ошибка, просто пользователь передумал
          throw error
        } else {
          // Таймаут - это реальная проблема, показываем ошибку
          throw new Error('Превышено время ожидания анализа. Попробуйте еще раз.')
        }
      }
      throw error
    }
  },

  /**
   * Проверяет доступность и здоровье API сервера
   * @returns Promise с информацией о статусе API или ошибкой
   */
  async checkHealth(): Promise<ApiResponse<any>> {
    const timeoutController = createTimeoutController()

    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: timeoutController.signal,
      })

      return await handleApiResponse<ApiResponse<any>>(response)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Превышено время ожидания проверки API')
      }
      throw error
    }
  },
}

