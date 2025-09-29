import { defineStore } from 'pinia'
import { ref, computed, onMounted, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import type { UploadState } from '@/shared/types'

/**
 * Store для управления состоянием загрузки файлов
 * Хранит информацию о текущем состоянии загрузки, выбранном файле и ошибках
 */
export const useUploadStore = defineStore('upload', () => {
  const uploadState = ref<UploadState>('idle')
  const uploadedFile = ref<File | null>(null)
  const error = ref<string | null>(null)
  const isDragOver = ref<boolean>(false)

  /**
   * Инициализация sessionStorage только на клиенте
   * VueUse useStorage работает только в браузере, поэтому инициализируем после монтирования
   */
  onMounted(() => {
    if (typeof window !== 'undefined') {
      const uploadStateStorage = useStorage<UploadState>(
        'uploadState',
        'idle',
        sessionStorage,
        {
          serializer: {
            read: (v: string) => (v as UploadState) || 'idle',
            write: (v: UploadState) => v
          }
        }
      )

      // Восстанавливаем сохраненное состояние
      uploadState.value = uploadStateStorage.value

      // Автоматически сохраняем изменения состояния
      watch(uploadState, (newValue) => {
        uploadStateStorage.value = newValue
      })
    }
  })

  // === ГЕТТЕРЫ ===

  /**
   * Проверяет, идет ли загрузка файла в данный момент
   */
  const isUploading = computed(() => uploadState.value === 'uploading')

  /**
   * Проверяет, выбран ли файл для загрузки
   */
  const hasFile = computed(() => uploadedFile.value !== null)

  /**
   * Проверяет, есть ли ошибка загрузки
   */
  const hasError = computed(() => error.value !== null)

  // === ДЕЙСТВИЯ ===

  /**
   * Устанавливает состояние загрузки
   * @param state - новое состояние загрузки
   */
  const setUploadState = (state: UploadState) => {
    uploadState.value = state
  }

  /**
   * Устанавливает выбранный файл
   * @param file - файл для загрузки или null
   */
  const setUploadedFile = (file: File | null) => {
    uploadedFile.value = file
  }

  /**
   * Устанавливает сообщение об ошибке
   * @param errorMessage - текст ошибки или null для сброса
   */
  const setError = (errorMessage: string | null) => {
    error.value = errorMessage
  }

  /**
   * Устанавливает состояние drag & drop
   * @param over - находится ли курсор над зоной сброса
   */
  const setDragOver = (over: boolean) => {
    isDragOver.value = over
  }

  /**
   * Сбрасывает все состояние загрузки к начальным значениям
   * Используется при загрузке нового файла или отмене операции
   */
  const reset = () => {
    uploadState.value = 'idle'
    uploadedFile.value = null
    error.value = null
    isDragOver.value = false
  }

  /**
   * Устанавливает состояние "загрузка начата"
   * Автоматически сбрасывает предыдущие ошибки
   */
  const setUploading = () => {
    uploadState.value = 'uploading'
    error.value = null
  }

  /**
   * Устанавливает состояние "загрузка завершена успешно"
   */
  const setSuccess = () => {
    uploadState.value = 'success'
  }

  /**
   * Устанавливает состояние ошибки загрузки
   * @param errorMessage - сообщение об ошибке
   */
  const setUploadError = (errorMessage: string) => {
    uploadState.value = 'error'
    error.value = errorMessage
  }

  /**
   * Экспортируемые свойства и методы store
   */
  return {
    // Состояние
    uploadState,
    uploadedFile,
    error,
    isDragOver,

    // Геттеры
    isUploading,
    hasFile,
    hasError,

    // Действия
    setUploadState,
    setUploadedFile,
    setError,
    setDragOver,
    reset,
    setUploading,
    setSuccess,
    setUploadError,
  }
})
