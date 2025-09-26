<template>
  <header class="flex justify-between items-center bg-slate-800/80 backdrop-blur-sm px-6 border-slate-700/50 border-b h-20 workspace-header">
    <!-- Левая часть - логотип и навигация -->
    <div class="flex items-center gap-4">
      <button
        @click="goBack"
        class="flex items-center gap-2 text-slate-400 hover:text-white transition-colors duration-200"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        <span class="font-medium text-sm">Назад</span>
      </button>

      <div class="bg-slate-700 w-px h-6"></div>

      <div class="flex items-center gap-3">
        <div class="flex justify-center items-center bg-blue-500 rounded-lg w-8 h-8">
          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd"/>
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
          class="bg-slate-700/50 px-4 py-2 pl-10 border border-slate-600/50 focus:border-blue-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-full text-white text-sm placeholder-slate-400"
        >
        <svg class="top-1/2 left-3 absolute w-4 h-4 text-slate-400 -translate-y-1/2 transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      </div>
    </div>

    <!-- Правая часть - Статус и информация о файле -->
    <div class="flex items-center gap-4">
      <!-- Статус сервиса -->
      <div class="flex items-center gap-2">
        <div
          :class="[
            'w-2 h-2 rounded-full',
            isApiAvailable ? 'bg-green-400' : 'bg-red-400'
          ]"
        ></div>
        <span class="text-slate-300 text-sm">
          {{ isApiAvailable ? 'Сервис доступен' : 'Сервис недоступен' }}
        </span>
      </div>

      <div class="bg-slate-700 w-px h-6"></div>

      <!-- Информация о файле -->
      <div class="text-right">
        <p class="font-medium text-white text-sm">{{ filename || 'Файл не загружен' }}</p>
        <p class="text-slate-400 text-xs">
          {{ subtitlesCount }} {{ subtitlesCount === 1 ? 'субтитр' : subtitlesCount < 5 ? 'субтитра' : 'субтитров' }}
        </p>
      </div>

    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useFileUpload } from '@/features/file-upload'

const emit = defineEmits<{
  'search': [query: string]
}>()

// Данные из composable
const {
  filename,
  subtitles,
  checkApiHealth
} = useFileUpload()

// Локальное состояние
const searchQuery = ref('')
const isApiAvailable = ref(false)

// Вычисляемые свойства
const subtitlesCount = computed(() => subtitles.value.length)

// Методы
const goBack = () => {
  // Навигация назад к главной странице
  window.history.back()
}

// Проверка доступности API при монтировании
const checkApiStatus = async () => {
  isApiAvailable.value = await checkApiHealth()
}

// Следим за изменениями в поиске
watch(searchQuery, (newQuery) => {
  // Отправляем поисковый запрос в родительский компонент
  emit('search', newQuery)
})
</script>

<style scoped>
/* Workspace Header стили */
.workspace-header {
  position: sticky;
  top: 0;
  z-index: 50;
}
</style>
