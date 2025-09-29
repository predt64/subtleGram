<template>
  <header
    class="flex justify-between items-center bg-slate-800/80 backdrop-blur-sm px-6 border-slate-700/50 border-b h-20 workspace-header"
  >
    <!-- Левая часть - логотип и навигация -->
    <div class="flex items-center gap-4">
      <button
        @click="goBack"
        class="flex items-center gap-2 text-slate-400 hover:text-white transition-colors duration-200"
      >
        <svg
          class="w-5 h-5"
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

      <div class="bg-slate-700 w-px h-6"></div>

      <div class="flex items-center gap-3">
        <div
          class="flex justify-center items-center bg-blue-500 rounded-lg w-8 h-8"
        >
          <svg
            class="w-4 h-4 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div>
          <h1 class="font-semibold text-white text-lg">SubtleGram</h1>
          <p class="text-slate-400 text-xs">Анализ субтитров</p>
        </div>
      </div>
    </div>

    <!-- Центральная часть - Поиск -->
    <div class="flex-1 mx-8 max-w-md">
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск по субтитрам..."
          class="bg-slate-700/50 px-4 py-2 pr-10 pl-10 border border-slate-600/50 focus:border-blue-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-full text-white text-sm placeholder-slate-400"
        />
        <svg
          class="top-1/2 left-3 absolute w-4 h-4 text-slate-400 -translate-y-1/2 transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <!-- Крестик для очистки -->
        <button
          v-if="searchQuery"
          @click="clearSearch"
          class="top-1/2 right-3 absolute flex justify-center items-center w-4 h-4 text-slate-400 hover:text-slate-300 transition-colors -translate-y-1/2 transform"
        >
          <svg
            class="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Правая часть - Статус и информация о файле -->
    <div class="flex items-center gap-4">
      <!-- Статус сервиса -->
      <div class="flex items-center gap-2">
        <div :class="['w-2 h-2 rounded-full', apiStatus.colorClass]"></div>
        <span class="text-slate-300 text-sm">
          {{ apiStatus.text }}
        </span>
      </div>

      <div class="bg-slate-700 w-px h-6"></div>

      <!-- Информация о файле -->
      <div class="text-right">
        <p class="font-medium text-white text-sm">{{ fileInfo.name }}</p>
        <p class="text-slate-400 text-xs">
          {{ fileInfo.subtitleText }}
        </p>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useSubtitleStore } from "@/shared/stores/subtitle";
import { subtitlesApi } from "@/shared/api";

const emit = defineEmits<{
  search: [query: string];
}>();

const subtitleStore = useSubtitleStore();

const searchQuery = ref("");
const isApiAvailable = ref(false);

const subtitlesCount = computed(() => subtitleStore.subtitles.length);

/**
 * Форматированный текст количества субтитров
 */
const subtitlesText = computed(() => {
  const count = subtitlesCount.value;
  if (count === 1) return "1 субтитр";
  if (count < 5) return `${count} субтитра`;
  return `${count} субтитров`;
});

/**
 * Статус API в виде объекта
 */
const apiStatus = computed(() => ({
  available: isApiAvailable.value,
  text: isApiAvailable.value ? "Сервис доступен" : "Сервис недоступен",
  colorClass: isApiAvailable.value ? "bg-green-400" : "bg-red-400",
}));

/**
 * Информация о файле
 */
const fileInfo = computed(() => ({
  name: subtitleStore.filename || "Файл не загружен",
  subtitleText: subtitlesText.value,
}));

const goBack = async () => {
  await navigateTo("/");
};

const clearSearch = () => {
  searchQuery.value = "";
};

// Debounce для поиска (предотвращает слишком частые запросы)
let searchTimeout: NodeJS.Timeout | null = null;

/**
 * Следим за изменениями в поисковом запросе
 * Синхронизирует локальное состояние с родительским компонентом и store
 * Использует debounce для оптимизации производительности
 */
watch(searchQuery, (newQuery) => {
  if (searchTimeout) clearTimeout(searchTimeout);

  searchTimeout = setTimeout(() => {
    emit("search", newQuery);
    subtitleStore.setSearchQuery(newQuery);
  }, 300);
});

onMounted(async () => {
  try {
    await subtitlesApi.checkHealth();
    isApiAvailable.value = true;
  } catch {
    isApiAvailable.value = false;
  }
});
</script>

<style scoped>
.workspace-header {
  position: sticky;
  top: 0;
  z-index: 50;
}
</style>
