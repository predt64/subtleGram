<template>
  <footer class="flex justify-between items-center bg-slate-800/80 backdrop-blur-sm px-6 border-slate-700/50 border-t h-16 workspace-footer">
    <!-- Левая часть - Контекст -->
    <div class="flex items-center gap-6">
      <!-- Предыдущая строка -->
      <div v-if="previousSubtitle" class="flex items-center gap-3 max-w-xs">
        <div class="bg-slate-600 rounded-full w-2 h-2"></div>
        <div class="flex-1 min-w-0">
          <div class="mb-1 text-slate-400 text-xs">Предыдущий</div>
          <div class="text-slate-300 text-sm truncate">
            {{ previousSubtitle.text }}
          </div>
        </div>
      </div>

      <!-- Текущая строка -->
      <div v-if="selectedSubtitle" class="flex items-center gap-3 max-w-xs">
        <div class="bg-blue-400 rounded-full w-2 h-2"></div>
        <div class="flex-1 min-w-0">
          <div class="mb-1 text-blue-400 text-xs">Текущий</div>
          <div class="text-white text-sm truncate">
            {{ selectedSubtitle.text }}
          </div>
        </div>
      </div>

      <!-- Следующая строка -->
      <div v-if="nextSubtitle" class="flex items-center gap-3 max-w-xs">
        <div class="bg-slate-600 rounded-full w-2 h-2"></div>
        <div class="flex-1 min-w-0">
          <div class="mb-1 text-slate-400 text-xs">Следующий</div>
          <div class="text-slate-300 text-sm truncate">
            {{ nextSubtitle.text }}
          </div>
        </div>
      </div>
    </div>

    <!-- Правая часть - Навигация -->
    <div class="flex items-center gap-3">
      <!-- Предыдущая -->
      <button
        @click="goToPrevious"
        :disabled="filteredIndex <= 0"
        :class="[
          'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
          filteredIndex <= 0
            ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
            : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white'
        ]"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        <span class="font-medium text-sm">Назад</span>
      </button>

      <!-- Индикатор позиции -->
      <div class="flex items-center gap-2 px-3">
        <span class="text-slate-400 text-sm">
          {{ filteredIndex + 1 }} из {{ currentSubtitles.length }}
        </span>
      </div>

      <!-- Следующая -->
      <button
        @click="goToNext"
        :disabled="filteredIndex >= currentSubtitles.length - 1"
        :class="[
          'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
          filteredIndex >= currentSubtitles.length - 1
            ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
            : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white'
        ]"
      >
        <span class="font-medium text-sm">Вперед</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useFileUpload } from '@/features/file-upload'

// Props
interface Props {
  modelValue?: number
  filteredSubtitles?: any[]
  searchQuery?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [index: number]
}>()

// Данные из composable
const {
  subtitles
} = useFileUpload()

// Вычисляемые свойства (используем переданный через v-model индекс)
const selectedSubtitleIndex = computed(() => props.modelValue || 0)

// Определяем, какие субтитры использовать (отфильтрованные или все)
const currentSubtitles = computed(() =>
  props.searchQuery ? props.filteredSubtitles || [] : subtitles.value
)

// Находим индекс текущего субтитра в отфильтрованном массиве
const filteredIndex = computed(() => {
  if (!props.searchQuery || !props.filteredSubtitles) return selectedSubtitleIndex.value

  const currentSubtitle = subtitles.value[selectedSubtitleIndex.value]
  if (!currentSubtitle) return 0

  return props.filteredSubtitles.findIndex(s => s.id === currentSubtitle.id)
})

// Текущий субтитр из отфильтрованного массива
const selectedSubtitle = computed(() =>
  currentSubtitles.value[filteredIndex.value] || null
)

const previousSubtitle = computed(() =>
  filteredIndex.value > 0 ? currentSubtitles.value[filteredIndex.value - 1] : null
)

const nextSubtitle = computed(() =>
  filteredIndex.value < currentSubtitles.value.length - 1
    ? currentSubtitles.value[filteredIndex.value + 1]
    : null
)

// Методы
const goToPrevious = () => {
  if (filteredIndex.value > 0) {
    // Находим субтитр, который должен стать текущим
    const newFilteredIndex = filteredIndex.value - 1
    const targetSubtitle = currentSubtitles.value[newFilteredIndex]
    if (targetSubtitle) {
      const originalIndex = subtitles.value.findIndex(s => s.id === targetSubtitle.id)
      if (originalIndex !== -1) {
        emit('update:modelValue', originalIndex)
      }
    }
  }
}

const goToNext = () => {
  if (filteredIndex.value < currentSubtitles.value.length - 1) {
    // Находим субтитр, который должен стать текущим
    const newFilteredIndex = filteredIndex.value + 1
    const targetSubtitle = currentSubtitles.value[newFilteredIndex]
    if (targetSubtitle) {
      const originalIndex = subtitles.value.findIndex(s => s.id === targetSubtitle.id)
      if (originalIndex !== -1) {
        emit('update:modelValue', originalIndex)
      }
    }
  }
}
</script>

<style scoped>
/* Workspace Footer стили */
.workspace-footer {
  position: sticky;
  bottom: 0;
  z-index: 50;
}

.workspace-footer button:disabled {
  opacity: 0.5;
}

.workspace-footer button:disabled:hover {
  transform: none;
}
</style>
