<template>
  <footer
    class="flex justify-between items-center bg-slate-800/80 backdrop-blur-sm px-6 border-slate-700/50 border-t h-16 workspace-footer"
  >
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
        :disabled="previousButtonState.disabled"
        :class="[
          'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
          previousButtonState.classes,
        ]"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span class="font-medium text-sm">Назад</span>
      </button>

      <!-- Индикатор позиции -->
      <div class="flex items-center gap-2 px-3">
        <span class="text-slate-400 text-sm">
          {{ positionInfo.current }} из {{ positionInfo.total }}
        </span>
      </div>

      <!-- Следующая -->
      <button
        @click="goToNext"
        :disabled="nextButtonState.disabled"
        :class="[
          'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
          nextButtonState.classes,
        ]"
      >
        <span class="font-medium text-sm">Вперед</span>
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useSubtitleStore } from "@/entities/subtitle";

interface Props {
  modelValue?: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:modelValue": [index: number];
}>();

const subtitleStore = useSubtitleStore();

/**
 * Состояние навигации - унифицированная логика для работы с индексами
 */
const navigationState = computed(() => {
  const originalIndex = props.modelValue ?? -1;
  const isFiltered = !!subtitleStore.searchQuery;
  const subtitles = isFiltered ? subtitleStore.filteredSubtitles : subtitleStore.sentenceCards;

  let currentIndex = originalIndex;
  if (isFiltered && originalIndex >= 0) {
    currentIndex = subtitleStore.findFilteredIndex(
      subtitleStore.sentenceCards[originalIndex]?.id || 0
    );
  }

  return {
    originalIndex,
    currentIndex,
    subtitles,
    isFiltered
  };
});

const selectedSubtitle = computed(() => {
  const state = navigationState.value;
  return state.currentIndex >= 0 ? state.subtitles[state.currentIndex] : null;
});

const previousSubtitle = computed(() => {
  const state = navigationState.value;
  return state.currentIndex > 0 ? state.subtitles[state.currentIndex - 1] : null;
});

const nextSubtitle = computed(() => {
  const state = navigationState.value;
  return state.currentIndex >= 0 && state.currentIndex < state.subtitles.length - 1
    ? state.subtitles[state.currentIndex + 1]
    : null;
});

/**
 * Состояние кнопки "Назад" для использования в template
 */
const previousButtonState = computed(() => {
  const state = navigationState.value;
  const disabled = state.currentIndex <= 0;
  return {
    disabled,
    classes: disabled
      ? "bg-slate-700/50 text-slate-500 cursor-not-allowed"
      : "bg-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white",
  };
});

/**
 * Состояние кнопки "Вперед" для использования в template
 */
const nextButtonState = computed(() => {
  const state = navigationState.value;
  const disabled = state.currentIndex >= state.subtitles.length - 1;
  return {
    disabled,
    classes: disabled
      ? "bg-slate-700/50 text-slate-500 cursor-not-allowed"
      : "bg-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white",
  };
});

/**
 * Информация о текущей позиции для отображения в индикаторе
 */
const positionInfo = computed(() => {
  const state = navigationState.value;
  return {
    current: state.originalIndex === -1 ? 0 : state.currentIndex + 1,
    total: state.subtitles.length,
  };
});

/**
 * Универсальная функция навигации по субтитрам
 * @param direction - направление навигации
 */
const navigate = (direction: 'previous' | 'next') => {
  const state = navigationState.value;
  const offset = direction === 'next' ? 1 : -1;
  const newIndex = state.currentIndex + offset;

  if (newIndex >= 0 && newIndex < state.subtitles.length) {
    const targetSubtitle = state.subtitles[newIndex];
    if (targetSubtitle) {
      const originalIndex = subtitleStore.sentenceCards.findIndex(
        (s) => s.id === targetSubtitle.id
      );
      if (originalIndex !== -1) {
        emit("update:modelValue", originalIndex);
      }
    }
  }
};

/**
 * Переход к предыдущему субтитру
 */
const goToPrevious = () => navigate('previous');

/**
 * Переход к следующему субтитру
 */
const goToNext = () => navigate('next');
</script>

<style scoped>
.workspace-footer {
  position: sticky;
  bottom: 0;
  z-index: 50;
}
</style>
