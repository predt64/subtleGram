<template>
  <div class="p-4 subtitle-timeline">
    <h3 class="mb-4 font-semibold text-white text-lg">
      Субтитры
      <span v-if="subtitleStore.searchQuery" class="ml-2 font-normal text-slate-400 text-sm">
        (найдено: {{ filteredSubtitles.length }})
      </span>
    </h3>

    <!-- Список субтитров -->
    <div ref="timelineContainer" class="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-hide">
      <div
        v-for="(subtitle, index) in filteredSubtitles"
        :key="subtitle.id"
        :ref="(el) => setSubtitleRef(index, el)"
        @click="selectSubtitle(index)"
        :class="[
          'subtitle-item p-3 rounded-lg cursor-pointer transition-all duration-200 border-l-4',
          highlightedIndex === index
            ? 'bg-blue-500/20 border-blue-400 shadow-md'
            : 'bg-slate-700/30 border-transparent hover:bg-slate-700/50 hover:border-slate-600'
        ]"
      >
        <!-- Время -->
        <div class="mb-1 font-mono text-slate-400 text-xs">
          {{ formatTime(subtitle.start) }}
        </div>

        <!-- Текст субтитра -->
        <div
          :class="[
            'text-sm leading-relaxed',
            highlightedIndex === index ? 'text-blue-100' : 'text-slate-200'
          ]"
          v-html="subtitleStore.searchQuery ? highlightSearchTerms(subtitle.text, subtitleStore.searchQuery) : subtitle.text"
        ></div>

        <!-- Статус анализа -->
        <div class="flex items-center gap-2 mt-2">
          <div
            :class="[
              'w-2 h-2 rounded-full',
              getSubtitleStatus(index) === 'analyzed' ? 'bg-green-400' : 'bg-yellow-400'
            ]"
          ></div>
          <span class="text-slate-400 text-xs">
            {{ getSubtitleStatus(index) === 'analyzed' ? 'Проанализирован' : 'Новый' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Если нет субтитров -->
    <div v-if="filteredSubtitles.length === 0" class="py-8 text-center">
      <div class="flex justify-center items-center bg-slate-700/50 mx-auto mb-4 rounded-full w-16 h-16">
        <svg class="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      </div>
      <p class="text-slate-400 text-sm">
        {{ subtitleStore.searchQuery ? 'Поиск не дал результатов' : 'Субтитры не загружены' }}
      </p>
      <p v-if="subtitleStore.searchQuery" class="mt-1 text-slate-500 text-xs">
        Попробуйте другой поисковый запрос
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useSubtitleStore } from '@/shared/stores/subtitle'

// Данные из store
const subtitleStore = useSubtitleStore()

// Локальное состояние
const timelineContainer = ref<HTMLElement>()
const subtitleRefs = ref<(HTMLElement | null)[]>([])

// Props
interface Props {
  modelValue?: number
  searchQuery?: string
  filteredSubtitles?: any[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [index: number]
}>()

// Используем переданный через v-model индекс
const selectedSubtitleIndex = computed(() => props.modelValue || 0)

// Находим индекс текущего субтитра в отфильтрованном массиве для правильного выделения
const highlightedIndex = computed(() => {
  if (!subtitleStore.searchQuery) {
    return selectedSubtitleIndex.value
  }

  return subtitleStore.findFilteredIndex(subtitleStore.subtitles[selectedSubtitleIndex.value]?.id || 0)
})

// Вычисляемые свойства - используем данные из store
const filteredSubtitles = computed(() => {
  return subtitleStore.filteredSubtitles
})

// Подсветка поисковых терминов
const highlightSearchTerms = (text: string, query: string): string => {
  if (!query) return text

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-400 px-1 rounded text-slate-900">$1</mark>')
}

// Методы
const selectSubtitle = (filteredIndex: number) => {
  // Находим соответствующий субтитр в оригинальном массиве
  const subtitle = filteredSubtitles.value[filteredIndex]
  if (subtitle) {
    const originalIndex = subtitleStore.subtitles.findIndex(s => s.id === subtitle.id)
    if (originalIndex !== -1) {
      emit('update:modelValue', originalIndex)
    }
  }
}

const formatTime = (timeString: string): string => {
  // Преобразуем HH:MM:SS.mmm в MM:SS
  const parts = timeString.split(':')
  if (parts.length >= 2) {
    return `${parts[1]}:${parts[2]}` // MM:SS.mmm
  }
  return timeString
}

const getSubtitleStatus = (index: number): 'analyzed' | 'new' => {
  // TODO: Проверять реальный статус анализа
  return index % 3 === 0 ? 'analyzed' : 'new'
}

// Автопрокрутка к выбранному элементу
const scrollToSubtitle = (index: number) => {
  if (!timelineContainer.value) return

  // Проверяем, что индекс валиден
  if (index < 0 || index >= filteredSubtitles.value.length) return

  // Ждем, пока элемент будет доступен
  const tryScroll = () => {
    const element = subtitleRefs.value[index]
    if (!element || !element.offsetTop) {
      // Элемент еще не готов, пробуем позже
      setTimeout(tryScroll, 50)
      return
    }

    // Центрируем элемент в контейнере
    const container = timelineContainer.value
    if (!container) return

    const elementTop = element.offsetTop
    const elementHeight = element.offsetHeight
    const containerHeight = container.offsetHeight

    const scrollTop = elementTop - containerHeight / 2 + elementHeight / 2

    // Проверяем, что позиция корректна
    if (scrollTop >= 0 && scrollTop <= container.scrollHeight - containerHeight) {
      container.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      })
    }
  }

  tryScroll()
}

// Управление ссылками на элементы субтитров
const setSubtitleRef = (filteredIndex: number, el: any) => {
  subtitleRefs.value[filteredIndex] = el as HTMLElement | null
}

// Клавиатурная навигация
const handleKeydown = (event: KeyboardEvent) => {
  if (!subtitleStore.subtitles.length) return

  const currentIndex = selectedSubtitleIndex.value
  let newIndex = currentIndex

  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault()
      newIndex = Math.max(0, currentIndex - 1)
      break
    case 'ArrowDown':
      event.preventDefault()
      newIndex = Math.min(subtitleStore.subtitles.length - 1, currentIndex + 1)
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      // Уже выделен текущий элемент
      break
  }

  if (newIndex !== currentIndex) {
    emit('update:modelValue', newIndex)
  }
}

// Следим за изменениями в поиске для автопрокрутки к первому результату
watch(() => subtitleStore.searchQuery, (newQuery) => {
  if (newQuery && subtitleStore.filteredSubtitles.length > 0) {
    // Автопрокрутка к первому результату поиска
    setTimeout(() => scrollToSubtitle(0), 100)
  }
})

// Следим за изменениями в modelValue для автопрокрутки
watch(() => props.modelValue, (newIndex, oldIndex) => {
  if (newIndex !== undefined && newIndex !== oldIndex && newIndex >= 0) {
    // Автопрокрутка к выбранному элементу только если индекс действительно изменился и корректен
    setTimeout(() => {
      const subtitle = subtitleStore.subtitles[newIndex]
      if (subtitle) {
        const filteredIndex = subtitleStore.findFilteredIndex(subtitle.id)
        if (filteredIndex >= 0 && filteredIndex < filteredSubtitles.value.length) {
          scrollToSubtitle(filteredIndex)
        }
      }
    }, 100)
  }
})

// Lifecycle hooks
onMounted(() => {
  // Добавляем обработчик клавиатуры
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  // Удаляем обработчик клавиатуры
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.subtitle-item:hover {
  transform: translateX(2px);
}

/* Скрываем скроллбары */
.scrollbar-hide {
  /* Firefox */
  scrollbar-width: none;

  /* WebKit браузеры */
  -ms-overflow-style: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
