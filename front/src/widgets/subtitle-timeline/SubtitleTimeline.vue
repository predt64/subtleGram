<template>
  <div class="p-4 subtitle-timeline">
    <h3 class="mb-4 font-semibold text-white text-lg">
      Субтитры
      <span v-if="searchQuery" class="ml-2 font-normal text-slate-400 text-sm">
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
          v-html="props.searchQuery ? highlightSearchTerms(subtitle.text, props.searchQuery) : subtitle.text"
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
        {{ searchQuery ? 'Поиск не дал результатов' : 'Субтитры не загружены' }}
      </p>
      <p v-if="searchQuery" class="mt-1 text-slate-500 text-xs">
        Попробуйте другой поисковый запрос
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useFileUpload } from '@/features/file-upload'

// Данные из composable
const {
  subtitles,
  error
} = useFileUpload()

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
  if (!props.searchQuery || !props.filteredSubtitles) {
    return selectedSubtitleIndex.value
  }

  const currentSubtitle = subtitles.value[selectedSubtitleIndex.value]
  if (!currentSubtitle) return 0

  return props.filteredSubtitles.findIndex(s => s.id === currentSubtitle.id)
})

// Вычисляемые свойства - используем переданные отфильтрованные субтитры
const filteredSubtitles = computed(() => {
  if (props.searchQuery && props.filteredSubtitles) {
    return props.filteredSubtitles
  }
  return subtitles.value
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
    const originalIndex = subtitles.value.findIndex(s => s.id === subtitle.id)
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

  // Находим элемент по индексу в отфильтрованном списке
  if (index >= 0 && index < filteredSubtitles.value.length && subtitleRefs.value[index]) {
    const element = subtitleRefs.value[index]
    if (!element) return

    // Центрируем элемент в контейнере
    const container = timelineContainer.value
    const elementTop = element.offsetTop
    const elementHeight = element.offsetHeight
    const containerHeight = container.offsetHeight

    const scrollTop = elementTop - containerHeight / 2 + elementHeight / 2
    container.scrollTo({
      top: scrollTop,
      behavior: 'smooth'
    })
  }
}

// Управление ссылками на элементы субтитров
const setSubtitleRef = (filteredIndex: number, el: any) => {
  subtitleRefs.value[filteredIndex] = el as HTMLElement | null
}

// Клавиатурная навигация
const handleKeydown = (event: KeyboardEvent) => {
  if (!subtitles.value.length) return

  const currentIndex = selectedSubtitleIndex.value
  let newIndex = currentIndex

  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault()
      newIndex = Math.max(0, currentIndex - 1)
      break
    case 'ArrowDown':
      event.preventDefault()
      newIndex = Math.min(subtitles.value.length - 1, currentIndex + 1)
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
watch(() => props.searchQuery, (newQuery) => {
  if (newQuery && props.filteredSubtitles && props.filteredSubtitles.length > 0) {
    // Автопрокрутка к первому результату поиска
    setTimeout(() => scrollToSubtitle(0), 100)
  }
})

// Следим за изменениями в modelValue для автопрокрутки
watch(() => props.modelValue, (newIndex) => {
  if (newIndex !== undefined) {
    // Автопрокрутка к выбранному элементу
    setTimeout(() => {
      // Если есть поиск, находим индекс в отфильтрованном массиве
      if (props.searchQuery && props.filteredSubtitles) {
        const currentSubtitle = subtitles.value[newIndex]
        if (currentSubtitle) {
          const filteredIndex = props.filteredSubtitles.findIndex(s => s.id === currentSubtitle.id)
          scrollToSubtitle(filteredIndex)
        }
      } else {
        // Если нет поиска, используем индекс напрямую
        scrollToSubtitle(newIndex)
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
