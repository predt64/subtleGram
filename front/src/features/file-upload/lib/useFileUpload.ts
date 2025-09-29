import { computed } from 'vue'
import { subtitlesApi, apiUtils } from '@/shared/api'
import { useSubtitleStore } from '@/shared/stores/subtitle'
import { useUploadStore } from '@/shared/stores/upload'

/**
 * Состояния загрузки
 */
export type UploadState = 'idle' | 'uploading' | 'success' | 'error'

/**
 * Composable для работы с загрузкой файлов субтитров
 * Предоставляет реактивное состояние и методы для управления процессом загрузки
 * @returns Объект с состоянием, геттерами и методами для работы с файлами
 */
export function useFileUpload() {
  // Используем сторы
  const subtitleStore = useSubtitleStore()
  const uploadStore = useUploadStore()

  // Счетчик для правильной работы drag-n-drop (избегает event bubbling)
  let dragCounter = 0

  // Получаем данные из сторов
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

    const files = event.dataTransfer?.files
    if (files && files.length > 0 && files[0]) {
      handleFileSelect(files[0])
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
   * Загружает файл субтитров на сервер и обрабатывает результат
   */
  const uploadFile = async (): Promise<void> => {
    const file = uploadStore.uploadedFile
    if (!file) return

    uploadStore.setUploading()

    try {
      const result = await subtitlesApi.uploadFile(file)

      // Сохраняем загруженные субтитры в store
      subtitleStore.setSubtitles(result.data!.subtitles, result.data!.filename)
      uploadStore.setSuccess()

      console.log(`Файл "${subtitleStore.filename}" успешно загружен. Субтитров: ${subtitleStore.subtitles.length}`)

    } catch (err) {
      console.error('Ошибка загрузки:', err)
      uploadStore.setUploadError(apiUtils.handleApiError(err, 'Произошла ошибка при загрузке файла'))
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
      uploadStore.setUploadedFile(file)
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
    subtitles,
    filename,
    error,
    isDragOver,
    isUploading,
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
