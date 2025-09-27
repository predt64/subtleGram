import { defineStore } from 'pinia'
import { ref, computed, onMounted, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import type { UploadState } from './types'

export const useUploadStore = defineStore('upload', () => {
  // Состояние - инициализируем без storage, заполним в onMounted
  const uploadState = ref<UploadState>('idle')
  const uploadedFile = ref<File | null>(null)
  const error = ref<string | null>(null)
  const isDragOver = ref<boolean>(false)

  // Инициализируем storage только на клиенте
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

      // Синхронизируем с реактивной переменной
      uploadState.value = uploadStateStorage.value

      // Следим за изменениями и сохраняем
      watch(uploadState, (newValue) => {
        uploadStateStorage.value = newValue
      })
    }
  })

  // Геттеры
  const isUploading = computed(() => uploadState.value === 'uploading')
  const hasFile = computed(() => uploadedFile.value !== null)
  const hasError = computed(() => error.value !== null)

  // Действия
  const setUploadState = (state: UploadState) => {
    uploadState.value = state
  }

  const setUploadedFile = (file: File | null) => {
    uploadedFile.value = file
  }

  const setError = (errorMessage: string | null) => {
    error.value = errorMessage
  }

  const setDragOver = (over: boolean) => {
    isDragOver.value = over
  }

  const reset = () => {
    uploadState.value = 'idle'
    uploadedFile.value = null
    error.value = null
    isDragOver.value = false
  }

  const setUploading = () => {
    uploadState.value = 'uploading'
    error.value = null
  }

  const setSuccess = () => {
    uploadState.value = 'success'
  }

  const setUploadError = (errorMessage: string) => {
    uploadState.value = 'error'
    error.value = errorMessage
  }

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
