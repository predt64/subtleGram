import { defineStore } from 'pinia'
import { ref, computed, onMounted, watch } from 'vue'
import { createJsonStorage } from '@/shared/lib'
import type { SubtitleFile } from '@/shared/types'
import type { SentenceCard } from '@/entities/subtitle/lib/normalizeToSentences'
import { normalizeToSentences } from '@/entities/subtitle/lib/normalizeToSentences'
import { parseTimeToMs } from '@/shared/lib/timelineMarks'

// Константы для ключей sessionStorage
const STORAGE_KEYS = {
  RAW_SUBTITLES: 'rawSubtitles',
  FILENAME: 'filename',
  ANALYZED_SUBTITLES: 'analyzedSubtitles'
} as const

/**
 * Store для управления субтитрами и предложениями
 *
 * Управляет загрузкой, хранением и поиском субтитров. Автоматически сохраняет данные
 * в sessionStorage
 */
export const useSubtitleStore = defineStore('subtitle', () => {
  const rawSubtitles = ref<SubtitleFile[]>([])
  const filename = ref<string>('')
  const searchQuery = ref<string>('')

  // Множество проанализированных субтитров (по тексту)
  const analyzedSubtitles = ref<Set<string>>(new Set())

  // Флаг загрузки данных из sessionStorage
  // Начинаем с true - показываем loading пока не загрузим данные
  const isLoading = ref(true)

  /**
   * Инициализация sessionStorage только на клиенте
   * VueUse useStorage работает только в браузере, поэтому инициализируем после монтирования
   */
  onMounted(() => {
    if (typeof window !== 'undefined') {
      // Создаем storage с обработкой ошибок
      const rawSubtitlesStorage = createJsonStorage<SubtitleFile[]>(STORAGE_KEYS.RAW_SUBTITLES, [])
      const filenameStorage = createJsonStorage<string>(STORAGE_KEYS.FILENAME, '')
      const analyzedSubtitlesStorage = createJsonStorage<string[]>(STORAGE_KEYS.ANALYZED_SUBTITLES, [])

      // Восстанавливаем сохраненные данные
      rawSubtitles.value = rawSubtitlesStorage.value
      filename.value = filenameStorage.value
      analyzedSubtitles.value = new Set(analyzedSubtitlesStorage.value)

      // Автоматически сохраняем изменения
      watch(rawSubtitles, (newValue) => {
        rawSubtitlesStorage.value = newValue
      }, { deep: true })

      watch(filename, (newValue) => {
        filenameStorage.value = newValue
      })

      watch(analyzedSubtitles, (newValue) => {
        analyzedSubtitlesStorage.value = Array.from(newValue)
      }, { deep: true })

      // Отмечаем завершение загрузки данных
      nextTick(() => {
        isLoading.value = false
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
  const sentenceCards = computed<SentenceCard[]>(() => normalizeToSentences(rawSubtitles.value))

  const totalDurationMs = computed(() => {
    if (!sentenceCards.value.length) return 0

    // Находим максимальное время окончания среди всех карточек
    // (субтитры могут быть не отсортированы по времени)
    return Math.max(...sentenceCards.value.map(card =>
      parseTimeToMs(card.end || '00:00:00')
    ))
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
    try {
      if (!Array.isArray(newSubtitles)) {
        throw new Error('newSubtitles must be an array')
      }

      rawSubtitles.value = newSubtitles
      if (newFilename) filename.value = newFilename
    } catch (error) {
      console.error('Failed to set subtitles:', error)
    }
  }

  /**
   * Устанавливает поисковый запрос для фильтрации субтитров
   * @param query - поисковая строка
   */
  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }

  /**
   * Отмечает субтитр как проанализированный
   * @param subtitleText - текст субтитра для отметки
   */
  const markAsAnalyzed = (subtitleText: string) => {
    analyzedSubtitles.value.add(subtitleText)
  }

  /**
   * Очищает все данные субтитров и сбрасывает состояние
   */
  const clear = () => {
    rawSubtitles.value = []
    filename.value = ''
    searchQuery.value = ''
    analyzedSubtitles.value.clear()
  }

  /**
   * Находит индекс карточки в отфильтрованном массиве
   * @param subtitleId - ID карточки для поиска
   * @returns индекс в отфильтрованном массиве или -1 если не найден
   */
  const findFilteredIndex = (subtitleId: number): number => {
    // Если нет поиска, ищем в полном массиве предложений
    if (!searchQuery.value) {
      const card = sentenceCards.value.find(s => s.id === subtitleId)
      return card ? sentenceCards.value.indexOf(card) : -1
    }

    // При поиске ищем в отфильтрованном массиве
    const filtered = filteredSubtitles.value
    const idx = filtered.findIndex(s => s.id === subtitleId)
    return idx >= 0 ? idx : -1
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
    analyzedSubtitles,
    isLoading,

    // Геттеры
    hasSubtitles,
    filteredSubtitles,
    totalDurationMs,

    // Действия
    setSubtitles,
    setSearchQuery,
    markAsAnalyzed,
    clear,
    findFilteredIndex,
  }
})
