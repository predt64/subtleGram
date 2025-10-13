import { defineStore } from 'pinia'
import { ref, computed, onMounted, watch } from 'vue'
import { createSimpleStorage } from '@/shared/lib'
import type { UploadState } from '@/shared/types'

/**
 * Store для управления загрузкой файлов субтитров
 *
 * Управляет состоянием процесса загрузки, выбранными файлами и обработкой ошибок.
 * Сохраняет состояние загрузки в sessionStorage
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
      // Создаем storage с обработкой ошибок
      const uploadStateStorage = createSimpleStorage<UploadState>('uploadState', 'idle')

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
   * Устанавливает выбранный файл для загрузки
   * @param file - файл субтитров или null для сброса
   * @throws {Error} если передан некорректный объект файла
   */
  const setUploadedFile = (file: File | null) => {
    if (file !== null && !(file instanceof File)) {
      throw new Error('Параметр file должен быть объектом File или null')
    }
    uploadedFile.value = file
  }

  /**
   * Устанавливает сообщение об ошибке валидации
   * Используется для ошибок, не связанных с процессом загрузки (например, неправильный тип файла)
   * @param errorMessage - текст ошибки или null для сброса
   */
  const setError = (errorMessage: string | null) => {
    error.value = errorMessage
  }

  /**
   * Управляет состоянием drag & drop зоны
   * @param over - true если курсор находится над зоной сброса файла
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

    // Явно очищаем sessionStorage чтобы файл не восстановился при перезагрузке
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('uploadState')
      sessionStorage.removeItem('uploadedFile')
      sessionStorage.removeItem('uploadError')
    }
  }

  /**
   * Переводит store в состояние активной загрузки
   * Автоматически очищает предыдущие ошибки перед началом новой загрузки
   */
  const setUploading = () => {
    uploadState.value = 'uploading'
    error.value = null
  }

  /**
   * Переводит store в состояние успешного завершения загрузки
   * Вызывается после успешной обработки файла на сервере
   */
  const setSuccess = () => {
    uploadState.value = 'success'
  }

  /**
   * Переводит store в состояние ошибки загрузки
   * Используется для ошибок, возникших во время HTTP запроса или обработки на сервере
   * @param errorMessage - подробное описание ошибки для отображения пользователю
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
    setUploadedFile,
    setError,
    setDragOver,
    reset,
    setUploading,
    setSuccess,
    setUploadError,
  }
})
