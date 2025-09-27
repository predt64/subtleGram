import { ref, computed, watch, onMounted } from 'vue'
import { useSessionStorage } from '@vueuse/core'
import type { Ref } from 'vue'
import { subtitlesApi, apiUtils, type SubtitleFile, type ApiResponse, type UploadResponseData } from '@/entities/subtitle'
import { useSubtitleStore } from '@/shared/stores/subtitle'
import { useUploadStore } from '@/shared/stores/upload'

/**
 * Состояния загрузки
 */
export type UploadState = 'idle' | 'uploading' | 'success' | 'error'

/**
 * Composable для работы с загрузкой файлов субтитров
 */
export function useFileUpload() {
  // Используем Pinia stores
  const subtitleStore = useSubtitleStore()
  const uploadStore = useUploadStore()

  // Получаем данные из stores
  const uploadState = computed(() => uploadStore.uploadState)
  const uploadedFile = computed(() => uploadStore.uploadedFile)
  const subtitles = computed(() => subtitleStore.subtitles)
  const filename = computed(() => subtitleStore.filename)
  const error = computed(() => uploadStore.error)
  const isDragOver = computed(() => uploadStore.isDragOver)

  // Вычисляемые свойства
  const isUploading = computed(() => uploadStore.isUploading)
  const hasFile = computed(() => uploadStore.hasFile)
  const hasSubtitles = computed(() => subtitleStore.hasSubtitles)


  /**
   * Обработка события drag over
   */
  const handleDragOver = (event: DragEvent): void => {
    event.preventDefault()
    event.stopPropagation()
    uploadStore.setDragOver(true)
  }

  /**
   * Обработка события drag leave
   */
  const handleDragLeave = (event: DragEvent): void => {
    event.preventDefault()
    event.stopPropagation()
    uploadStore.setDragOver(false)
  }

  /**
   * Обработка события drop
   */
  const handleDrop = (event: DragEvent): void => {
    event.preventDefault()
    event.stopPropagation()
    uploadStore.setDragOver(false)

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
      uploadStore.setError('Пожалуйста, выберите файл субтитров (.srt, .vtt или .txt)')
      return
    }

    uploadStore.setUploadedFile(file)
    uploadStore.setError(null)
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
    const file = uploadStore.uploadedFile
    if (!file) return

    uploadStore.setUploading()

    try {
      // Используем API клиент
      const result = await subtitlesApi.uploadFile(file)

      // Сохраняем данные в stores
      subtitleStore.setSubtitles(result.data!.subtitles, result.data!.filename)
      uploadStore.setSuccess()

      console.log(`Файл "${subtitleStore.filename}" успешно загружен. Субтитров: ${subtitleStore.subtitles.length}`)

    } catch (err) {
      console.error('Ошибка загрузки:', err)
      uploadStore.setUploadError(apiUtils.handleApiError(err, 'Произошла ошибка при загрузке файла'))
    }
  }

  /**
   * Сброс состояния
   */
  const reset = (): void => {
    uploadStore.reset()
    subtitleStore.clear()
  }

  /**
   * Анализ конкретного предложения
   */
  const analyzeSentence = async (
    sentenceText: string,
    context?: { prev: string; next: string }
  ): Promise<ApiResponse<any> | null> => {
    if (!subtitleStore.hasSubtitles) return null

    try {
      const result = await subtitlesApi.analyzeSubtitles(
        subtitleStore.subtitles,
        sentenceText,
        context
      )

      return result
    } catch (err) {
      console.error('Ошибка анализа:', err)
      const errorMessage: string = err instanceof Error ? err.message : 'Произошла ошибка при анализе'
      uploadStore.setError(errorMessage)
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
    const file = uploadStore.uploadedFile
    if (file) {
      uploadStore.setUploadedFile(file)
      uploadStore.setError(null)
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
    // Доступ к stores для других компонентов
    subtitleStore,
    uploadStore,
  }
}
