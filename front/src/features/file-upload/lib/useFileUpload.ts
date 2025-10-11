import { computed } from 'vue'
import { subtitleApi } from '@/shared/api/subtitleApi'
import { useSubtitleStore } from '@/entities/subtitle'
import { useUploadStore } from '@/features/file-upload/stores'

/**
 * Composable для работы с загрузкой файлов субтитров
 * Предоставляет реактивное состояние и методы для управления процессом загрузки
 * @returns Объект с состоянием, геттерами и методами для работы с файлами
 */
export function useFileUpload() {
  const subtitleStore = useSubtitleStore()
  const uploadStore = useUploadStore()

  let dragCounter = 0

  const uploadState = computed(() => uploadStore.uploadState)
  const uploadedFile = computed(() => uploadStore.uploadedFile)
  const sentenceCards = computed(() => subtitleStore.sentenceCards)
  const filename = computed(() => subtitleStore.filename)
  const error = computed(() => uploadStore.error)
  const isDragOver = computed(() => uploadStore.isDragOver)

  const isUploading = computed(() => uploadStore.isUploading)
  const isLoading = computed(() => subtitleStore.isLoading)
  const hasFile = computed(() => uploadStore.hasFile)
  const hasSubtitles = computed(() => subtitleStore.hasSubtitles)


  /**
   * Обработка события dragenter для зоны загрузки
   * Использует счетчик для правильной работы с дочерними элементами
   * @param event - событие DragEvent
   */
  const handleDragEnter = (event: DragEvent): void => {
    event.preventDefault()
    event.stopPropagation()
    dragCounter++
    if (dragCounter === 1) {
      uploadStore.setDragOver(true)
    }
  }

  /**
   * Обработка события dragover для зоны загрузки
   * Необходим для корректной работы drop события
   * @param event - событие DragEvent
   */
  const handleDragOver = (event: DragEvent): void => {
    event.preventDefault()
    event.stopPropagation()
    // dragover нужен для разрешения drop
  }

  /**
   * Обработка события dragleave для зоны загрузки
   * Использует счетчик для правильной работы с дочерними элементами
   * @param event - событие DragEvent
   */
  const handleDragLeave = (event: DragEvent): void => {
    event.preventDefault()
    event.stopPropagation()
    dragCounter--
    if (dragCounter === 0) {
      uploadStore.setDragOver(false)
    }
  }

  /**
   * Обработка события drop - пользователь бросил файл в зону загрузки
   * @param event - событие DragEvent с файлами
   */
  const handleDrop = (event: DragEvent): void => {
    event.preventDefault()
    dragCounter = 0
    uploadStore.setDragOver(false)

    const file = event.dataTransfer?.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  /**
   * Обработка выбора файла пользователем (через input или drag&drop)
   * Выполняет валидацию и начинает загрузку
   * @param file - выбранный файл
   */
  const handleFileSelect = (file: File): void => {
    if (!isValidSubtitleFile(file)) {
      uploadStore.setError('Пожалуйста, выберите файл субтитров (.srt, .vtt или .txt)')
      return
    }

    uploadStore.setUploadedFile(file)
    uploadStore.setError(null)
    uploadFile()
  }

  /**
   * Проверяет, является ли файл допустимым для загрузки субтитров
   * @param file - файл для проверки
   * @returns true если файл валиден
   */
  const isValidSubtitleFile = (file: File): boolean => {
    const validExtensions = ['srt', 'vtt', 'txt'] as const
    const validMimeTypes = ['text/plain', 'text/vtt'] as const

    const extension = file.name.toLowerCase().split('.').pop()
    console.log('isValidSubtitleFile', extension)
    const isValidExtension = extension ? validExtensions.includes(extension as any) : false
    const isValidMimeType = validMimeTypes.includes(file.type as any)

    return isValidExtension || isValidMimeType
  }

  /**
   * Загружает файл субтитров на сервер и обрабатывает результат
   */
  const uploadFile = async (): Promise<void> => {
    const file = uploadStore.uploadedFile
    if (!file) return

    uploadStore.setUploading()

    try {
      const result = await subtitleApi.uploadFile(file)

      if (!result.data?.subtitles || !result.data?.filename) {
        throw new Error('Некорректный ответ сервера')
      }

      subtitleStore.setSubtitles(result.data.subtitles, result.data.filename)
      uploadStore.setSuccess()

      console.log(`Файл "${subtitleStore.filename}" успешно загружен. Предложений: ${sentenceCards.value.length}`)

    } catch (err) {
      console.error('Ошибка загрузки файла:', err)
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка при загрузке файла'
      uploadStore.setUploadError(errorMessage)
    }
  }

  /**
   * Сбрасывает все состояние загрузки к начальному
   * Очищает файлы, ошибки, субтитры и drag-n-drop счетчик
   */
  const reset = (): void => {
    uploadStore.reset()
    subtitleStore.clear()
    dragCounter = 0 // Сбрасываем счетчик drag-n-drop
  }

  /**
   * Повторяет загрузку файла при ошибке
   * Использует ранее выбранный файл без необходимости выбора заново
   */
  const retry = (): void => {
    const file = uploadStore.uploadedFile
    if (file) {
      uploadStore.setError(null)
      uploadFile()
    }
  }

  /**
   * Экспортируемые свойства и методы composable
   */
  return {
    // Состояния
    uploadState,
    uploadedFile,
    sentenceCards,
    filename,
    error,
    isDragOver,
    isUploading,
    isLoading,
    hasFile,
    hasSubtitles,

    // Методы
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    reset,
    retry,
    // Доступ к stores для других компонентов
    subtitleStore,
    uploadStore,
  }
}
