import { defineStore } from 'pinia'
import { ref, computed, onMounted, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import type { SubtitleFile } from '@/shared/types'
import type { SentenceCard } from '@/shared/lib/normalizeToSentences'
import { normalizeToSentences } from '@/shared/lib/normalizeToSentences'

/**
 * Store для управления субтитрами
 * Хранит массив субтитров, имя файла и текущую позицию навигации
 */
export const useSubtitleStore = defineStore('subtitle', () => {
  const rawSubtitles = ref<SubtitleFile[]>([])
  const filename = ref<string>('')
  const searchQuery = ref<string>('')

  /**
   * Инициализация sessionStorage только на клиенте
   * VueUse useStorage работает только в браузере, поэтому инициализируем после монтирования
   */
  onMounted(() => {
    if (typeof window !== 'undefined') {
      const rawSubtitlesStorage = useStorage<SubtitleFile[]>(
        'rawSubtitles',
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
      rawSubtitles.value = rawSubtitlesStorage.value
      filename.value = filenameStorage.value

      // Автоматически сохраняем изменения сырых субтитров
      watch(rawSubtitles, (newValue) => {
        rawSubtitlesStorage.value = newValue
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
  const hasSubtitles = computed(() => rawSubtitles.value.length > 0)

  /**
   * Карточки предложений вычисляются на лету из сырых субтитров
   * Ничего не сохраняем — при перезагрузке страницы пересчитаем
   */
  const sentenceCards = computed<SentenceCard[]>(() => {
    return normalizeToSentences(rawSubtitles.value)
  })

  /**
   * Возвращает карточки, отфильтрованные по поисковому запросу
   */
  const filteredSubtitles = computed(() => {
    if (!searchQuery.value) return sentenceCards.value

    const query = searchQuery.value.toLowerCase()
    return sentenceCards.value.filter(subtitle =>
      subtitle.text.toLowerCase().includes(query)
    )
  })

  // === ДЕЙСТВИЯ ===

  /**
   * Устанавливает новый массив субтитров и имя файла (совместимость)
   * @param newSubtitles - массив субтитров для установки
   * @param newFilename - имя файла субтитров
   */
  const setSubtitles = (newSubtitles: SubtitleFile[], newFilename: string = '') => {
    rawSubtitles.value = newSubtitles
    if (newFilename) filename.value = newFilename
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
    rawSubtitles.value = []
    filename.value = ''
    searchQuery.value = ''
    // Сохранение происходит автоматически через watchers
  }

  /**
   * Находит индекс карточки в отфильтрованном массиве
   * @param subtitleId - ID карточки для поиска
   * @returns индекс в отфильтрованном массиве или 0
   */
  const findFilteredIndex = (subtitleId: number): number => {
    // Если нет поиска, возвращаем индекс в полном списке карточек
    if (!searchQuery.value) {
      const card = sentenceCards.value.find(s => s.id === subtitleId)
      return card ? sentenceCards.value.indexOf(card) : 0
    }

    // Находим индекс в отфильтрованном массиве
    const filtered = filteredSubtitles.value
    const idx = filtered.findIndex(s => s.id === subtitleId)
    return idx >= 0 ? idx : 0
  }

  /**
   * Экспортируемые свойства и методы store
   */
  return {
    // Состояние
    rawSubtitles,
    sentenceCards,
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
