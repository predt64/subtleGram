import { ref, computed, watch } from 'vue'
import type { Ref } from 'vue'
import { subtitlesApi, apiUtils, type SubtitleFile, type ApiResponse, type UploadResponseData } from '@/entities/subtitle'

/**
 * Ключи для localStorage
 */
const STORAGE_KEYS = {
  SUBTITLES: 'subtitles',
  FILENAME: 'filename',
  UPLOAD_STATE: 'uploadState'
} as const

/**
 * Типы для сохраненных данных
 */
interface StoredData {
  subtitles: SubtitleFile[]
  filename: string
  uploadState: UploadState
}

/**
 * Состояния загрузки
 */
export type UploadState = 'idle' | 'uploading' | 'success' | 'error'

/**
 * Вспомогательные функции для localStorage
 */
const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn('Не удалось сохранить в localStorage:', error)
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn('Не удалось удалить из localStorage:', error)
    }
  }
}

/**
 * Загрузка сохраненных данных из localStorage
 */
const loadStoredData = (): Partial<StoredData> => {
  return {
    subtitles: storage.get(STORAGE_KEYS.SUBTITLES, []),
    filename: storage.get(STORAGE_KEYS.FILENAME, ''),
    uploadState: storage.get(STORAGE_KEYS.UPLOAD_STATE, 'idle')
  }
}

/**
 * Сохранение данных в localStorage
 */
const saveStoredData = (data: Partial<StoredData>): void => {
  if (data.subtitles !== undefined) {
    storage.set(STORAGE_KEYS.SUBTITLES, data.subtitles)
  }
  if (data.filename !== undefined) {
    storage.set(STORAGE_KEYS.FILENAME, data.filename)
  }
  if (data.uploadState !== undefined) {
    storage.set(STORAGE_KEYS.UPLOAD_STATE, data.uploadState)
  }
}

/**
 * Composable для работы с загрузкой файлов субтитров
 */
export function useFileUpload() {
  // Загружаем сохраненные данные
  const storedData = loadStoredData()

  // Реактивные состояния
  const uploadState: Ref<UploadState> = ref(storedData.uploadState || 'idle')
  const uploadedFile: Ref<File | null> = ref(null)
  const subtitles: Ref<SubtitleFile[]> = ref(storedData.subtitles || [])
  const filename: Ref<string> = ref(storedData.filename || '')
  const error: Ref<string | null> = ref(null)
  const isDragOver: Ref<boolean> = ref(false)

  // Вычисляемые свойства
  const isUploading = computed(() => uploadState.value === 'uploading')
  const hasFile = computed(() => uploadedFile.value !== null)
  const hasSubtitles = computed(() => subtitles.value.length > 0)

  /**
   * Настройка автоматического сохранения в localStorage
   */
  watch(subtitles, (newSubtitles) => {
    saveStoredData({ subtitles: newSubtitles })
  }, { deep: true })

  watch(filename, (newFilename) => {
    saveStoredData({ filename: newFilename })
  })

  watch(uploadState, (newState) => {
    saveStoredData({ uploadState: newState })
  })

  /**
   * Обработка события drag over
   */
  const handleDragOver = (event: DragEvent): void => {
    event.preventDefault()
    event.stopPropagation()
    isDragOver.value = true
  }

  /**
   * Обработка события drag leave
   */
  const handleDragLeave = (event: DragEvent): void => {
    event.preventDefault()
    event.stopPropagation()
    isDragOver.value = false
  }

  /**
   * Обработка события drop
   */
  const handleDrop = (event: DragEvent): void => {
    event.preventDefault()
    event.stopPropagation()
    isDragOver.value = false

    const files = event.dataTransfer?.files
    if (files && files.length > 0 && files[0]) {
      handleFileSelect(files[0])
    }
  }

  /**
   * Обработка выбора файла через input
   */
  const handleFileSelect = (file: File): void => {
    // Валидация файла
    if (!isValidSubtitleFile(file)) {
      error.value = 'Пожалуйста, выберите файл субтитров (.srt, .vtt или .txt)'
      return
    }

    uploadedFile.value = file
    error.value = null
    uploadFile()
  }

  /**
   * Валидация файла субтитров
   */
  const isValidSubtitleFile = (file: File | null): boolean => {
    if (!file) return false

    const validExtensions = ['.srt', '.vtt', '.txt']
    const validMimeTypes = ['text/plain', 'application/octet-stream', 'text/vtt']

    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    const isValidExtension = validExtensions.includes(fileExtension)
    const isValidMimeType = validMimeTypes.includes(file.type)

    return isValidExtension || isValidMimeType
  }

  /**
   * Загрузка файла на сервер
   */
  const uploadFile = async (): Promise<void> => {
    if (!uploadedFile.value) return

    uploadState.value = 'uploading'
    error.value = null

    try {
      // Используем API клиент
      const result = await subtitlesApi.uploadFile(uploadedFile.value)

      // Сохраняем данные
      subtitles.value = result.data!.subtitles
      filename.value = result.data!.filename
      uploadState.value = 'success'

      // Сохраняем в localStorage
      saveStoredData({
        subtitles: result.data!.subtitles,
        filename: result.data!.filename,
        uploadState: 'success'
      })

      console.log(`Файл "${filename.value}" успешно загружен. Субтитров: ${subtitles.value.length}`)

    } catch (err) {
      console.error('Ошибка загрузки:', err)
      error.value = apiUtils.handleApiError(err, 'Произошла ошибка при загрузке файла')
      uploadState.value = 'error'
    }
  }

  /**
   * Сброс состояния
   */
  const reset = (): void => {
    uploadState.value = 'idle'
    uploadedFile.value = null
    subtitles.value = []
    filename.value = ''
    error.value = null
    isDragOver.value = false

    // Очищаем localStorage
    storage.remove(STORAGE_KEYS.SUBTITLES)
    storage.remove(STORAGE_KEYS.FILENAME)
    storage.remove(STORAGE_KEYS.UPLOAD_STATE)
  }

  /**
   * Анализ конкретного предложения
   */
  const analyzeSentence = async (
    sentenceText: string,
    context?: { prev: string; next: string }
  ): Promise<ApiResponse<any> | null> => {
    if (!hasSubtitles.value) return null

    try {
      const result = await subtitlesApi.analyzeSubtitles(
        subtitles.value,
        sentenceText,
        context
      )

      return result
    } catch (err) {
      console.error('Ошибка анализа:', err)
      const errorMessage: string = err instanceof Error ? err.message : 'Произошла ошибка при анализе'
      error.value = errorMessage
      return null
    }
  }

  /**
   * Проверка доступности API
   */
  const checkApiHealth = async (): Promise<boolean> => {
    try {
      await subtitlesApi.checkMainHealth()
      return true
    } catch {
      return false
    }
  }

  /**
   * Повторная загрузка
   */
  const retry = (): void => {
    if (uploadedFile.value) {
      uploadFile()
    }
  }

  return {
    // Состояния
    uploadState,
    uploadedFile,
    subtitles,
    filename,
    error,
    isDragOver,
    isUploading,
    hasFile,
    hasSubtitles,

    // Методы
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    uploadFile,
    analyzeSentence,
    checkApiHealth,
    reset,
    retry,
  }
}
