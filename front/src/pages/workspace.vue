<template>
  <div
    class="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen text-white workspace"
  >
    <!-- Состояние: загрузка данных из sessionStorage -->
    <div v-if="isLoading" class="flex justify-center items-center h-screen">
      <div class="text-center">
        <div class="relative mb-6">
          <div
            class="flex justify-center items-center bg-slate-700/50 mx-auto rounded-full w-24 h-24"
          >
            <svg
              class="w-12 h-12 text-blue-400 animate-spin-reverse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
        </div>
        <h2 class="mb-2 font-semibold text-white text-xl">Загружаем данные</h2>
        <p class="text-slate-400">Подготовка приложения...</p>
      </div>
    </div>

    <!-- Состояние: нет загруженных субтитров -->
    <div v-else-if="!hasData" class="flex justify-center items-center h-screen">
      <div class="text-center">
        <div
          class="flex justify-center items-center bg-slate-700/50 mx-auto mb-6 rounded-full w-24 h-24"
        >
          <svg
            class="w-12 h-12 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h2 class="mb-2 font-semibold text-white text-xl">
          Сначала загрузите файл
        </h2>
        <p class="mb-6 text-slate-400">
          Перейдите на главную страницу и загрузите файл субтитров
        </p>
        <button
          @click="goToMainPage"
          class="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg font-medium text-white transition-colors duration-200"
        >
          Перейти к загрузке
        </button>
      </div>
    </div>

    <!-- Состояние: основной рабочий интерфейс -->
    <div v-else class="flex flex-col h-screen">
      <!-- Workspace Header -->
      <WorkspaceHeader @search="handleSearch" />

      <!-- Основное содержимое -->
      <div class="flex flex-1 min-h-0 overflow-hidden workspace-content">
        <!-- Левая колонка - Timeline субтитров -->
        <div
          class="flex flex-col bg-slate-800/50 border-slate-700/50 border-r w-96 h-full min-h-0"
        >
          <SubtitleTimeline v-model="selectedSubtitleIndex" />
        </div>

        <!-- Правая колонка - Детальный анализ -->
        <div class="flex-1 bg-slate-900 min-h-0 overflow-hidden">
          <AnalysisPanel v-model="selectedSubtitleIndex" />
        </div>
      </div>

      <!-- Footer с навигацией -->
      <WorkspaceFooter v-model="selectedSubtitleIndex" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useSubtitleStore } from "@/entities/subtitle";
import {
  WorkspaceHeader,
  SubtitleTimeline,
  AnalysisPanel,
  WorkspaceFooter,
} from "@/widgets";

const subtitleStore = useSubtitleStore();

// Константы для специальных значений состояния
const NO_SELECTION = -1 as const;

const selectedSubtitleIndex = ref<number | undefined>(undefined);

const hasData = computed(() => subtitleStore.hasSubtitles);
const isLoading = computed(() => subtitleStore.isLoading);

/**
 * Переход на главную страницу загрузки файлов
 * Используется когда нет загруженных субтитров
 */
const goToMainPage = async () => {
  await navigateTo("/");
};

/**
 * Обработка поискового запроса от WorkspaceHeader
 * Обновляет поисковый запрос в store для фильтрации субтитров
 * @param query - поисковый запрос пользователя
 */
const handleSearch = (query: string) => {
  subtitleStore.setSearchQuery(query);
};

watch(
  hasData,
  (newHasData) => {
    if (newHasData && selectedSubtitleIndex.value === undefined) {
      selectedSubtitleIndex.value = NO_SELECTION;
    }
  },
  { immediate: true }
);
</script>

<style scoped>
/* Workspace стили */
.workspace {
  min-height: 100vh;
}

/* Анимация вращения в обратную сторону для загрузки */
.animate-spin-reverse {
  animation: spin-reverse 1s linear infinite;
}

@keyframes spin-reverse {
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0deg);
  }
}
</style>