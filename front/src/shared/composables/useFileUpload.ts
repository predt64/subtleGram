import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import { subtitlesApi, apiUtils, type SubtitleFile, type ApiResponse, type UploadResponseData } from '../lib/api'

/**
 * Состояния загрузки
 */
export type UploadState = 'idle' | 'uploading' | 'success' | 'error'

/**
 * Composable для работы с загрузкой файлов субтитров
 */
export function useFileUpload() {
  // Реактивные состояния
  const uploadState: Ref<UploadState> = ref('idle')
  const uploadedFile: Ref<File | null> = ref(null)
  const subtitles: Ref<SubtitleFile[]> = ref([])
  const filename: Ref<string> = ref('')
  const error: Ref<string | null> = ref(null)
  const isDragOver: Ref<boolean> = ref(false)

  // Вычисляемые свойства
  const isUploading = computed(() => uploadState.value === 'uploading')
  const hasFile = computed(() => uploadedFile.value !== null)
  const hasSubtitles = computed(() => subtitles.value.length > 0)

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
