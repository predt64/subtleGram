import { defineStore } from 'pinia'
import { ref, computed, onMounted, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import type { SubtitleFile } from '@/shared/types'

/**
 * Store для управления субтитрами
 * Хранит массив субтитров, имя файла и текущую позицию навигации
 */
export const useSubtitleStore = defineStore('subtitle', () => {
  const subtitles = ref<SubtitleFile[]>([])
  const filename = ref<string>('')
  const searchQuery = ref<string>('')

  /**
   * Инициализация sessionStorage только на клиенте
   * VueUse useStorage работает только в браузере, поэтому инициализируем после монтирования
   */
  onMounted(() => {
    if (typeof window !== 'undefined') {
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

      // Storage для имени файла
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

      // Восстанавливаем сохраненные данные
      subtitles.value = subtitlesStorage.value
      filename.value = filenameStorage.value

      // Автоматически сохраняем изменения субтитров
      watch(subtitles, (newValue) => {
        subtitlesStorage.value = newValue
      }, { deep: true })

      // Автоматически сохраняем изменения имени файла
      watch(filename, (newValue) => {
        filenameStorage.value = newValue
      })
    }
  })

  // === ГЕТТЕРЫ ===

  /**
   * Проверяет, загружены ли субтитры
   */
  const hasSubtitles = computed(() => subtitles.value.length > 0)

  /**
   * Возвращает субтитры, отфильтрованные по поисковому запросу
   */
  const filteredSubtitles = computed(() => {
    if (!searchQuery.value) return subtitles.value

    const query = searchQuery.value.toLowerCase()
    return subtitles.value.filter(subtitle =>
      subtitle.text.toLowerCase().includes(query)
    )
  })

  // === ДЕЙСТВИЯ ===

  /**
   * Устанавливает новый массив субтитров и имя файла
   * @param newSubtitles - массив субтитров для установки
   * @param newFilename - имя файла субтитров
   */
  const setSubtitles = (newSubtitles: SubtitleFile[], newFilename: string = '') => {
    subtitles.value = newSubtitles
    filename.value = newFilename
    // Сохранение происходит автоматически через watchers
  }


  /**
   * Устанавливает поисковый запрос для фильтрации субтитров
   * @param query - поисковая строка
   */
  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }


  /**
   * Очищает все данные субтитров и сбрасывает состояние
   */
  const clear = () => {
    subtitles.value = []
    filename.value = ''
    searchQuery.value = ''
    // Сохранение происходит автоматически через watchers
  }

  /**
   * Находит индекс субтитра в отфильтрованном массиве
   * @param subtitleId - ID субтитра для поиска
   * @returns индекс в отфильтрованном массиве или 0
   */
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

  /**
   * Экспортируемые свойства и методы store
   */
  return {
    // Состояние
    subtitles,
    filename,
    searchQuery,

    // Геттеры
    hasSubtitles,
    filteredSubtitles,

    // Действия
    setSubtitles,
    setSearchQuery,
    clear,
    findFilteredIndex,
  }
})
