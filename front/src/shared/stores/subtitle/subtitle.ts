import { defineStore } from 'pinia'
import { ref, computed, onMounted, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import type { SubtitleFile } from './types'

export const useSubtitleStore = defineStore('subtitle', () => {
  // Состояние - инициализируем без storage, заполним в onMounted
  const subtitles = ref<SubtitleFile[]>([])
  const filename = ref<string>('')
  const currentIndex = ref<number>(0)
  const searchQuery = ref<string>('')

  // Инициализируем storage только на клиенте
  onMounted(() => {
    if (typeof window !== 'undefined') {
      // Создаем storage с sessionStorage
      const subtitlesStorage = useStorage<SubtitleFile[]>(
        'subtitles',
        [],
        sessionStorage,
        {
          serializer: {
            read: (v: string) => {
              try {
                return v ? JSON.parse(v) : []
              } catch {
                return []
              }
            },
            write: (v: SubtitleFile[]) => JSON.stringify(v)
          }
        }
      )

      const filenameStorage = useStorage<string>(
        'filename',
        '',
        sessionStorage,
        {
          serializer: {
            read: (v: string) => v || '',
            write: (v: string) => v
          }
        }
      )

      // Синхронизируем с реактивными переменными
      subtitles.value = subtitlesStorage.value
      filename.value = filenameStorage.value

      // Следим за изменениями и сохраняем
      watch(subtitles, (newValue) => {
        subtitlesStorage.value = newValue
      }, { deep: true })

      watch(filename, (newValue) => {
        filenameStorage.value = newValue
      })
    }
  })

  // Геттеры
  const currentSubtitle = computed(() =>
    subtitles.value[currentIndex.value] || null
  )

  const hasSubtitles = computed(() => subtitles.value.length > 0)

  const previousSubtitle = computed(() =>
    currentIndex.value > 0 ? subtitles.value[currentIndex.value - 1] : null
  )

  const nextSubtitle = computed(() =>
    currentIndex.value < subtitles.value.length - 1
      ? subtitles.value[currentIndex.value + 1]
      : null
  )

  // Фильтрация субтитров по поисковому запросу
  const filteredSubtitles = computed(() => {
    if (!searchQuery.value) return subtitles.value

    const query = searchQuery.value.toLowerCase()
    return subtitles.value.filter(subtitle =>
      subtitle.text.toLowerCase().includes(query)
    )
  })

  // Действия
  const setSubtitles = (newSubtitles: SubtitleFile[], newFilename: string = '') => {
    subtitles.value = newSubtitles
    filename.value = newFilename
    currentIndex.value = 0
    // Сохранение происходит автоматически через watchers
  }

  const setCurrentIndex = (index: number) => {
    if (index >= 0 && index < subtitles.value.length) {
      currentIndex.value = index
    }
  }

  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }

  const goToPrevious = () => {
    const currentFilteredIndex = findFilteredIndex(subtitles.value[currentIndex.value]?.id || 0)
    if (currentFilteredIndex > 0) {
      const newFilteredIndex = currentFilteredIndex - 1
      const targetSubtitle = filteredSubtitles.value[newFilteredIndex]
      if (targetSubtitle) {
        const originalIndex = subtitles.value.findIndex(s => s.id === targetSubtitle.id)
        if (originalIndex !== -1) {
          currentIndex.value = originalIndex
        }
      }
    }
  }

  const goToNext = () => {
    const currentFilteredIndex = findFilteredIndex(subtitles.value[currentIndex.value]?.id || 0)
    if (currentFilteredIndex < filteredSubtitles.value.length - 1) {
      const newFilteredIndex = currentFilteredIndex + 1
      const targetSubtitle = filteredSubtitles.value[newFilteredIndex]
      if (targetSubtitle) {
        const originalIndex = subtitles.value.findIndex(s => s.id === targetSubtitle.id)
        if (originalIndex !== -1) {
          currentIndex.value = originalIndex
        }
      }
    }
  }

  const clear = () => {
    subtitles.value = []
    filename.value = ''
    currentIndex.value = 0
    searchQuery.value = ''
    // Сохранение происходит автоматически через watchers
  }

  // Найти индекс субтитра в отфильтрованном массиве
  const findFilteredIndex = (subtitleId: number): number => {
    // Если нет поиска, возвращаем индекс в оригинальном массиве
    if (!searchQuery.value) {
      const subtitle = subtitles.value.find(s => s.id === subtitleId)
      return subtitle ? subtitles.value.indexOf(subtitle) : 0
    }

    // Ищем субтитр в оригинальном массиве
    const subtitle = subtitles.value.find(s => s.id === subtitleId)
    if (!subtitle) return 0

    // Находим его индекс в отфильтрованном массиве
    const filtered = filteredSubtitles.value
    return filtered.findIndex(s => s.id === subtitleId)
  }

  return {
    // Состояние
    subtitles,
    filename,
    currentIndex,
    searchQuery,

    // Геттеры
    currentSubtitle,
    hasSubtitles,
    previousSubtitle,
    nextSubtitle,
    filteredSubtitles,

    // Действия
    setSubtitles,
    setCurrentIndex,
    setSearchQuery,
    goToPrevious,
    goToNext,
    clear,
    findFilteredIndex,
  }
})
